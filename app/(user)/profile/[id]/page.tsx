'use client';
import React, { useEffect, useState } from 'react';
import LoadingSkeleton from '@/components/Skeleton/LoadingSkeleton';
import axios from 'axios';
import { useUserStore } from '@/store/userStore';

function EditProfile({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false); 
  useEffect(()=>{
    setLoading(true);
    setUserData();
    setLoading(false);
  },[params])
  const { userData,setUserData } = useUserStore();

  const handleUpdateProfile=async()=>{
    //todo
  }


  if (loading) {
    return <LoadingSkeleton />; 
  }

  return (
<div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black text-black dark:text-white py-10 px-4">
  <h1 className="text-3xl font-bold mb-8 text-center">Edit Profile</h1>
  <form className="w-full max-w-lg mx-auto flex flex-col gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-lg font-medium mb-2 dark:text-white">Email</label>
        <input 
          type="email" 
          name="email" 
          id="email" 
          placeholder="Your email" 
          defaultValue={userData?.email} 
          disabled
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-lg font-medium mb-2 dark:text-white">Name</label>
        <input 
          type="text" 
          name="name" 
          id="name" 
          placeholder="Name" 
          defaultValue={userData?.name || ''} 
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-lg font-medium mb-2 dark:text-white">Username</label>
        <input 
          type="text" 
          name="username" 
          id="username" 
          placeholder="Add Username" 
          defaultValue={userData?.userName} 
          required
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-lg font-medium mb-2 dark:text-white">Address</label>
        <input 
          type="text" 
          name="address" 
          id="address" 
          placeholder="Add Address" 
          defaultValue={userData?.address} 
          required
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label htmlFor="phone number" className="block text-lg font-medium mb-2 dark:text-white">Phone Number</label>
        <input 
          type="number" 
          name="phone number" 
          id="phone number" 
          placeholder="Add Phone Number" 
          defaultValue={userData?.phoneNumber} 
          required 
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          min={0} 
          max={9999999999} 
          minLength={10} 
        />
      </div>
    </div>

    <button 
      type="submit" 
      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 mt-6"
    >
      Update Profile
    </button>
  </form>
</div>

  );
}

export default EditProfile;

