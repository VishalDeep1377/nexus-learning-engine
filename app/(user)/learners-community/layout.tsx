'use client';

export default function LearnerCommunityLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  return (
    <div className="w-full flex flex-col lg:flex-row dark:bg-black bg-white text-black dark:text-white">
      {/* Main content area */}
      <div className="w-full min-h-screen px-2 sm:px-4">
        {children}
      </div>
    </div>
  );
}
