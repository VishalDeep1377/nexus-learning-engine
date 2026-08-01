"use client";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const LearningMethod = () => {
  const {userData}=useUserStore();
  const TotalRoadmaps=userData?.roadmaps?.length;
  const [formStatus, setFormStatus] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [learningMethod, setLearningMethod] = useState("");
  const [outcome, setOutcome] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const router=useRouter();

useEffect(()=>{
if(TotalRoadmaps>=3){
  toast.error("max roadmaps limit exceeded");
  router.push('/roadmaps');
}
},[])


  const handleNextStep = () => {
    setError("");
    if (formStatus === 0 && !selectedSkill) {
      setError("Please select a programming language.");
      return;
    }
    if (formStatus === 1 && !learningMethod) {
      setError("Please select a learning method.");
      return;
    }
    if (formStatus === 2 && !selectedExperience) {
      setError("Please select your experience level.");
      return;
    }
    if (formStatus === 3 && !outcome) {
      setError("Please select your desired outcome.");
      return;
    }

    if (formStatus < 4) setFormStatus(formStatus + 1);
  };

  const handlePreviousStep = () => {
    if (formStatus > 0) setFormStatus(formStatus - 1);
  };

  // handling submission with final form data
  const handlePreferences = async (e: React.FormEvent) => {
    e.preventDefault();

    // Handle the "Other" skill case
    const skillToSend = selectedSkill === "Other" ? customSkill : selectedSkill;

    try {
      const response = await axios.post("/api/roadmap", {
        skill: skillToSend,
        experience: selectedExperience,
        learningPreference: learningMethod,
        expectedOutcome: outcome,
      });

      const respData = response.data;
      toast.success("roadmap created successfully");
      router.push('/roadmaps');
    } catch (error) {
      console.log("error in submitting learning methods", error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-800">
      {/* Main Form */}
      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-lg flex flex-col gap-5 p-8 w-[90vh] min-h-[70vh] relative">
        {/* Learning Preference Modal */}
        {formStatus === 1 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Learning Preference
            </h2>
            <h3 className="text-xl font-semibold mb-6 text-center">
              How do you prefer to learn?
            </h3>
            <div className="flex flex-col space-y-4">
              {[
                "Hands-on Projects",
                "Theoretical Knowledge",
                "Interactive Challenges",
                "Self learning",
              ].map((method) => (
                <label className="flex items-center" key={method}>
                  <input
                    type="radio"
                    name="learning"
                    value={method}
                    onChange={(e) => setLearningMethod(e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>
        )}

        {/* Learning Outcome Modal */}
        {formStatus === 3 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Learning Outcome
            </h2>
            <h3 className="text-xl font-semibold mb-6 text-center">
              How do you want to achieve through your learning?
            </h3>
            <div className="flex flex-col space-y-4">
              {[
                "College exams",
                "Technical Interview",
                "Contribute to Open-Source",
                "Skill Enhancement",
              ].map((method) => (
                <label className="flex items-center" key={method}>
                  <input
                    type="radio"
                    name="outcome"
                    value={method}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>
        )}

        {/* Experience Level Modal */}
        {formStatus === 2 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 pt-4 text-center">
              Experience Level
            </h2>
            <h3 className="text-xl font-semibold mb-6 text-center">
              How experienced are you with this language?
            </h3>
            <div className="flex flex-col space-y-4 mb-6">
              {["None", "Beginner", "Intermediate", "Advanced", "Expert"].map(
                (level) => (
                  <label className="flex items-center" key={level}>
                    <input
                      type="radio"
                      name="experience"
                      value={level}
                      onChange={(e) => setSelectedExperience(e.target.value)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <span>{level}</span>
                  </label>
                )
              )}
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>
        )}

        {/* Main Form (Step 1) */}
        {formStatus === 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Choose Your Path
            </h2>
            <blockquote className="text-gray-600 italic mb-6 text-center">
              "The best way to predict the future is to invent it." - Alan Kay
            </blockquote>
            <h3 className="text-xl font-semibold mb-6 text-center">
              Which Programming Language Do You Want to Learn?
            </h3>
            <div className="flex flex-col space-y-4 mb-6">
              {["JavaScript", "Python", "Java", "Ruby", "Go", "Other"].map(
                (language) => (
                  <label className="flex items-center" key={language}>
                    <input
                      type="radio"
                      name="language"
                      value={language}
                      onChange={(e) => setSelectedSkill(e.target.value)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{language}</span>
                  </label>
                )
              )}
            </div>
            {selectedSkill === "Other" && (
              <input
                type="text"
                placeholder="Please specify..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                className="border border-gray-300 dark:text-white text-black rounded-lg p-2 mb-4 w-full"
              />
            )}
          </div>
        )}

        {/* Final Step: Submit Form */}
        {formStatus === 4 && (
          <p className="text-center text-gray-700 mb-6 ">
            You have selected:{" "}
            <strong>{selectedSkill || "No selection"}</strong> <br />
            Learning Method: <strong>{learningMethod}</strong> <br />
            Experience Level:{" "}
            <strong>{selectedExperience || "No selection"}</strong> <br />
            Outcome : <strong>{outcome}</strong> <br />
            Click "Submit" to complete your preference selection.
          </p>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between space-x-4">
          {formStatus === 4 ? (
            <button
              onClick={handlePreferences}
              className="py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200"
            >
              Submit Preferences
            </button>
          ) : (
            <>
              {formStatus > 0 && (
                <button
                  onClick={handlePreviousStep}
                  className="py-3 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition duration-200"
                >
                  Previous
                </button>
              )}
              {formStatus === 3 ? (
                <button
                  onClick={handlePreferences}
                  className="py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200"
                >
                  Submit Preferences
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Next Step
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningMethod;
   