"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      // redirect otomatis ke halaman import-chat
      router.push("/import-chat");
    }
  }, [session]);

  if (status === "loading") {
    return (
      <main className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="h-screen flex items-center justify-center">
        <button
          onClick={() => signIn("google")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Login with Google
        </button>
      </main>
    );
  }

  return null; // tidak perlu tampil karena akan redirect
}
