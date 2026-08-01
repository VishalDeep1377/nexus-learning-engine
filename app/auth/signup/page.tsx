'use client'
import React, { FormEvent, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'  // Import useRouter for navigation
import { signIn,useSession } from 'next-auth/react'
import Image from 'next/image'

function signup() {
  const { data: session } = useSession();
  const [signedUpUser, setSignedUpUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
  });

  const router = useRouter();  // Hook to navigate to different routes

  const handleDataChange = (e: React.FormEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.currentTarget.name]: e.currentTarget.value });
  }

  const handleSignup = async () => {
    setLoading(true);
    try {
      if (!formData.email || !formData.password || !formData.name) {
        toast.error("All fields are required");
        return;
      }

      const response = await axios.post("/api/auth/signup", formData);
      setSignedUpUser(response.data);
      setLoading(false);

      if (response.status === 201) {
        toast.success("User registered successfully");
        console.log(signedUpUser);

       // Redirect to login page after successful signup
        router.push("/auth/login");
      }
    } catch (error) {
      console.log("Error occurred while signup", error);
      toast.error("Something went wrong. Please try again.");
    }
  }
  if (session) {
    router.push("/");
    return null;
  }
  return (
    <div className='flex items-center justify-center flex-col w-full min-h-screen gap-10'>
      <h1 className='text-5xl text-blue-600 text-center'>Signup</h1>
      <div>
        <form className='flex flex-col gap-3'>
          <label className="input input-bordered flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70">
              <path
                d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
            </svg>
            <input
              type="text"
              className="grow"
              placeholder="Full Name"
              name="name"
              value={formData.name}
              onChange={handleDataChange}
            />
          </label>

          <label className="input input-bordered flex items-center gap-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70">
              <path
                d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
              <path
                d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
            </svg>
            <input
              type="text"
              className="grow"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleDataChange}
            />
          </label>

          <label className="input input-bordered flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70">
              <path
                fillRule="evenodd"
                d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                clipRule="evenodd" />
            </svg>
            <input
              type="password"
              className="grow"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleDataChange}
            />
          </label>

          <button
            className="btn btn-outline btn-primary"
            type="button"
            onClick={handleSignup}
          >
            Signup
          </button>
        </form>

        <br />
        <span>Already have an account?
          <Link href={'/auth/login'}> Login</Link>
        </span>
        <p className='w-full text-gray-500 text-center'>or</p>
        <button onClick={() => signIn("google", { callbackUrl: "/" })} className="bg-[#4285F4]  text-white px-4 py-2  m-2 w-full rounded-md mt-2 flex justify-center items-center gap-2 hover:scale-110 transition-all ease-out ">
          <Image src={"https://cdn-icons-png.flaticon.com/512/2702/2702602.png"} alt="Google Logo" width={20} height={20} className="mr-2"></Image>
          Signup with Google
        </button>
        <button onClick={() => signIn("github", { prompt: "login", callbackUrl: "/" })} className="bg-[#333] text-white px-4 py-2 rounded-md  flex justify-center items-center gap-2  w-full hover:scale-110 transition-all ease-out">
          <Image src={"https://cdn-icons-png.flaticon.com/512/2111/2111425.png"} alt="Google Logo" width={20} height={20} className="mr-2"></Image>

          Signup with GitHub
        </button>


      </div>
    </div>
  );
}

export default signup;
