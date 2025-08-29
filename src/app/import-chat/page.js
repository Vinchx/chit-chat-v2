"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import ChatViewer from "@/components/ChatViewer";

export default function ImportChatPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-center">
          Kamu harus login dulu untuk mengakses halaman ini.
        </p>
        <button
          onClick={() => signIn("google")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Login dengan Google
        </button>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col">
      {/* Header dengan tombol logout */}
      <div className="flex justify-between items-center bg-green-600 text-white px-4 py-2">
        <h1 className="font-semibold">WhatsApp Chat Viewer</h1>
        <button
          onClick={() => signOut()}
          className="px-3 py-1 bg-red-500 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Chat Viewer */}
      <div className="flex-1">
        <ChatViewer userEmail={session.user.email} />
      </div>
    </main>
  );
}
