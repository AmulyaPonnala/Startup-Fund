"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocumentProxy } from 'pdfjs-dist'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export default function StartupProfilePage() {
  const [pdfInitialized, setPdfInitialized] = useState(false);

  useEffect(() => {
    const initializePdf = async () => {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        setPdfInitialized(true);
      } catch (error) {
        console.error('Error initializing PDF.js:', error);
        setError('Failed to initialize PDF processor. Please refresh the page.');
      }
    };

    initializePdf();
  }, []);

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

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (!pdfInitialized) {
      setError('PDF processor is not ready. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract text from PDF
      const pdfText = await extractTextFromPdf(file);
      
      // Send to Gemini API
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
Industries: [industry types]
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
      console.log('Raw API Response:', data); // Debug log

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const extractedText = data.candidates[0].content.parts[0].text;
        console.log('Extracted text:', extractedText); // Debug log
        
        // Split by newlines and clean up the lines
        const lines = extractedText.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line && line.includes(':'));
        
        const newData = { ...formData };
        let filledFields = 0;

        for (const line of lines) {
          // Handle cases where there might be multiple colons
          const colonIndex = line.indexOf(':');
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          
          if (value) {  // Only update if there's a value
            console.log('Processing:', { key, value }); // Debug log
            
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
        
        console.log('Updated form data:', newData); // Debug log
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link 
        href="/" 
        className="fixed top-4 left-4 flex items-center gap-2 text-sm hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={20} />
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Startup Profile</h1>
        
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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={formData.name ? 'border-green-500' : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Industries</label>
            <Input 
              value={formData.industries}
              onChange={(e) => setFormData(prev => ({ ...prev, industries: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Funding Stage</label>
            <Input 
              value={formData.funding_stage}
              onChange={(e) => setFormData(prev => ({ ...prev, funding_stage: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Funding Amount</label>
            <Input 
              value={formData.funding_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, funding_amount: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Investment Firm</label>
            <Input 
              value={formData.preferred_investment_firm}
              onChange={(e) => setFormData(prev => ({ ...prev, preferred_investment_firm: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <Input 
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Revenue</label>
            <Input 
              value={formData.revenue}
              onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Growth Metrics</label>
            <Input 
              value={formData.growth_metrics}
              onChange={(e) => setFormData(prev => ({ ...prev, growth_metrics: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Tech Stack</label>
            <Input 
              value={formData.tech_stack}
              onChange={(e) => setFormData(prev => ({ ...prev, tech_stack: e.target.value }))}
            />
          </div>
          </div>
          </div>
    </div>
  );
}

