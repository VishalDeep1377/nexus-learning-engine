'use client';

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import { registerServiceWorker } from "./sw-register";

// Dynamically import the PWA install prompt component to avoid SSR issues
const PwaInstallPrompt = dynamic(
  () => import("./components/PwaInstallPrompt"),
  { ssr: false }
);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Default to light mode if no preference is saved
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Update the theme in localStorage when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  return (
    <>
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      {children}
      <Footer />
      <PwaInstallPrompt />
    </>
  );
} 