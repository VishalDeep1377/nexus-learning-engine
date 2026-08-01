import JobCard from '@/components/ui/JobCard'
import React from 'react'

function jobs() {
  return (
    <div className='w-full p-2 md:p-3 min-h-screen'>
   <JobCard jobTitle="Software Engineer" company="Tech Corp" location="New York" description="Exciting opportunity" />
    </div>
  )
}

export default jobs