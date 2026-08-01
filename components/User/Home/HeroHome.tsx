"use client";
import { motion } from "framer-motion";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useEffect, useState } from "react";


export function HeroHome() {
  const router=useRouter();
  const {userData}=useUserStore();
  const totalRoadmpas=userData?.roadmaps?.length;

  return (
    <HeroHighlight>
      <motion.h1
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: [20, -5, 0],
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto "
      >
        With CodeToCarrer, Learning&apos;s Fun. Everything is made easy. Foucs is on making you
        {" "}
        <Highlight className="text-black dark:text-white mb-2">
          Top 1%, coder.
        </Highlight>
        <br />
        <button className="bg-indigo-500 text-white font-medium px-1 md:py-2 md:px-4 rounded transition-all hover:bg-indigo-600 active:scale-95 mt-2" onClick={totalRoadmpas==0?()=>router.push('/learning-path'):()=>router.push('/roadmaps')}>Get your Path</button>
      </motion.h1>
    </HeroHighlight>
  );
}
