"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Bot,
    CheckCircle,
    Edit3,
    Eye,
    FileDown,
    FileText,
    Loader2,
    Sparkles,
    Target,
    Upload,
    Wand2,
    Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// Import new components
import { AIAnalysisDisplay } from "@/components/ai-analysis/AIAnalysisDisplay";
import { DualPaneEditor } from "@/components/editor/DualPaneEditor";
import { JobAnalysisDisplay } from "@/components/job-analysis/JobAnalysisDisplay";
import { OCRErrorDisplay } from "@/components/ocr/OCRErrorDisplay";
import { OCRProgressTracker } from "@/components/ocr/OCRProgressTracker";
import { ModernProfessionalTemplate } from "@/components/resume-templates/ModernProfessionalTemplate";
import { downloadService } from "@/lib/services/download-service";
import type { CompatibilityScore, JobAnalysis } from "@/lib/services/job-analysis-service";
import { jobAnalysisService } from "@/lib/services/job-analysis-service";
import type { OCRResult } from "@/lib/services/ocr-service";
import { unifiedAIService, type AIProvider, type UnifiedEnhancedResumeData, type UnifiedResumeAnalysis } from "@/lib/services/unified-ai-service";

// Animation variants - kept minimal for key sections only
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

interface Resume {
  _id: string;
  title: string;
  template: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export default function TailorPage() {
  const router = useRouter();
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
  const [aiAnalysis, setAiAnalysis] = useState<UnifiedResumeAnalysis | null>(null);
  const [enhancedResumeData, setEnhancedResumeData] = useState<UnifiedEnhancedResumeData | null>(null);
  const selectedAIProvider: AIProvider = 'openai';
  const [isDownloading, setIsDownloading] = useState(false);

  // Utility: Build plain text resume from enhanced structured data
  function generateResumeTextFromEnhancedData(data: UnifiedEnhancedResumeData): string {
    const parts: string[] = [];
    if (data.name) parts.push(`${data.name}`);
    const contactLine = [data.email, data.phone, (data as any).location].filter(Boolean).join(" | ");
    if (contactLine) parts.push(contactLine);
    if (data.summary) {
      parts.push("\nSUMMARY\n" + data.summary);
    }
    if (Array.isArray(data.experience) && data.experience.length > 0) {
      parts.push("\nEXPERIENCE");
      data.experience.forEach((exp) => {
        const header = [exp.title, exp.company, exp.years].filter(Boolean).join(" • ");
        parts.push(header);
        if (exp.description) parts.push(exp.description);
        if (Array.isArray(exp.achievements) && exp.achievements.length > 0) {
          exp.achievements.forEach((a) => parts.push(`- ${a}`));
        }
      });
    }
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      parts.push("\nSKILLS\n" + data.skills.join(', '));
    }
    if (data.education) {
      parts.push("\nEDUCATION\n" + (typeof data.education === 'string' ? data.education : JSON.stringify(data.education)));
    }
    if (Array.isArray(data.projects) && data.projects.length > 0) {
      parts.push("\nPROJECTS");
      data.projects.forEach((p) => {
        const tech = Array.isArray(p.technologies) && p.technologies.length ? ` (${p.technologies.join(', ')})` : '';
        parts.push(`${p.name || 'Project'}${tech}`);
        if (p.description) parts.push(p.description);
      });
    }
    if (Array.isArray(data.certifications) && data.certifications.length > 0) {
      parts.push("\nCERTIFICATIONS");
      data.certifications.forEach((c) => parts.push(`- ${c}`));
    }
    return parts.join('\n');
  }

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

  // Analyze job description with selected AI provider
  const analyzeJobDescription = async () => {
    if (!jobDescription.trim() || !editedText) {
      setError("Please provide both job description and resume content.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      // Run both analyses in parallel - using selected AI provider
      const [analysis, aiAnalysisResult] = await Promise.all([
        jobAnalysisService.analyzeJobDescription(jobDescription),
        unifiedAIService.analyzeResume(editedText, jobDescription, selectedAIProvider, file || undefined)
      ]);
      
      setJobAnalysis(analysis);
      setAiAnalysis(aiAnalysisResult);

      const score = jobAnalysisService.calculateCompatibility(editedText, analysis);
      setCompatibilityScore(score);
      setHasAnalyzed(true);
      setSuccess(`Resume analyzed successfully with ${unifiedAIService.getProviderDisplayName(selectedAIProvider)} insights!`);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Failed to analyze resume with ${unifiedAIService.getProviderDisplayName(selectedAIProvider)}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle AI-powered tailoring with selected provider
  const handleTailorResume = async () => {
    if (!jobDescription.trim() || !editedText) {
      setError("Please provide both job description and resume content.");
      return;
    }

    setIsTailoring(true);
    setError(null);
    try {
      // Augment JD with analysis guidance so AI incorporates suggestions and missing keywords
      const guidance = aiAnalysis
        ? `\n\nOptimization Guidance from Analysis:\n- Suggestions: ${aiAnalysis.suggestions.join('; ')}\n- Missing Keywords: ${aiAnalysis.missingKeywords.join(', ')}\n- Section Feedback: summary(${aiAnalysis.sections.summary.feedback}); experience(${aiAnalysis.sections.experience.feedback}); skills(${aiAnalysis.sections.skills.feedback}); education(${aiAnalysis.sections.education.feedback})`
        : '';
      const augmentedJD = `${jobDescription}${guidance}`;

      // Use selected AI provider to enhance the resume
      const enhancedData = await unifiedAIService.enhanceResume(editedText, augmentedJD, selectedAIProvider);

      // Update text view to reflect enhanced result
      const enhancedText = generateResumeTextFromEnhancedData(enhancedData);
      setEditedText(enhancedText);

      setEnhancedResumeData(enhancedData);
      setTailoredResume(enhancedData);
      setActiveTab("result");
      setSuccess(`Resume successfully tailored with ${unifiedAIService.getProviderDisplayName(selectedAIProvider)} optimization!`);
    } catch (error) {
      console.error('Tailoring error:', error);
      setError(`Failed to tailor resume with ${unifiedAIService.getProviderDisplayName(selectedAIProvider)}. Please try again.`);
    } finally {
      setIsTailoring(false);
    }
  };

  // Handle download functions
  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!enhancedResumeData) {
      setError("No resume data available for download.");
      return;
    }

    setIsDownloading(true);
    try {
      const filename = `${enhancedResumeData.name.replace(/\s+/g, '_')}_tailored_resume`;
      
      switch (format) {
        case 'pdf':
          await downloadService.downloadAsPDF(enhancedResumeData, filename);
          break;
        case 'docx':
          await downloadService.downloadAsDOCX(enhancedResumeData, filename);
          break;
        case 'txt':
          await downloadService.downloadAsText(enhancedResumeData, filename);
          break;
      }
      
      const formatName = format === 'docx' ? 'Word document' : format.toUpperCase();
      setSuccess(`Resume downloaded successfully as ${formatName}!`);
    } catch (error) {
      console.error('Download error:', error);
      const formatName = format === 'docx' ? 'Word document' : format.toUpperCase();
      setError(`Failed to download resume as ${formatName}. Please try again.`);
    } finally {
      setIsDownloading(false);
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
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/dashboard')}
            className="hover:bg-white/10 border-white/20 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
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
                      <div>
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
                      </div>
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
              {ocrResult && (
                <div className="space-y-6">
                  <div>
                    <OCRErrorDisplay
                      confidence={ocrResult.confidence}
                      errorRegions={ocrResult.errorRegions}
                      extractedText={ocrResult.extractedText}
                    />
                  </div>

                  <div>
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
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => setActiveTab("tailor")}
                      disabled={!editedText}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
                    >
                      <Target className="mr-2 w-5 h-5" />
                      Go to Analyze
                    </Button>
                  </div>
                </div>
              )}
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
              <div className="flex justify-center gap-6">
                <div>
                  <Button
                    onClick={analyzeJobDescription}
                    disabled={isAnalyzing || !jobDescription.trim() || !editedText}
                    className={`px-8 py-4 rounded-xl font-medium shadow-lg text-lg ${
                      selectedAIProvider === 'gemini'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    } text-white`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                        Analyzing with {unifiedAIService.getProviderDisplayName(selectedAIProvider)}...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-3 w-6 h-6" />
                        Analyze with {unifiedAIService.getProviderDisplayName(selectedAIProvider)}
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <Button
                    onClick={handleTailorResume}
                    disabled={isTailoring || !hasAnalyzed || !jobDescription.trim() || !editedText}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-medium shadow-lg text-lg"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                        Tailoring with {unifiedAIService.getProviderDisplayName(selectedAIProvider)}...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-3 w-6 h-6" />
                        Tailor with {unifiedAIService.getProviderDisplayName(selectedAIProvider)}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Analysis Results */}
              <AnimatePresence>
                {aiAnalysis && (
                  <motion.div key={`ai-analysis-${aiAnalysis.provider}-${aiAnalysis.overallScore}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-gray-700">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className={`p-2 rounded-lg ${
                            aiAnalysis.provider === 'gemini' 
                              ? 'bg-blue-600/20' 
                              : 'bg-green-600/20'
                          }`}>
                            {aiAnalysis.provider === 'gemini' ? (
                              <Bot className="w-6 h-6 text-blue-400" />
                            ) : (
                              <Zap className="w-6 h-6 text-green-400" />
                            )}
                          </div>
                          {unifiedAIService.getProviderDisplayName(aiAnalysis.provider)} Resume Analysis
                        </CardTitle>
                        <p className="text-gray-400">
                          Comprehensive {unifiedAIService.getProviderDisplayName(aiAnalysis.provider)}-powered analysis
                          {aiAnalysis.atsScore !== undefined && ' with ATS compatibility check'}
                        </p>
                      </CardHeader>
                      <CardContent className="p-6">
                        <AIAnalysisDisplay analysis={aiAnalysis} />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {jobAnalysis && compatibilityScore && (
                  <motion.div key={`job-analysis-${compatibilityScore.overall}`}
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
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-purple-600/20 rounded-lg">
                          <Sparkles className="w-7 h-7 text-purple-400" />
                        </div>
                        Your Tailored Resume
                      </div>
                      
                      {/* Download Buttons */}
                      {tailoredResume && (
                        <div className="flex items-center gap-2">
                          <div>
                            <Button
                              onClick={() => handleDownload('pdf')}
                              disabled={isDownloading}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <FileDown className="w-4 h-4 mr-2" />
                                  PDF
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <div>
                            <Button
                              onClick={() => handleDownload('docx')}
                              disabled={isDownloading}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <FileDown className="w-4 h-4 mr-2" />
                                  Word
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardTitle>
                    <p className="text-gray-400">
                      {enhancedResumeData 
                        ? `${unifiedAIService.getProviderDisplayName(enhancedResumeData.provider)}-optimized resume perfectly aligned with the job requirements`
                        : 'AI-optimized resume perfectly aligned with the job requirements'
                      }
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    {tailoredResume ? (
                      <div className="bg-white rounded-xl p-8 shadow-2xl">
                        <div className="text-gray-900">
                          <ModernProfessionalTemplate data={tailoredResume} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Sparkles className="w-16 h-16 mx-auto mb-6 text-gray-500 opacity-50" />
                        <p className="text-xl mb-2 text-white">No tailored resume available</p>
                        <p className="text-gray-400">Complete the analysis and tailoring process first</p>
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
