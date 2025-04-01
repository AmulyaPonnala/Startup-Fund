"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function StartupProfilePage() {
  const [file, setFile] = useState<File | null>(null)
  const [profileData, setProfileData] = useState({
    companyName: "",
    industry: "",
    foundingDate: "",
    stage: "",
    teamSize: "",
    location: "",
    website: "",
    description: "",
    problem: "",
    solution: "",
    targetMarket: "",
    businessModel: "",
    competitors: "",
    traction: "",
    fundingNeeds: "",
    useOfFunds: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Profile Data:", profileData)
    console.log("Uploaded File:", file)
    // Here you would typically send this data to your backend
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Link href="/">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </Link>
      <Card className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Startup Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Upload Pitch Deck</h2>
            <Input type="file" onChange={handleFileChange} accept=".pdf,.ppt,.pptx" />
            {file && <p className="mt-2 text-sm text-gray-600">File uploaded: {file.name}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="companyName" placeholder="Company Name" onChange={handleInputChange} />
            <Input name="industry" placeholder="Industry" onChange={handleInputChange} />
            <Input name="foundingDate" placeholder="Founding Date" type="date" onChange={handleInputChange} />
            <Input name="stage" placeholder="Stage (e.g., Seed, Series A)" onChange={handleInputChange} />
            <Input name="teamSize" placeholder="Team Size" type="number" onChange={handleInputChange} />
            <Input name="location" placeholder="Location" onChange={handleInputChange} />
            <Input name="website" placeholder="Website" type="url" onChange={handleInputChange} />
          </div>
          <Textarea name="description" placeholder="Company Description" rows={3} onChange={handleInputChange} />
          <Textarea name="problem" placeholder="Problem you're solving" rows={3} onChange={handleInputChange} />
          <Textarea name="solution" placeholder="Your solution" rows={3} onChange={handleInputChange} />
          <Textarea name="targetMarket" placeholder="Target Market" rows={3} onChange={handleInputChange} />
          <Textarea name="businessModel" placeholder="Business Model" rows={3} onChange={handleInputChange} />
          <Textarea name="competitors" placeholder="Competitors" rows={3} onChange={handleInputChange} />
          <Textarea name="traction" placeholder="Traction / Milestones" rows={3} onChange={handleInputChange} />
          <Textarea name="fundingNeeds" placeholder="Funding Needs" rows={3} onChange={handleInputChange} />
          <Textarea name="useOfFunds" placeholder="Use of Funds" rows={3} onChange={handleInputChange} />
          <Button type="submit" className="w-full">
            Save Profile
          </Button>
        </form>
      </Card>
    </div>
  )
}

