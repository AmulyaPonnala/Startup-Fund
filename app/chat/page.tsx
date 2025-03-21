"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Plus } from "lucide-react";
import Link from "next/link";
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
type Message = {
  role: "user" | "assistant";
  content: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedChats = localStorage.getItem("savedChats");
    if (savedChats) setChats(JSON.parse(savedChats));
  }, []);

  const saveChats = (updatedChats: Chat[]) => {
    localStorage.setItem("savedChats", JSON.stringify(updatedChats));
    setChats([...updatedChats]);
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [{ role: "assistant", content: "Hello! How can I assist you with startup funding today?" }],
    };
    setCurrentChat(newChat);
    saveChats([...chats, newChat]);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentChat) return;

    setLoading(true);

    const userMessage: Message = { role: "user", content: input };

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
    };
    setCurrentChat(updatedChat);
    saveChats(chats.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)));

    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            "contents": [{
              "role": "user",
              "parts": [{ "text":input }]
            }]

          
        }),
      });

      const data = await response.json();
console.log("API Response:", data); // Debugging log

const allowedTopics = ["startup", "funding", "investment", "business", "website", "Predixure"];
const isRelevant = allowedTopics.some((topic) => input.toLowerCase().includes(topic));

let aiResponse;

if (isRelevant) {
  const rawResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

  // Formatting for better readability
aiResponse = rawResponse
  .replace(/\• 🔹 • •(.*?)• •/g, "\n- $1\n") // Convert section headings into bullet points
  .replace(/\• 🔹 •/g, "\n- ") // Convert formatted points into bullet points
  .replace(/\• /g, "\n- ") // Ensure all bullet points are prefixed with '- '
  .replace(/\n\n/g, "\n"); // Remove excessive line breaks for cleaner formatting

} else {
  aiResponse =
    "I can only provide information on startup funding and the Predixure website. Please ask about these topics!";
}




      const updatedWithResponse = {
        ...updatedChat,
        messages: [...updatedChat.messages, { role: "assistant", content: aiResponse }],
      };

      setCurrentChat(updatedWithResponse);
      saveChats(chats.map((chat) => (chat.id === updatedWithResponse.id ? updatedWithResponse : chat)));
    } catch (error) {
      console.error("Error fetching response from Gemini API:", error);
    }

    setLoading(false);
    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r overflow-y-auto">
        <div className="p-4">
          <Button onClick={handleNewChat} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
        <nav className="space-y-2 px-3">
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className={`w-full justify-start text-left truncate ${currentChat?.id === chat.id ? "bg-gray-200" : ""}`}
              onClick={() => setCurrentChat(chat)}
            >
              {chat.title}
            </Button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">AI Funding Assistant</h1>
        </header>

        <main className="flex-1 overflow-auto p-4 space-y-4">
          {currentChat?.messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
  className={`max-w-[80%] rounded-lg p-3 ${
    message.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-900"
  }`}
  dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, "<br />") }}
/>

            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-white text-gray-900">Typing...</div>
            </div>
          )}
        </main>

        <footer className="bg-white border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message here..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? "..." : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
