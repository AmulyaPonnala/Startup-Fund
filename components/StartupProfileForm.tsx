"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

interface StartupProfileFormProps {
  userId: string;
}

interface StartupProfile {
  companyName: string;
  description: string;
  industry: string;
  stage: string;
  fundingNeeded: string;
  pitchDeckUrl: string;
}

export default function StartupProfileForm({ userId }: StartupProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StartupProfile>({
    companyName: "",
    description: "",
    industry: "",
    stage: "",
    fundingNeeded: "",
    pitchDeckUrl: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "startupProfiles", userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as StartupProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const docRef = doc(db, "startupProfiles", userId);
      await setDoc(docRef, profile, { merge: true });
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Startup Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <Input
              name="companyName"
              value={profile.companyName}
              onChange={handleChange}
              required
              placeholder="Enter your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              required
              placeholder="Describe your startup"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Industry</label>
            <Input
              name="industry"
              value={profile.industry}
              onChange={handleChange}
              required
              placeholder="Enter your industry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stage</label>
            <Input
              name="stage"
              value={profile.stage}
              onChange={handleChange}
              required
              placeholder="e.g., Pre-seed, Seed, Series A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Funding Needed</label>
            <Input
              name="fundingNeeded"
              value={profile.fundingNeeded}
              onChange={handleChange}
              required
              placeholder="Enter funding amount needed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pitch Deck URL</label>
            <Input
              name="pitchDeckUrl"
              value={profile.pitchDeckUrl}
              onChange={handleChange}
              type="url"
              placeholder="Enter your pitch deck URL"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
} 