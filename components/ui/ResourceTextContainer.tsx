interface ResourceDetails {
  link: string;
  description: string;
}

interface LanguageResources {
  [key: string]: ResourceDetails;
}

interface Resources {
  [key: string]: LanguageResources;
}

const ResourceTextContainer = ({ selectedLanguage }: { selectedLanguage: string }) => {
  const resources: Resources = {
    python: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/python-programming-language-tutorial/",
        description: "Comprehensive Python tutorials covering basics to advanced topics.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/python-tutorial",
        description: "Detailed explanations with examples and exercises.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/python/index.htm",
        description: "Step-by-step Python guide with interactive examples.",
      },
      w3schools: {
        link: "https://www.w3schools.com/python/default.asp",
        description: "Easy-to-follow tutorials with practice exercises.",
      },
    },
    java: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/java/",
        description: "Covers Java fundamentals and advanced topics.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/java-tutorial",
        description: "Detailed Java concepts with real-world examples.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/java/index.htm",
        description: "Step-by-step guide to Java programming.",
      },
      w3schools: {
        link: "https://www.w3schools.com/java/default.asp",
        description: "Interactive Java tutorials with practice exercises.",
      },
    },
    cpp: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/c-plus-plus/",
        description: "Learn C++ programming with examples and projects.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/cpp-tutorial",
        description: "Comprehensive C++ tutorials with coding exercises.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/cplusplus/index.htm",
        description: "Structured C++ learning with clear explanations.",
      },
      w3schools: {
        link: "https://www.w3schools.com/cpp/default.asp",
        description: "Beginner-friendly C++ guides and quizzes.",
      },
    },
    c: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/c-programming-language/",
        description: "Fundamental C programming concepts.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/c-programming-language-tutorial",
        description: "Detailed C tutorials for absolute beginners.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/cprogramming/index.htm",
        description: "C programming tutorials with exercises.",
      },
      w3schools: {
        link: "https://www.w3schools.com/c/index.php",
        description: "Learn C programming with hands-on examples.",
      },
    },
    javascript: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/javascript/",
        description: "Master JavaScript with step-by-step tutorials.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/javascript-tutorial",
        description: "JavaScript tutorials with real-world examples.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/javascript/index.htm",
        description: "Structured JavaScript learning path.",
      },
      w3schools: {
        link: "https://www.w3schools.com/js/default.asp",
        description: "JavaScript exercises and interactive lessons.",
      },
    },
    html: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/html-tutorial/",
        description: "Comprehensive HTML learning from basics to advanced.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/html-tutorial",
        description: "HTML tutorials with structured explanations.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/html/index.htm",
        description: "Step-by-step HTML guide.",
      },
      w3schools: {
        link: "https://www.w3schools.com/html/default.asp",
        description: "Interactive HTML tutorials with practice sections.",
      },
    },
    css: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/css-tutorial/",
        description: "CSS tutorials covering styling techniques.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/css-tutorial",
        description: "Learn CSS with practical examples.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/css/index.htm",
        description: "Step-by-step CSS guide.",
      },
      w3schools: {
        link: "https://www.w3schools.com/css/default.asp",
        description: "Interactive CSS tutorials.",
      },
    },
    react: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/react/",
        description: "React tutorials from beginner to advanced level.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/reactjs-tutorial",
        description: "ReactJS learning path with hands-on projects.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/reactjs/index.htm",
        description: "Complete ReactJS guide.",
      },
      w3schools: {
        link: "https://www.w3schools.com/react/default.asp",
        description: "Interactive React tutorials.",
      },
    },
    angular: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/angular-tutorial/",
        description: "Learn Angular with structured tutorials.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/angular-8",
        description: "Angular 8 and above tutorials.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/angular/index.htm",
        description: "Complete Angular learning path.",
      },
      w3schools: {
        link: "https://www.w3schools.com/angular/default.asp",
        description: "Interactive Angular tutorials.",
      },
    },
    node: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/nodejs/",
        description: "Master Node.js with detailed guides.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/nodejs-tutorial",
        description: "Learn Node.js with practical examples.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/nodejs/index.htm",
        description: "Structured Node.js learning.",
      },
      w3schools: {
        link: "https://www.w3schools.com/nodejs/default.asp",
        description: "Interactive Node.js tutorials.",
      },
    },
    express: {
      geekforgeeks: {
        link: "https://www.geeksforgeeks.org/express-js/",
        description: "Express.js tutorials for backend development.",
      },
      javatpoint: {
        link: "https://www.tpointtech.com/expressjs-tutorial",
        description: "Comprehensive Express.js learning.",
      },
      tutorialspoint: {
        link: "https://www.tutorialspoint.com/expressjs/index.htm",
        description: "Learn Express.js from basics to advanced.",
      },
    },
  };
  return (
    <>
      <div className="bg-white dark:bg-slate-900 p-4 rounded-md shadow-md max-w-[100vh] mx-auto my-auto mt-5 mb-5">
        <h3 className="text-xl font-bold font-mono text-gray-700 dark:text-white">
          Resources for {selectedLanguage.toUpperCase()}
        </h3>
        <ul className="mt-3">
          {Object.entries(resources[selectedLanguage]).map(
            ([provider, { link, description }]) => (
              <li key={provider} className="mb-5 p-3 border-b last:border-none">
                <h4 className="text-lg font-medium ">
                  {provider.toUpperCase()}
                </h4>
                <p className="text-sm my-3 dark:text-slate-50 text-gray-600">{description}</p>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-blue-700"
                >
                  Visit {provider}
                </a>
              </li>
            )
          )}
        </ul>
      </div>
    </>
  );
};
export default ResourceTextContainer;
