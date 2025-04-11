"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { db, auth } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export default function StartupProfilePage() {
  const [user] = useAuthState(auth);
  const [pdfInitialized, setPdfInitialized] = useState(false);
  const [pdfjs, setPdfjs] = useState<any>(null);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializePdf = async () => {
      try {
        if (typeof window !== 'undefined') {
          const pdfjsModule = await import('pdfjs-dist');
          pdfjsModule.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setPdfjs(pdfjsModule);
          setPdfInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing PDF.js:', error);
        setError('Failed to initialize PDF processor. Please refresh the page.');
      }
    };

    initializePdf();
  }, []);

  useEffect(() => {
    console.log("Firebase auth state:", user);
    console.log("Firebase auth initialized:", auth);
  }, [user]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      
      try {
        const profilesRef = collection(db, 'startup_profiles');
        const q = query(profilesRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const profiles = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavedProfiles(profiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError(`Failed to fetch profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    fetchProfiles();
  }, [user]);

  const [formData, setFormData] = useState({
    name: '',
    industries: '',
    funding_stage: '',
    funding_amount: '',
    preferred_investment_firm: '',
    location: '',
    revenue: '',
    growth_metrics: '',
    tech_stack: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save functionality (unchanged)
  useEffect(() => {
    if (!currentProfileId || !user) return;
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeout = setTimeout(async () => {
      try {
        setAutoSaveStatus('Saving...');
        const profileRef = doc(db, 'startup_profiles', currentProfileId);
        await updateDoc(profileRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        
        setSavedProfiles(prev => prev.map(profile => 
          profile.id === currentProfileId 
            ? { ...profile, ...formData, updatedAt: new Date().toISOString() } 
            : profile
        ));
        
        setAutoSaveStatus('Changes saved');
        setTimeout(() => setAutoSaveStatus(null), 3000);
      } catch (error) {
        console.error('Error auto-saving:', error);
        setAutoSaveStatus('Save failed');
        setTimeout(() => setAutoSaveStatus(null), 3000);
      }
    }, 1000);
    
    setAutoSaveTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formData, currentProfileId, user]);

  const saveProfile = async () => {
    if (!user) {
      setError('Please sign in to save profiles');
      return;
    }

    try {
      setLoading(true);
      const profilesRef = collection(db, 'startup_profiles');
      const docRef = await addDoc(profilesRef, {
        ...formData,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      
      setCurrentProfileId(docRef.id);
      setSavedProfiles(prev => [...prev, {
        id: docRef.id,
        ...formData,
        userId: user.uid,
        createdAt: new Date().toISOString()
      }]);
      
      setError(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileId: string) => {
    if (!user) {
      setError('Please sign in to update profiles');
      return;
    }

    try {
      setLoading(true);
      const profileRef = doc(db, 'startup_profiles', profileId);
      await updateDoc(profileRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      setSavedProfiles(prev => prev.map(profile => 
        profile.id === profileId 
          ? { ...profile, ...formData, updatedAt: new Date().toISOString() } 
          : profile
      ));
      
      setError(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = (profile: any) => {
    setFormData({
      name: profile.name || '',
      industries: profile.industries || '',
      funding_stage: profile.funding_stage || '',
      funding_amount: profile.funding_amount || '',
      preferred_investment_firm: profile.preferred_investment_firm || '',
      location: profile.location || '',
      revenue: profile.revenue || '',
      growth_metrics: profile.growth_metrics || '',
      tech_stack: profile.tech_stack || ''
    });
    setCurrentProfileId(profile.id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industries: '',
      funding_stage: '',
      funding_amount: '',
      preferred_investment_firm: '',
      location: '',
      revenue: '',
      growth_metrics: '',
      tech_stack: ''
    });
    setCurrentProfileId(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      if (!pdfjs || !pdfInitialized) {
        throw new Error('PDF processor is not ready. Please try again.');
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });
      
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        } catch (pageError) {
          console.error(`Error processing page ${i}:`, pageError);
          continue;
        }
      }

      if (!fullText.trim()) {
        throw new Error('No text content could be extracted from the PDF');
      }

      return fullText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;


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


      const pdfText = await extractTextFromPdf(file);
      
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract and format the following information from this startup pitch deck text. Use exactly these labels:



Startup Name: [name]
Industries: Select only ONE industry from this list that most closely matches the startup's focus: AI, AgriTech, CleanTech, Cybersecurity, E-commerce, EdTech, Fintech, Gaming, HealthTech, SaaS. Provide only the single best match.
Funding Stage: [stage]
Funding Amount: [amount]
Preferred Investment Firm: [firm type]
Location: [location]
Revenue: [revenue]
Growth Metrics: [metrics]
Tech Stack: [technologies]

Text to analyze: ${pdfText.substring(0, 5000)}`
            }]
          }]
        })
      });

      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const extractedText = data.candidates[0].content.parts[0].text;
        console.log('Extracted text:', extractedText);
        
        const lines = extractedText.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line && line.includes(':'));
        
        const newData = { ...formData };
        let filledFields = 0;

        for (const line of lines) {
          const colonIndex = line.indexOf(':');
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          
          if (value) {
            console.log('Processing:', { key, value });
            
            switch(key) {
              case 'Startup Name':
                newData.name = value;
                filledFields++;
                break;
              case 'Industries':
                newData.industries = value;
                filledFields++;
                break;
              case 'Funding Stage':
                newData.funding_stage = value;
                filledFields++;
                break;
              case 'Funding Amount':
                newData.funding_amount = value;
                filledFields++;
                break;
              case 'Preferred Investment Firm':
                newData.preferred_investment_firm = value;
                filledFields++;
                break;
              case 'Location':
                newData.location = value;
                filledFields++;
                break;
              case 'Revenue':
                newData.revenue = value;
                filledFields++;
                break;
              case 'Growth Metrics':
                newData.growth_metrics = value;
                filledFields++;
                break;
              case 'Tech Stack':
                newData.tech_stack = value;
                filledFields++;
                break;
            }
          }
        }
        
        console.log('Updated form data:', newData);
        setFormData(newData);
        
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };
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


      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Startup Profile</h1>
        
        {!user ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Please sign in to save and manage your startup profiles</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Pitch Deck (PDF)</label>
              <Input
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              {autoSaveStatus && (
                <p className="text-green-500 text-sm mt-2">{autoSaveStatus}</p>
              )}
            </div>

            {loading && (
              <div className="text-center py-4">
                <p>Processing PDF...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Startup Name</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={formData.name ? 'border-green-500' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Industries</label>
                <Input
                  value={formData.industries}
                  onChange={(e) => handleInputChange('industries', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Funding Stage</label>
                <Input
                  value={formData.funding_stage}
                  onChange={(e) => handleInputChange('funding_stage', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Funding Amount</label>
                <Input
                  value={formData.funding_amount}
                  onChange={(e) => handleInputChange('funding_amount', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Investment Firm</label>
                <Input
                  value={formData.preferred_investment_firm}
                  onChange={(e) => handleInputChange('preferred_investment_firm', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Revenue</label>
                <Input
                  value={formData.revenue}
                  onChange={(e) => handleInputChange('revenue', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Growth Metrics</label>
                <Input
                  value={formData.growth_metrics}
                  onChange={(e) => handleInputChange('growth_metrics', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Tech Stack</label>
                <Input
                  value={formData.tech_stack}
                  onChange={(e) => handleInputChange('tech_stack', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              {currentProfileId ? (
                <>
                  <Button 
                    onClick={() => updateProfile(currentProfileId)}
                    disabled={loading}
                  >
                    Save Profile
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={resetForm}
                  >
                    New Profile
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={saveProfile}
                  disabled={loading}
                >
                  Save As New Profile
                </Button>
              )}
            </div>

            {savedProfiles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Saved Profiles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedProfiles.map((profile) => (
                    <Card key={profile.id} className={currentProfileId === profile.id ? "border-2 border-blue-500" : ""}>
                      <CardHeader>
                        <CardTitle>{profile.name}</CardTitle>
                        <CardDescription>
                          {profile.industries} • {profile.funding_stage}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Location: {profile.location}<br />
                          Funding: {profile.funding_amount}<br />
                          Revenue: {profile.revenue}
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => loadProfile(profile)}
                        >
                          Edit
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
  );
}


