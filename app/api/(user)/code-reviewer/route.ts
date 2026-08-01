import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST = async (req: NextRequest) => {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const ReqBody = await req.json();
  const { language, code } = ReqBody;

  const prompt = `Analyze and evaluate the following code, providing a structured JSON response. The user has provided the code and the programming language. Your response MUST be a valid JSON object with the following keys: 

\`output\` (string): The standard output of the executed code. If there is no output, use \`null\`.
\`error\` (string): Any error message generated during code execution. If there is no error, use \`null\`.
\`correctedCode\` (string or null): If there was an error, provide corrected code. If no correction is needed, use \`null\`.
\`review\` (string): A detailed review of the code, which includes explanations, improvements, or suggestions.
\`rating\` (number): A numerical rating (out of 10) based on correctness, efficiency, and readability.

**Instructions:**

1. **Code Execution:** Execute the provided code in the specified language. Capture the standard output and standard error.
2. **Error Handling:**
    - If the code executes successfully, the \`error\` field should be \`null\`.
    - If there are errors, provide the error message in the \`error\` field.
3. **Corrected Code (Only if Errors):**
    - If there are errors, provide the corrected code in the \`correctedCode\` field.
    - If there are no errors, set \`correctedCode\` to \`null\`.
4. **Code Review and Suggestions:** Provide a detailed review of the code in the \`review\` field, including:
    - A short explanation of what the code does.
    - Identification of potential issues (e.g., performance bottlenecks, security vulnerabilities, code style issues).
    - Suggestions for improvement (e.g., better algorithms, more efficient data structures, improved readability).
5. **Rating:** Provide a rating out of 10, based on the overall quality of the code.

**Input:**
\`\`\`
code: of ${language} given: ${JSON.stringify(code)}
\`\`\`

The output should be a valid JSON object. Here’s an example format of what the response should look like:

\`\`\`
{
  "output": "Hello, World!",
  "error": null,
  "correctedCode": null,
  "review": "The code runs as expected and prints 'Hello, World!' to the console.",
  "rating": 9
}
\`\`\`
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    const result = await model.generateContent(prompt);

    // Log the raw response to check if it's valid JSON
    const responseText = result.response.text();
    // console.log("Raw response from the model:", responseText);
    const jsonResponseText = responseText.replace(/```json|```/g, '').trim();

    // Try parsing the response text after removing Markdown formatting
    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonResponseText);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return NextResponse.json({ error: "The response from the model was not valid JSON." });
    }

    // Return the parsed JSON directly if it's valid
    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "An error occurred while generating the code review." });
  }
};
