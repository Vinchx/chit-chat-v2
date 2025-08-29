"use client";
import { useState, useEffect } from "react";
import ChatBubble from "./ChatBubble";

export default function ChatViewer({ userEmail }) {
  const [messages, setMessages] = useState([]);
  const [names, setNames] = useState([]);
  const [selfName, setSelfName] = useState("");

  // Load chat history saat pertama render
  useEffect(() => {
    if (!userEmail) return;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/messages?userEmail=${userEmail}`);
        const data = await res.json();
        setMessages(data);

        const nameSet = new Set(data.map((m) => m.sender));
        setNames([...nameSet]);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }

    loadHistory();

    // ===================================================
    // SSE - listen pesan baru secara realtime
    const evtSource = new EventSource(`/api/stream?userEmail=${userEmail}`);
    evtSource.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setMessages((prev) => [...prev, msg]);
      setNames((prev) => [...new Set([...prev, msg.sender])]);
    };
    return () => evtSource.close();
    // ===================================================
  }, [userEmail]);

  // Handle upload file .txt
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async (ev) => {
      const lines = ev.target.result.split("\n");
      const parsed = [];
      const nameSet = new Set();

      for (let line of lines) {
        const match = line.match(
          /^(\d{1,2}\/\d{1,2}\/\d{2,4}), (.*?) - (.*?): (.*)$/
        );
        if (match) {
          parsed.push({
            date: match[1],
            time: match[2],
            sender: match[3],
            text: match[4],
          });
          nameSet.add(match[3]);
        }
      }

      setMessages((prev) => [...prev, ...parsed]);
      setNames((prev) => [...new Set([...names, ...nameSet])]);

      // Simpan ke MongoDB & broadcast SSE
      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: parsed, userEmail }),
        });
        console.log("Messages saved to DB");
      } catch (err) {
        console.error("Failed to save messages", err);
      }
    };

    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* header */}
      <div className="flex justify-between items-center bg-green-600 text-white px-4 py-2 font-semibold">
        <h1>Chit-Chat v2</h1>
      </div>

      {/* upload file + pilih user */}
      <div className="p-3 border-b flex gap-3 items-center">
        <input type="file" accept=".txt" onChange={handleFile} />
        {names.length > 0 && (
          <select
            className="border px-2 py-1 rounded"
            value={selfName}
            onChange={(e) => setSelfName(e.target.value)}
          >
            <option value="">Pilih saya</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* chat area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-100">
        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} isSelf={m.sender === selfName} />
        ))}
      </div>
    </div>
  );
}
