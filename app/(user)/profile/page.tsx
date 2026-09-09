'use client';
import React, { useEffect } from 'react';
import UserProfile from '@/components/UserProfile/UserProfile';
import { useUserStore } from '@/store/userStore';

export default function ProfilePage() {
  const { userData, setUserData } = useUserStore();

  useEffect(() => {
    if (!userData) {
      setUserData();
    }
  }, [userData, setUserData]);

  return (
    <main>
      <UserProfile />
    </main>
  );
}
