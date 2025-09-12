"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  FileText, 
  Wand2, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Eye, 
  BarChart3,
  Upload,
  Download,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";

// Import components
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

interface Resume {
  _id: string;
  title: string;
  template: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export default function EnhancedTailorPage() {
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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="container mx-auto px-4 py-8">
        <motion.div className="mb-8 text-center" variants={itemVariants}>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Resume Tailoring Studio
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Transform your resume with intelligent AI optimization for perfect job alignment
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <motion.div variants={itemVariants}>
              <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto mb-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
                <TabsTrigger 
                  value="select" 
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="edit" 
                  disabled={!showEditor} 
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger 
                  value="tailor" 
                  disabled={!editedText} 
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Target className="w-4 h-4" />
                  Analyze
                </TabsTrigger>
                <TabsTrigger 
                  value="result" 
                  disabled={!tailoredResume} 
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4" />
                  Result
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* Animated Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm"
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-300">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value="select" className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <FileText className="w-6 h-6 text-purple-400" />
                      </div>
                      Upload Your Resume
                    </CardTitle>
                    <p className="text-gray-400">Start by uploading your resume in PDF, DOC, or DOCX format</p>
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="relative text-center py-16 border-dashed border-2 border-gray-600 rounded-xl hover:border-purple-500 transition-all duration-300 bg-gradient-to-br from-gray-800/30 to-gray-700/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Upload className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2 text-white">Drop your resume here</h3>
                      <p className="text-gray-400 mb-6">or click to browse files</p>
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 w-5 h-5" />
                              Choose File
                            </>
                          )}
                        </Button>
                      </motion.div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                      />
                    </motion.div>

                    <AnimatePresence>
                      {isUploading && (
                        <motion.div 
                          className="mt-8"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <OCRProgressTracker
                            isProcessing={isUploading}
                            fileName={file?.name}
                            fileSize={file?.size}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-6">
              <AnimatePresence>
                {ocrResult && (
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div variants={itemVariants}>
                      <OCRErrorDisplay
                        confidence={ocrResult.confidence}
                        errorRegions={ocrResult.errorRegions}
                        extractedText={ocrResult.extractedText}
                      />
                    </motion.div>

                    <motion.div variants={cardVariants} whileHover="hover">
                      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-gray-700">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-purple-600/20 rounded-lg">
                              <Edit3 className="w-6 h-6 text-purple-400" />
                            </div>
                            Professional Text Editor
                          </CardTitle>
                          <p className="text-gray-400">Review and perfect your extracted resume content</p>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="h-[700px] bg-gray-900/50">
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
                    </motion.div>

                    <motion.div 
                      className="flex justify-center"
                      variants={itemVariants}
                    >
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          onClick={() => setActiveTab("tailor")}
                          disabled={!editedText}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
                        >
                          <TrendingUp className="mr-2 w-5 h-5" />
                          Continue to Analysis
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="tailor" className="space-y-8">
              <motion.div 
                className="grid gap-8 lg:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={cardVariants} whileHover="hover">
                  <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm h-full">
                    <CardHeader className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-b border-gray-700">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                          <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        Job Description
                      </CardTitle>
                      <p className="text-gray-400">Paste the target job description for AI analysis</p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Textarea
                        placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications for best results..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="min-h-[300px] text-white bg-gray-900/50 border-gray-600 placeholder-gray-500 focus:border-blue-500 transition-colors duration-300 resize-none"
                      />
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                        <span>{jobDescription.length} characters</span>
                        <span className={`${jobDescription.length > 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {jobDescription.length > 100 ? 'Good length' : 'Add more details'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants} whileHover="hover">
                  <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm h-full">
                    <CardHeader className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-gray-700">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-green-600/20 rounded-lg">
                          <FileText className="w-6 h-6 text-green-400" />
                        </div>
                        Resume Content
                      </CardTitle>
                      <p className="text-gray-400">Your extracted and edited resume text</p>
                    </CardHeader>
                    <CardContent className="p-6">
                      {editedText ? (
                        <div className="space-y-4">
                          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 max-h-80 overflow-y-auto">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                              {editedText}
                            </pre>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>{editedText.split(' ').length} words</span>
                            <span className="text-green-400">Ready for analysis</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No resume content available</p>
                          <p className="text-sm mt-2">Upload and edit your resume first</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Enhanced Action Buttons */}
              <motion.div 
                className="flex justify-center gap-6"
                variants={itemVariants}
              >
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={analyzeJobDescription}
                    disabled={isAnalyzing || !jobDescription.trim() || !editedText}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-medium shadow-lg text-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-3 w-6 h-6" />
                        Analyze Match Score
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={handleTailorResume}
                    disabled={isTailoring || !hasAnalyzed || !jobDescription.trim() || !editedText}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-medium shadow-lg text-lg"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                        AI Tailoring...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-3 w-6 h-6" />
                        Tailor Resume
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Enhanced Analysis Results */}
              <AnimatePresence>
                {aiAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-gray-700">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-2 bg-purple-600/20 rounded-lg">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                          </div>
                          AI Resume Analysis
                        </CardTitle>
                        <p className="text-gray-400">Comprehensive AI-powered analysis and recommendations</p>
                      </CardHeader>
                      <CardContent className="p-6">
                        <AIAnalysisDisplay analysis={aiAnalysis} />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {jobAnalysis && compatibilityScore && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-gray-700">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-2 bg-green-600/20 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-green-400" />
                          </div>
                          Job Compatibility Analysis
                        </CardTitle>
                        <p className="text-gray-400">Detailed job requirements analysis and compatibility scoring</p>
                      </CardHeader>
                      <CardContent className="p-6">
                        <JobAnalysisDisplay
                          analysis={jobAnalysis}
                          compatibilityScore={compatibilityScore}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="result" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Sparkles className="w-7 h-7 text-purple-400" />
                      </div>
                      Your Tailored Resume
                    </CardTitle>
                    <p className="text-gray-400">AI-optimized resume perfectly aligned with the job requirements</p>
                  </CardHeader>
                  <CardContent className="p-8">
                    {tailoredResume ? (
                      <div className="bg-white rounded-xl p-8 shadow-2xl">
                        <ModernProfessionalTemplate data={tailoredResume} />
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-500">
                        <Sparkles className="w-16 h-16 mx-auto mb-6 opacity-50" />
                        <p className="text-xl mb-2">No tailored resume available</p>
                        <p>Complete the analysis and tailoring process first</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}