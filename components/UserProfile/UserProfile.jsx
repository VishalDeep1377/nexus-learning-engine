"use client";
import { FiEdit2 } from "react-icons/fi";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";

export const UserProfile = () => {
  const router=useRouter();
  const { userData } = useUserStore();
  const handleEdit=async()=>{
   router.push(`/profile/${userData?._id}`)
  }
  return (
<div className="md:max-w-[50vw] w-[90%] mx-auto min-h-[100px] flex flex-col dark:bg-gray-800 bg-slate-100 rounded-lg my-10 text-black dark:text-white shadow-lg p-6">
  <div className="flex justify-between items-center border-b pb-3">
    <h2 className="text-lg font-bold">Personal Info</h2>
    <div className="cursor-pointer hover:text-gray-500 transition">
      <FiEdit2 size={20} onClick={handleEdit} />
    </div>
  </div>

  <div className="flex flex-col space-y-3 pt-3">
    <div className="flex justify-between text-sm md:text-base">
      <p className="font-medium text-gray-600 dark:text-gray-300">Name</p>
      <p className="text-gray-800 dark:text-gray-100">{userData?.name}</p>
    </div>
    <hr className="w-full bg-gray-400 border-0 rounded-sm dark:bg-gray-700" />

    <div className="flex justify-between text-sm md:text-base">
      <p className="font-medium text-gray-600 dark:text-gray-300">Email</p>
      <p className="text-gray-800 dark:text-gray-100">{userData?.email}</p>
    </div>
    <hr className="w-full bg-gray-400 border-0 rounded-sm dark:bg-gray-700" />

    <div className="flex justify-between text-sm md:text-base">
      <p className="font-medium text-gray-600 dark:text-gray-300">Joined At</p>
      <p className="text-gray-800 dark:text-gray-100">
        {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Joined Date"}
      </p>
    </div>
    <hr className="w-full bg-gray-400 border-0 rounded-sm dark:bg-gray-700" />

    <div className="flex justify-between text-sm md:text-base">
      <p className="font-medium text-gray-600 dark:text-gray-300">Gender</p>
      <p className="text-gray-800 dark:text-gray-100">{userData?.gender || "add gender"}</p>
    </div>
    <hr className="w-full bg-gray-400 border-0 rounded-sm dark:bg-gray-700" />

    <div className="flex justify-between text-sm md:text-base">
      <p className="font-medium text-gray-600 dark:text-gray-300">Address</p>
      <p className="text-gray-800 dark:text-gray-100">{userData?.address || "add address"}</p>
    </div>
  </div>
</div>

  );
};

export default UserProfile;
