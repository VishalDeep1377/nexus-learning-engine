'use client'
import React, { useEffect } from 'react'
import UserProfile from '@/components/UserProfile/UserProfile'
import { useUserStore } from '@/store/userStore'
function page() {


  return (
    <div>
      <UserProfile/>
    </div>
  )
}

export default page
