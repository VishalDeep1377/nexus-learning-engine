'use client';

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ShuffleHero = () => {
  const router=useRouter();
  return (
    <section className="w-full px-8 py-12 grid grid-cols-1 md:grid-cols-2 items-center gap-8 max-w-6xl mx-auto ">
      <div>
        <span className="block mb-4 text-xs md:text-sm text-indigo-500 font-medium">
          Better every day
        </span>
        <h3 className="text-4xl md:text-6xl font-semibold">
          Let's change it up a bit
        </h3>
        <p className="text-base md:text-lg text-slate-700 my-4 md:my-6">
         Change the way we learn to code 
        </p>
        <button className="bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-all hover:bg-indigo-600 active:scale-95" onClick={()=>router.push("/auth/login")}>
          Experience Now
        </button>
      </div>
      <ShuffleGrid />
    </section>
  );
};

const shuffle = (array: any) => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const squareData = [
  {
    id: 1,
    src: "https://img.freepik.com/free-vector/programmers-using-javascript-programming-language-computer-tiny-people-javascript-language-javascript-engine-js-web-development-concept-bright-vibrant-violet-isolated-illustration_335657-986.jpg?t=st=1739626865~exp=1739630465~hmac=4d7c9db00f77fd3caa875126122e068e5e2675c7186d09be53058a27dc870923&w=1060",
  },
  {
    id: 2,
    src: "https://img.freepik.com/premium-vector/web-designing-coding-programmer-concept_662093-263.jpg?w=740",
  },
  {
    id: 3,
    src: "https://img.freepik.com/premium-vector/java-vector-icon-design-illustration_1174953-24201.jpg?w=740",
  },
  {
    id: 4,
    src: "https://img.freepik.com/premium-vector/portrait-programmer-working-with-pc_23-2148217001.jpg?w=740",
  },
  {
    id: 5,
    src: "https://img.freepik.com/free-vector/creative-abstract-ssl-illustration_52683-79682.jpg?t=st=1739627127~exp=1739630727~hmac=4ee1cc4140a8100b1760ad2d51934c763c28c333e9ddc0b192cb375b5c558275&w=740",
  },
  {
    id: 6,
    src: "https://img.freepik.com/premium-vector/hand-drawn-flat-design-api-illustration_23-2149375790.jpg?w=740",
  },
  {
    id: 7,
    src: "https://img.freepik.com/free-vector/cloud-big-data-background_23-2148007811.jpg?t=st=1739627235~exp=1739630835~hmac=b6dc63e7942ad43f26ba2853f2c4eaeda8670b14ba268031c565c14254888a87&w=740",
  },
  {
    id: 8,
    src: "https://img.freepik.com/premium-vector/data-protection-landing-page-template_23-2148540349.jpg?w=1060",
  },
  {
    id: 9,
    src: "https://img.freepik.com/premium-vector/data-analysis-background-design_23-2151908047.jpg?w=1060",
  },
  {
    id: 10,
    src: "https://img.freepik.com/free-vector/isometric-data-visualization-elements-background_23-2148097342.jpg?t=st=1739627388~exp=1739630988~hmac=4d0053548010e26a3842b240ce845bbbab1ee67d96ba918f8a2477b70d225327&w=740",
  },
  {
    id: 11,
    src: "https://img.freepik.com/premium-vector/ai-robot-illustration_52683-176519.jpg?w=740",
  },
  {
    id: 12,
    src: "https://img.freepik.com/free-vector/template-landing-page-artificial-intelligence_23-2148359196.jpg?t=st=1739627491~exp=1739631091~hmac=a25a2c8aa22ca6d9b22ff514148fb0d1208d5830d5fd6098d7ba47c387b34102&w=1060",
  },
  {
    id: 13,
    src: "https://img.freepik.com/free-vector/isometric-npl-illustration_23-2149260763.jpg?t=st=1739627520~exp=1739631120~hmac=3818c3cea68c42ff015c8d10941c3f658ff0a500e98d683d59d4f8f711201340&w=1060",
  },
  {
    id: 14,
    src: "https://img.freepik.com/free-photo/person-working-html-computer_23-2150038859.jpg?t=st=1739627543~exp=1739631143~hmac=22f3068fbc262ce9b9d642e1aadfce2d15224f11c8c526e96379446a1850319e&w=900",
  },
  {
    id: 15,
    src: "https://img.freepik.com/premium-vector/app-development-illustration_23-2148741543.jpg?w=740",
  },
  {
    id: 16,
    src: "https://img.freepik.com/free-photo/html-css-collage-concept-with-hacker_23-2150061984.jpg?t=st=1739627645~exp=1739631245~hmac=eb248110568791300d51311c0fff3f6b8f8c19d9a00543809a334b2996408d73&w=1060",
  },
];

const generateSquares = () => {
  return shuffle(squareData).map((sq: { id: number; src: string }) => (
    <motion.div
      key={sq.id}
      layout
      transition={{ duration: 1.5, type: "spring" }}
      className="w-full h-full"
      style={{
        backgroundImage: `url(${sq.src})`,
        backgroundSize: "cover",
      }}
    ></motion.div>
  ));
};

const ShuffleGrid = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [squares, setSquares] = useState(generateSquares());

  useEffect(() => {
    shuffleSquares();

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const shuffleSquares = () => {
    setSquares(generateSquares());

    timeoutRef.current = setTimeout(shuffleSquares, 3000);
  };

  return (
    <div className="grid grid-cols-4 grid-rows-4 h-[450px] gap-1">
      {squares.map((sq: { id: number; src: string }) => sq)}
    </div>
  );
};

export default ShuffleHero;