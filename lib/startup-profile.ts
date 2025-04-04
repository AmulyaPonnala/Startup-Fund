import { db } from './firebase'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth } from './firebase'

export interface StartupProfile {
  companyName: string
  industry: string
  description: string
  fundingStage: string
  fundingNeeded: string
  teamSize: string
  location: string
  website: string
  pitchDeck: string
  financials: {
    revenue: string
    growth: string
    burnRate: string
  }
  team: {
    founders: string[]
    keyMembers: string[]
  }
  market: {
    targetMarket: string
    competitors: string[]
    marketSize: string
  }
}

export async function saveStartupProfile(profile: StartupProfile) {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')

  const profileRef = doc(db, 'startupProfiles', user.uid)
  await setDoc(profileRef, {
    ...profile,
    updatedAt: new Date().toISOString()
  }, { merge: true })
}

export async function getStartupProfile(): Promise<StartupProfile | null> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')

  const profileRef = doc(db, 'startupProfiles', user.uid)
  const profileDoc = await getDoc(profileRef)
  
  if (profileDoc.exists()) {
    return profileDoc.data() as StartupProfile
  }
  return null
}

export async function updateStartupProfile(updates: Partial<StartupProfile>) {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')

  const profileRef = doc(db, 'startupProfiles', user.uid)
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  })
} 