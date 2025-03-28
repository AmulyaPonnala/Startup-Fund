"use client";

import { useState, useEffect, ChangeEvent, KeyboardEvent, JSX } from "react";
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

export default function ChatPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant" as const, content: "Hello! How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    setLoading(true);

    const userMessage: Message = { role: "user" as const, content: input };
    setMessages([...messages, userMessage]);

    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: `Provide a brief response in 1-2 short sentences about: ${input}. Keep it simple and direct.` }]
          }]
        }),
      });

      const data = await response.json();
      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
      
      // Clean the response and ensure it's brief
      const cleanResponse = aiResponse
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/•/g, '')
        .replace(/- /g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      setMessages(prev => [...prev, { role: "assistant" as const, content: cleanResponse }]);
    } catch (error) {
      console.error("Error fetching response:", error);
    }

    setLoading(false);
    setInput("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">AI Assistant</h1>
        </header>

        <main className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((message: Message, index: number) => (
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
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
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
