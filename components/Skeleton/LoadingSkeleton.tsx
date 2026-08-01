import React from 'react'

function LoadingSkeleton() {
  return (
 <div className='w-full min-h-screen flex justify-center items-center bg-gray-800 '>
 <div className="flex w-[80vw] flex-col gap-4 text-black dark:text-white">
  <div className="skeleton h-32 w-full "></div>
  <div className="skeleton h-20 w-full "></div>
  <div className="skeleton h-4 w-28"></div>
  <div className="skeleton h-4 w-full"></div>
  <div className="skeleton h-4 w-full"></div>
</div>
 </div>
  )
}

export default LoadingSkeleton