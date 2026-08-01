'use client'
import { HeroHome } from '@/components/User/Home/HeroHome'
import { StickyHero } from '@/components/User/Home/StickyHero'
import LoadingSkeleton from '@/components/Skeleton/LoadingSkeleton'
import React, { useState } from 'react'

function Home() {
  const [isLoading,setIsloading ]=useState(false);
  
  if(isLoading){
    return(
      <div className="min-h-screen w-full flex flex-col justify-center items-center ">
     <LoadingSkeleton/>
        </div>
    )
  }
  return (
    <div className='min-h-screen flex flex-col justify-center items-center w-full'>
      <div className='w-[98vw]'>
      <HeroHome/>
      <StickyHero/>
      </div>
    </div>
  )
}

export default Home