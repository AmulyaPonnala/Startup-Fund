"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Plus } from "lucide-react"
import Link from "next/link"

type Message = {
  role: "user" | "assistant"
  content: string
}

type Chat = {
  id: string
  title: string
  messages: Message[]
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [input, setInput] = useState("")

  useEffect(() => {
    // Load chats from localStorage
    const savedChats = localStorage.getItem("savedChats")
    if (savedChats) {
      setChats(JSON.parse(savedChats))
    }
  }, [])

  const saveChats = (updatedChats: Chat[]) => {
    localStorage.setItem("savedChats", JSON.stringify(updatedChats))
    setChats(updatedChats)
  }

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [{ role: "assistant", content: "Hello! How can I assist you with startup funding today?" }],
    }
    setCurrentChat(newChat)
    saveChats([...chats, newChat])
  }

  const handleSend = () => {
    if (input.trim() && currentChat) {
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, { role: "user", content: input }],
      }
      setCurrentChat(updatedChat)
      saveChats(chats.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)))

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          ...updatedChat,
          messages: [
            ...updatedChat.messages,
            {
              role: "assistant",
              content: `You asked: "${input}". How can I help further with your startup funding query?`,
            },
          ],
        }
        setCurrentChat(aiResponse)
        saveChats(chats.map((chat) => (chat.id === aiResponse.id ? aiResponse : chat)))
      }, 1000)

      setInput("")
    }
  }

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
              className="w-full justify-start text-left truncate"
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
              >
                {message.content}
              </div>
            </div>
          ))}
        </main>
        <footer className="bg-white border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message here..."
              className="flex-1"
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

