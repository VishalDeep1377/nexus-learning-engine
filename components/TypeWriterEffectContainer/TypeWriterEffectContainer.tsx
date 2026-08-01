"use client";
import { TypewriterEffect } from "../ui/typewriter-effect";

const TypewriterEffectContainer= ()=> {
  const words = [
    {
      text: "Write",
    },
    {
      text: "awesome",
    },
    {
      text: "code",
    },
    {
      text: "with",
    },
    {
      text: "our"
    },
    {
      text: "Code Reviewer.",
      className: "text-blue-500 dark:text-blue-500",
    },
  ];
  return (
    <div className="flex flex-col items-center justify-center ">
      <p className="text-neutral-600 dark:text-neutral-200 text-base mt-5">
        The road to Coding starts from here
      </p>
      <TypewriterEffect words={words} />
      
    </div>
  );
}

export default TypewriterEffectContainer;
