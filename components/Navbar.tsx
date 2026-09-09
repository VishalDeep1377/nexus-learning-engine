'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { IoHome } from "react-icons/io5";
import { Trophy, Code2, Mic, Brain, ClipboardCheck, ChevronDown, ArrowRight, BarChart3 } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const SELF_ASSESSMENT_ITEMS = [
  {
    href: '/self-assessment/coding-lab',
    icon: Code2,
    label: 'Coding Lab',
    desc: 'AI challenges & real evaluation',
    color: 'from-purple-500 to-violet-500',
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    iconColor: 'text-purple-500',
    hoverBorder: 'hover:border-purple-500/40',
    hoverGlow: 'hover:shadow-purple-500/10',
  },
  {
    href: '/self-assessment/speech-practice',
    icon: Mic,
    label: 'Speech Practice',
    desc: 'Interview coaching with AI',
    color: 'from-pink-500 to-rose-500',
    iconBg: 'bg-pink-500/10 dark:bg-pink-500/20',
    iconColor: 'text-pink-500',
    hoverBorder: 'hover:border-pink-500/40',
    hoverGlow: 'hover:shadow-pink-500/10',
  },
  {
    href: '/self-assessment/smart-quizzes',
    icon: ClipboardCheck,
    label: 'Smart Quizzes',
    desc: 'Personalized knowledge testing',
    color: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-500',
    hoverBorder: 'hover:border-blue-500/40',
    hoverGlow: 'hover:shadow-blue-500/10',
  },
  {
    href: '/self-assessment/aptitude',
    icon: Brain,
    label: 'Aptitude Arena',
    desc: 'Placement-level practice',
    color: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-500',
    hoverBorder: 'hover:border-amber-500/40',
    hoverGlow: 'hover:shadow-amber-500/10',
  },
];

function SelfAssessmentDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSelfAssessmentActive = pathname?.startsWith('/self-assessment');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger */}
      <button
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          isSelfAssessmentActive
            ? 'text-indigo-500 dark:text-indigo-400'
            : 'text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400'
        }`}
      >
        <Brain className="w-4 h-4" />
        Self Assessment
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Premium dropdown panel */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] transition-all duration-200 origin-top ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Panel */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/20 dark:shadow-black/60">
          {/* Gradient accent top bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 pb-1">
              Assessment Tools
            </p>

            {SELF_ASSESSMENT_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-700/40'
                      : `border-transparent hover:bg-slate-50 dark:hover:bg-white/5 ${item.hoverBorder} hover:shadow-sm ${item.hoverGlow}`
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    <Icon className={`w-4 h-4 ${item.iconColor}`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-none mb-0.5 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    } transition-colors`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-none">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-3 pb-3">
            <Link
              href="/self-assessment/performance"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/40 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-950/60 dark:hover:to-purple-950/60 transition-all group"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Performance Dashboard</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar({ isDarkMode, setIsDarkMode }: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileAssessmentOpen, setMobileAssessmentOpen] = useState(false);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const { userData, setUserData, logoutUser } = useUserStore();
  useEffect(() => {
    try {
      setUserData();
    } catch (error) {}
  }, []);

  return (
    <div className="navbar sticky top-0 w-full dark:bg-black/70 bg-white/70 backdrop-blur-sm shadow-md z-50 dark:text-white text-black">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>

          {/* Mobile menu */}
          {session ? (
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-64 p-2 shadow">
              <li><Link href={"/home"}>Home</Link></li>
              <li>
                <Link href={"/dashboard"}>dashboard</Link>
                <ul className="p-2">
                  <li><Link href={"/AiMentor"}>Ai Mentor</Link></li>
                  <li><Link href={"/code-reviewer"}>code editor</Link></li>
                </ul>
              </li>
              <li><Link href={"/learning-path"}>Learning paths</Link></li>
              <li>
                <Link href={"/hackathons"} className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  Hackathons
                </Link>
              </li>

              {/* Mobile Self Assessment */}
              <li>
                <button
                  className="flex items-center justify-between w-full"
                  onClick={() => setMobileAssessmentOpen(!mobileAssessmentOpen)}
                >
                  <span className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-500" />
                    Self Assessment
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileAssessmentOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileAssessmentOpen && (
                  <ul className="p-2 border-l-2 border-indigo-200 dark:border-indigo-800 ml-2 space-y-1">
                    {SELF_ASSESSMENT_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link href={item.href} className="flex items-center gap-2 py-1.5">
                            <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                    <li>
                      <Link href="/self-assessment/performance" className="flex items-center gap-2 py-1.5 text-indigo-600">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="text-sm font-semibold">Performance</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <br />
              <p>more...</p>
              <ul className="p-2">
                <li><Link href={"/technews"}>Tech News</Link></li>
                <li><Link href={"/learners-community"}>learners community</Link></li>
                <li><Link href={"/job-search"}>Job Search</Link></li>
              </ul>
            </ul>
          ) : (
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
              <li><Link href={"/"}>Home</Link></li>
              <li><Link href={"/"}>Login</Link></li>
            </ul>
          )}
        </div>

        {session ? (
          <Link href={"/home"} className="flex items-center gap-2">
            <Image src="/icons/icon-144x144.png" alt="CodeToCareer Logo" width={32} height={32} className="hidden lg:block" />
            <h1 className="text-xl font-semibold">CodeToCareer</h1>
          </Link>
        ) : (
          <Link href={"/"} className="flex items-center gap-2">
            <Image src="/icons/icon-144x144.png" alt="CodeToCareer Logo" width={32} height={32} className="hidden lg:block" />
            <h1>CodeToCareer</h1>
          </Link>
        )}
      </div>

      {session ? (
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 text-base font-medium items-center">
            <li><Link href={"/learning-path"} className="px-4 py-2 hover:text-blue-600 transition-colors">Learning paths</Link></li>
            <li className="dropdown dropdown-hover">
              <div tabIndex={0} role="button" className="px-4 py-2 hover:text-blue-600 transition-colors">Learning</div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 dark:bg-black rounded-box w-52">
                <li><Link href={"/AiMentor"} className="hover:text-blue-600 transition-colors">AI Mentor</Link></li>
                <li><Link href={"/interview"} className="hover:text-blue-600 transition-colors">Interview</Link></li>
              </ul>
            </li>

            <li><Link href={"/code-reviewer"} className="px-4 py-2 hover:text-blue-600 transition-colors">Code Editor</Link></li>

            <li>
              <Link
                href={"/hackathons"}
                className={`flex items-center gap-1.5 px-4 py-2 hover:text-yellow-500 transition-colors ${
                  pathname?.startsWith('/hackathons') ? 'text-yellow-500 font-semibold' : ''
                }`}
              >
                <Trophy className="w-4 h-4" />
                Hackathons
              </Link>
            </li>

            {/* Self Assessment — fully custom dropdown */}
            <li className="relative flex items-center">
              <SelfAssessmentDropdown pathname={pathname || ''} />
            </li>

            <li className="dropdown dropdown-hover">
              <div tabIndex={0} role="button" className="px-4 py-2 hover:text-blue-600 transition-colors">More</div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 dark:bg-black rounded-box w-52">
                <li><Link href={"/technews"} className="hover:text-blue-600 transition-colors">Tech News</Link></li>
                <li><Link href={"/learners-community"} className="hover:text-blue-600 transition-colors">learners community</Link></li>
                <li><Link href={"/job-search"}>Job Search</Link></li>
                <li><Link href={"/profile"} className="hover:text-blue-600 transition-colors">profile</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      ) : (
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><a>Home</a></li>
            <li><a>About</a></li>
          </ul>
        </div>
      )}

      <div className="navbar-end flex gap-2">
        {session ? (
          <button
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            onClick={() => signOut()}
          >
            Logout
          </button>
        ) : (
          <button
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            onClick={() => router.push("/auth/login")}
          >
            Login
          </button>
        )}
        <label className="swap swap-rotate">
          <input type="checkbox" checked={isDarkMode} onChange={handleThemeToggle} />
          <svg className="swap-on h-10 w-10 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          <svg className="swap-off h-10 w-10 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>
      </div>
    </div>
  );
}

export default Navbar;
