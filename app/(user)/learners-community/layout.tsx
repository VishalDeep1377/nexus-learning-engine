'use client';

export default function LearnerCommunityLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  return (
    <div className="w-full flex flex-col lg:flex-row dark:bg-black bg-white text-black dark:text-white">
      {/* Left sidebar - hidden on mobile, shown on lg screens */}
      <div className="hidden lg:block lg:w-1/6 bg-blue-600/10 min-h-screen">
        <nav className="h-[80vh] sticky top-0">
          <ul className="flex flex-col justify-evenly items-center h-full text-sm">
            <li className="cursor-pointer hover:text-blue-600">Home</li>
            <li className="cursor-pointer hover:text-blue-600">Explore</li>
            <li className="cursor-pointer hover:text-blue-600">Trending</li>
            <li className="cursor-pointer hover:text-blue-600">Leaderboard</li>
          </ul>
        </nav>
      </div>

      {/* Main content area - full width on mobile, adjusted on larger screens */}
      <div className="w-full lg:w-4/6 min-h-screen px-2 sm:px-4">
        {children}
      </div>

      {/* Right sidebar - hidden on mobile, shown on lg screens */}
      <div className="hidden lg:block lg:w-1/6 bg-blue-600/10 min-h-screen">
        <div className="sticky top-0 pt-5">
          <h2 className="text-sm font-medium">Other Info Section</h2>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t dark:border-gray-800 py-2">
        <nav>
          <ul className="flex justify-around items-center text-xs">
            <li className="cursor-pointer hover:text-blue-600">Home</li>
            <li className="cursor-pointer hover:text-blue-600">Explore</li>
            <li className="cursor-pointer hover:text-blue-600">Trending</li>
            <li className="cursor-pointer hover:text-blue-600">Leaderboard</li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
