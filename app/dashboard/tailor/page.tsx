"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Wand2, CheckCircle, AlertCircle, Edit3, Eye, BarChart3 } from "lucide-react";

// Import new components
import { DualPaneEditor } from "@/components/editor/DualPaneEditor";
import { OCRProgressTracker } from "@/components/ocr/OCRProgressTracker";
import { OCRErrorDisplay } from "@/components/ocr/OCRErrorDisplay";
import { JobAnalysisDisplay } from "@/components/job-analysis/JobAnalysisDisplay";
import { AIAnalysisDisplay } from "@/components/ai-analysis/AIAnalysisDisplay";
import { ModernProfessionalTemplate } from "@/components/resume-templates/ModernProfessionalTemplate";
import { jobAnalysisService } from "@/lib/services/job-analysis-service";
import { aiResumeService } from "@/lib/services/ai-resume-service";
import type { JobAnalysis, CompatibilityScore } from "@/lib/services/job-analysis-service";
import type { ResumeAnalysis, EnhancedResumeData } from "@/lib/services/ai-resume-service";
import type { OCRResult } from "@/lib/services/ocr-service";

interface Resume {
  _id: string;
  title: string;
  template: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export default function TailorPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredResume, setTailoredResume] = useState<any | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("select");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced workflow state
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editedText, setEditedText] = useState("");
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [compatibilityScore, setCompatibilityScore] = useState<CompatibilityScore | undefined>(undefined);
  const [showEditor, setShowEditor] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<ResumeAnalysis | null>(null);
  const [enhancedResumeData, setEnhancedResumeData] = useState<EnhancedResumeData | null>(null);

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      uploadResume(selectedFile);
    }
  };

  // Upload resume function
  const uploadResume = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("title", file.name);
      formData.append("template", "modern");

      const response = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (data.ocrResults) {
        setOcrResult(data.ocrResults);
        setEditedText(data.ocrResults.extractedText);
        setShowEditor(true);
        setTimeout(() => setActiveTab("edit"), 100);
      }

      setSuccess("Resume uploaded successfully!");
    } catch (error) {
      setError("Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle text changes
  const handleTextChange = (newText: string) => {
    setEditedText(newText);
    if (jobAnalysis) {
      const newScore = jobAnalysisService.calculateCompatibility(newText, jobAnalysis);
      setCompatibilityScore(newScore);
    }
  };

  // Analyze job description with AI
  const analyzeJobDescription = async () => {
    if (!jobDescription.trim() || !editedText) {
      setError("Please provide both job description and resume content.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      // Run both analyses in parallel
      const [analysis, aiAnalysisResult] = await Promise.all([
        jobAnalysisService.analyzeJobDescription(jobDescription),
        aiResumeService.analyzeResume(editedText, jobDescription)
      ]);
      
      setJobAnalysis(analysis);
      setAiAnalysis(aiAnalysisResult);

      const score = jobAnalysisService.calculateCompatibility(editedText, analysis);
      setCompatibilityScore(score);
      setHasAnalyzed(true);
      setSuccess("Resume analyzed successfully with AI insights!");
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle AI-powered tailoring
  const handleTailorResume = async () => {
    if (!jobDescription.trim() || !editedText) {
      setError("Please provide both job description and resume content.");
      return;
    }

    setIsTailoring(true);
    setError(null);
    try {
      // Use AI to enhance the resume
      const enhancedData = await aiResumeService.enhanceResume(editedText, jobDescription);
      
      setEnhancedResumeData(enhancedData);
      setTailoredResume(enhancedData);
      setActiveTab("result");
      setSuccess("Resume successfully tailored with AI optimization!");
    } catch (error) {
      console.error('Tailoring error:', error);
      setError("Failed to tailor resume. Please try again.");
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resume Tailoring</h1>
          <p className="text-gray-400">
            Professional AI-powered resume optimization for job applications
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
              <TabsTrigger value="select" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Select Resume
              </TabsTrigger>
              <TabsTrigger value="edit" disabled={!showEditor} className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Edit Text
              </TabsTrigger>
              <TabsTrigger value="tailor" disabled={!editedText} className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Tailor
              </TabsTrigger>
              <TabsTrigger value="result" disabled={!tailoredResume} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Result
              </TabsTrigger>
            </TabsList>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-600">{success}</p>
              </div>
            )}

            <TabsContent value="select" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Upload Resume
                  </CardTitle>
                  <p className="text-gray-600">Upload your resume to start the tailoring process</p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 border-dashed border-2 border-gray-300 rounded-lg hover:border-purple-400 transition-colors">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Drag and drop your resume or click to upload</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Resume"
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                    />
                  </div>

                  {isUploading && (
                    <div className="mt-6">
                      <OCRProgressTracker
                        isProcessing={isUploading}
                        fileName={file?.name}
                        fileSize={file?.size}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="space-y-6">
              {ocrResult && (
                <div className="space-y-6">
                  <OCRErrorDisplay
                    confidence={ocrResult.confidence}
                    errorRegions={ocrResult.errorRegions}
                    extractedText={ocrResult.extractedText}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5" />
                        Professional Text Editor
                      </CardTitle>
                      <p className="text-gray-600">Review and edit your extracted resume text</p>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[700px]">
                        <DualPaneEditor
                          originalDocument={ocrResult.originalFile}
                          extractedText={ocrResult.extractedText}
                          onTextChange={handleTextChange}
                          highlightRegions={ocrResult.errorRegions}
                          confidence={ocrResult.confidence}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => setActiveTab("tailor")}
                      disabled={!editedText}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Continue to Tailoring
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tailor" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Job Description
                    </CardTitle>
                    <p className="text-sm text-gray-600">Paste the job description to analyze requirements</p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Paste the job description here to analyze requirements and optimize your resume..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[200px] text-white bg-gray-800 border-gray-600 placeholder-gray-400"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Current Resume Content
                    </CardTitle>
                    <p className="text-sm text-gray-600">Extracted text from your resume</p>
                  </CardHeader>
                  <CardContent>
                    {editedText ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                            {editedText}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No resume content available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={analyzeJobDescription}
                  disabled={isAnalyzing || !jobDescription.trim() || !editedText}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 w-4 h-4" />
                      Analyze Job Match
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleTailorResume}
                  disabled={isTailoring || !hasAnalyzed || !jobDescription.trim() || !editedText}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isTailoring ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Tailoring...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 w-4 h-4" />
                      Tailor Resume
                    </>
                  )}
                </Button>
              </div>

              {/* Analysis Results */}
              {aiAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      AI Resume Analysis
                    </CardTitle>
                    <p className="text-sm text-gray-600">Comprehensive AI analysis of your resume against the job requirements</p>
                  </CardHeader>
                  <CardContent>
                    <AIAnalysisDisplay analysis={aiAnalysis} />
                  </CardContent>
                </Card>
              )}

              {jobAnalysis && compatibilityScore && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Job Analysis & Compatibility
                    </CardTitle>
                    <p className="text-sm text-gray-600">Analysis of job requirements and resume compatibility</p>
                  </CardHeader>
                  <CardContent>
                    <JobAnalysisDisplay
                      analysis={jobAnalysis}
                      compatibilityScore={compatibilityScore}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="result" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tailored Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  {tailoredResume ? (
                    <ModernProfessionalTemplate data={tailoredResume} />
                  ) : (
                    <p>No tailored resume available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}