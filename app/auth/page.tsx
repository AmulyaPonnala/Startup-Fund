"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Wallet } from "lucide-react"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wallet className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">StartupFund</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
            {isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  )
} 