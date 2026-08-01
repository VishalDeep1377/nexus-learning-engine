"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/Notification";
import Link from "next/link";
import Image from "next/image";
import LoadingSkeleton from "@/components/Skeleton/LoadingSkeleton";
import { useUserStore } from "@/store/userStore";

export default function Login() {
  const {userData,setUserData}=useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: session } = useSession(); // Check if user is authenticated
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);

  // Redirect to home if the user is already logged in
  useEffect(() => {
    if (session) {
      router.push("/");
    } else {
      setLoading(false); // Only set loading to false once session check is done
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      showNotification(result.error, "error");
    } else {
      showNotification("Login successful!", "success");
      setUserData();
      router.push("/");
    }
  };

  if (loading) {
    return <LoadingSkeleton />;  // Show skeleton loader while loading
  }

  return (
    <div className="flex items-center justify-center flex-col w-full min-h-screen gap-10">
      <h1 className="text-5xl text-blue-600 text-center">Login</h1>
      <div>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="input input-bordered flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
            </svg>
            <input
              type="email"
              className="grow"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </label>

          <label className="input input-bordered flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
              <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
            </svg>
            <input
              type="password"
              className="grow"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
          </label>

          <button className="btn btn-outline btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <br />
        <span>Don't have an account?
          <Link href="/auth/signup"> Signup</Link>
        </span>
        <p className="w-full text-gray-500 text-center">or</p>

        <button onClick={() => signIn("google", { callbackUrl: "/home" })} className="bg-[#4285F4] text-white px-4 py-2 m-2 w-full rounded-md mt-2 flex justify-center items-center gap-2 hover:scale-110 transition-all ease-out">
          <Image src="https://cdn-icons-png.flaticon.com/512/2702/2702602.png" alt="Google Logo" width={20} height={20} className="mr-2" />
          Login with Google
        </button>

        <button onClick={() => signIn("github", { prompt: "login", callbackUrl: "/home" })} className="bg-[#333] text-white px-4 py-2 rounded-md flex justify-center items-center gap-2 w-full hover:scale-110 transition-all ease-out">
          <Image src="https://cdn-icons-png.flaticon.com/512/2111/2111425.png" alt="GitHub Logo" width={20} height={20} className="mr-2" />
          Login with GitHub
        </button>
      </div>
    </div>
  );
}
