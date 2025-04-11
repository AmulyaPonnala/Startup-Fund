'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  ChevronDown,
  Globe,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Settings,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { signOut } from "firebase/auth"

interface Investor {
  name: string;
  firm: string;
  industries: string;
  stage: string;
  checkSize: string;
  investmentProbability: number;
  previousInvestments?: string;
  successRate?: number;
  relevance?: number;
}

interface StartupData {
  userId?: string;
  name?: string;
  industries?: string;
  funding_stage?: string;
  funding_amount?: string;
  location?: string;
  tech_stack?: string;
  createdAt?: string;
}

const getRecommendedInvestors = async (startupData: StartupData): Promise<Investor[]> => {
  try {
    const fundingMatch = startupData.funding_amount?.match(/(\d+(\.\d+)?)\s*Lakh\s*INR/i);
    const fundingAmountLakh = fundingMatch ? parseFloat(fundingMatch[1]) : 0;
    const fundingAmountUSD = fundingAmountLakh * 1250;

    const requestData = {
      "Funding Required": fundingAmountUSD.toString(),
      "Industry": startupData.industries || "Unknown",
      "Stage": startupData.funding_stage || "Unknown"
    };

    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.status !== "success" || !Array.isArray(data.investors)) {
      throw new Error("Invalid API response format");
    }

    const transformedInvestors: Investor[] = data.investors.map((investor: any) => ({
      name: investor["Investor Name"] || "Unknown",
      firm: investor["Investor Name"] || "Unknown",
      industries: investor["Investor Industry"] || "Unknown",
      stage: investor["Investor Stage"] || "Unknown",
      checkSize: `$${Math.round(investor["Check Size"] || 0).toLocaleString()}`,
      investmentProbability: investor["Score"] || 0,
      previousInvestments: investor["Previous Investments"] || "N/A",
      successRate: investor["Success Rate"] || 0,
      relevance: investor["Relevance"] || 0,
    }));

    return transformedInvestors;

  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return getMockInvestors(startupData);
  }
};

const getMockInvestors = (startupData: StartupData): Investor[] => {
  const mockInvestors: Investor[] = [
    {
      name: "Sequoia Capital India",
      firm: "Sequoia Capital India",
      industries: "Healthcare, Tech, E-commerce",
      stage: "Seed, Series A",
      checkSize: "$500,000 - $5,000,000",
      investmentProbability: 0.92,
      previousInvestments: "N/A",
      successRate: 0.9,
      relevance: 0.95,
    },
    {
      name: "Blume Ventures",
      firm: "Blume Ventures",
      industries: "Wellness, Healthcare, Technology",
      stage: "Seed",
      checkSize: "$250,000 - $1,000,000",
      investmentProbability: 0.87,
      previousInvestments: "N/A",
      successRate: 0.85,
      relevance: 0.88,
    },
  ];
  return mockInvestors;
};

export default function InvestorNetworkPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [startupName, setStartupName] = useState("StartupFund");
  const [startupData, setStartupData] = useState<StartupData | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      
      try {
        const profilesRef = collection(db, 'startup_profiles');
        const q = query(profilesRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          let newestProfile: StartupData | null = null;
          let newestDate = new Date(0);
          
          querySnapshot.forEach(doc => {
            const profileData = doc.data() as StartupData;
            if (profileData.createdAt) {
              const profileDate = new Date(profileData.createdAt);
              if (profileDate > newestDate) {
                newestDate = profileDate;
                newestProfile = profileData;
              }
            }
          });
          
          if (newestProfile) {
            setStartupData(newestProfile);
            if (newestProfile.name) {
              setStartupName(newestProfile.name);
            }
            
            setIsLoadingInvestors(true);
            const recommendedInvestors = await getRecommendedInvestors(newestProfile);
            setInvestors(recommendedInvestors);
            setIsLoadingInvestors(false);
          } else {
            setError("No startup profile found");
          }
        } else {
          setError("No startup profile found");
        }
      } catch (error) {
        console.error("Error fetching startup profile:", error);
        setError("Failed to load startup profile");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredInvestors = investors.filter(investor => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      investor.name.toLowerCase().includes(searchTermLower) || 
      investor.firm.toLowerCase().includes(searchTermLower) ||
      investor.industries.toLowerCase().includes(searchTermLower) ||
      investor.stage.toLowerCase().includes(searchTermLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="grid lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="border-r bg-white">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Wallet className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-blue-600">{startupName}</span>
          </div>
          <div className="px-4 py-4">
            <Input placeholder="Search" className="bg-gray-100" />
          </div>
          <nav className="space-y-2 px-2">
            

            <Link href="/investor-network">
              <Button variant="ghost" className="w-full justify-start gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100">
                <Globe className="h-4 w-4" />
                Dashbaord
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              My Startup
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Wallet className="h-4 w-4" />
              Financial Planning
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
            
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
              onClick={handleSignOut}
            >
              <Settings className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Investor Network</h1>
              <div className="text-sm text-muted-foreground">
                AI-matched investors for {startupName}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/startup-profile">
                <Button variant="outline" className="gap-2 text-gray-700">
                  Edit My Profile
                </Button>
              </Link>
              <Link href="/chat">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </Link>
            </div>
          </div>

          {/* Startup Summary Card */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Your Startup Profile</h2>
            {error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium">{startupData?.industries || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Funding Stage</p>
                  <p className="font-medium">{startupData?.funding_stage || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Funding Target</p>
                  <p className="font-medium">{startupData?.funding_amount || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{startupData?.location || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tech Stack</p>
                  <p className="font-medium">{startupData?.tech_stack || "Not specified"}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Search and Filter */}
          <div className="mb-6">
            <Input 
              placeholder="Search investors by name, firm, industry..." 
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Investors Table */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">AI-Recommended Investors</h2>
              <p className="text-sm text-gray-500">Personalized investor matches based on your startup profile</p>
            </div>
            
            {isLoadingInvestors ? (
              <div className="p-8">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor / Firm</TableHead>
                    <TableHead>Industries</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Check Size</TableHead>
                    <TableHead>Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvestors.length > 0 ? (
                    filteredInvestors.map((investor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {investor.name}
                          <div className="text-sm text-gray-500">{investor.firm}</div>
                        </TableCell>
                        <TableCell>{investor.industries}</TableCell>
                        <TableCell>{investor.stage}</TableCell>
                        <TableCell>{ `${(investor.checkSize) }k` }</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${(investor.successRate || 0) }%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {Math.round((investor.successRate || 0))}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No investors found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}