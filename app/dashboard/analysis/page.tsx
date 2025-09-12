"use client"
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, BarChart3, ArrowLeft, CheckCircle, AlertCircle, Target, TrendingUp, Zap, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

interface Resume {
  _id?: string;
  id?: string;
  title: string;
  template?: string;
  data: any;
  createdAt?: string;
  updatedAt?: string;
  isLocal?: boolean;
}

interface AnalysisResult {
  atsScore: number;
  improvementAreas: string[];
  recommendations: string[];
}

export default function AnalyzePage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("select");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAll, setShowAll] = useState(false);
  const VISIBLE_COUNT = 4;

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/resume');
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }
      const json = await response.json();
      
      let serverResumes: Resume[] = [];
      if (json.success && json.resumes) serverResumes = json.resumes;

      const localResumes: Resume[] = [];
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('resume_')) {
            try {
              const raw = localStorage.getItem(key);
              if (!raw) continue;
              const parsed = JSON.parse(raw);
              localResumes.push({
                id: parsed.id || parsed._id || key.replace('resume_', ''),
                title: parsed.title || parsed.metadata?.originalName || 'Local Resume',
                template: parsed.template,
                data: parsed.data,
                isLocal: true,
                updatedAt: parsed.metadata?.generatedAt,
              });
            } catch (e) {
              // ignore
            }
          }
        }
      }

      setResumes([...localResumes, ...serverResumes]);
      
    } catch (error) {
      console.error("Error fetching resumes:", error);
      setError("Failed to load resumes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSelect = (resume: Resume) => {
    setSelectedResume(resume);
    setAnalysisResult(null);
    setError(null);
  };

  const analyzeResume = async (resume: Resume) => {
    try {
      const resumeId = (resume as any)._id || (resume as any).id;
      const isLocal = (resume as any).isLocal || (typeof resumeId === 'string' && resumeId.startsWith('local_'));

      if (isLocal) {
        // lightweight client-side scoring for local resumes
        const clientAnalysis = (() => {
          const data = resume.data || {};
          const textParts: string[] = [];
          if (data.summary) textParts.push(String(data.summary));
          if (Array.isArray(data.experience)) data.experience.forEach((e: any) => textParts.push(`${e.title || ''} ${e.company || ''} ${e.description || ''}`));
          if (Array.isArray(data.skills)) textParts.push(data.skills.join(' '));

          let score = 50;
          const present = [data.summary, data.experience && data.experience.length > 0, data.skills && data.skills.length > 0, data.education];
          score += present.filter(Boolean).length * 10;

          // Basic ATS scoring without job description
          score = Math.max(0, Math.min(100, score));
          const improvement: string[] = [];
          if (!data.summary || String(data.summary).trim().length < 30) improvement.push('Add a concise professional summary.');
          if (!data.experience || data.experience.length === 0) improvement.push('Add detailed work experience with achievements.');
          if (!data.skills || data.skills.length === 0) improvement.push('List relevant technical and soft skills.');
          if (!data.education) improvement.push('Include education details.');

          return {
            atsScore: score,
            improvementAreas: improvement,
            recommendations: improvement.map(i => `Recommendation: ${i}`),
          } as AnalysisResult;
        })();

        setAnalysisResult(clientAnalysis);
        setActiveTab('results');
      } else {
        const response = await fetch('/api/resume/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resumeId: resume._id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze resume');
        }

        const data = await response.json();
        const analysis = data.analysis || data;
        setAnalysisResult({
          atsScore: analysis.atsScore ?? analysis.overallScore ?? 0,
          improvementAreas: analysis.improvementAreas ?? [],
          recommendations: analysis.recommendations ?? [],
        });
        setActiveTab('results');
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload resume to server (uses existing upload endpoint which returns parsed JSON)
  const uploadResume = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', file.name);
      formData.append('template', 'modern');

      const response = await fetch('/api/user/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errText = `Upload failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          errText = errJson.error || JSON.stringify(errJson);
        } catch (e) {
          try { errText = await response.text(); } catch (_) {}
        }
        throw new Error(errText);
      }

      const data = await response.json();
      if (data && data.resume) {
        // Set the returned parsed resume as selected and run analysis
        const parsed: Resume = data.resume;
        setSelectedResume(parsed as Resume);
        setActiveTab('results');
        // run analyze (server expects resumeId for saved ones; for local parsed data use client analysis)
        // We'll trigger client analysis by passing the parsed resume object
        await analyzeResume(parsed as Resume);
      } else {
        throw new Error('Upload succeeded but no resume data returned');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen p-6 text-white bg-gradient-to-br from-[#0b0714] via-[#2b123b] to-[#121223]">
        <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push('/dashboard')}
          className="hover:bg-white/5 transition-colors border-border/30 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Resume Analyzer</h1>
            <p className="text-gray-400">ATS optimization and gap analysis for your resume</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto mb-8">
            <TabsTrigger value="select" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Select Resume
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResult} className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Analysis Results
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800/60 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <TabsContent value="select" className="space-y-6">
            <Card className="bg-black/30 border-border/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Choose a Resume to Analyze
                </CardTitle>
                <p className="text-gray-400">
                  Select a resume to get instant ATS score and improvement recommendations
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Choose a resume (shows limited list with toolbar) */}
                    <div className="flex-1">
                      {resumes.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">No resumes found</p>
                          <Button 
                            onClick={() => router.push('/dashboard/builder')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Create Your First Resume
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-200">Your Resumes</h3>
                            {resumes.length > VISIBLE_COUNT && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Showing {showAll ? resumes.length : VISIBLE_COUNT} of {resumes.length}</span>
                                <Button size="sm" variant="ghost" onClick={() => setShowAll(s => !s)}>
                                  {showAll ? 'Show less' : 'Show more'}
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            {(showAll ? resumes : resumes.slice(0, VISIBLE_COUNT)).map((resume) => {
                              const resumeId = resume._id || resume.id;
                              const selectedId = selectedResume?._id || selectedResume?.id;
                              const isSelected = resumeId === selectedId;
                              return (
                                <div
                                  key={resumeId}
                                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border border-green-500 bg-gradient-to-r from-green-900/30 to-transparent shadow-md'
                                      : 'border border-border/20 hover:border-border/30 bg-transparent hover:shadow-sm'
                                  }`}
                                  onClick={() => !isAnalyzing && handleResumeSelect(resume)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-white">{resume.title}</h3>
                                      {resume.isLocal && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 mt-1">
                                          Local Resume
                                        </span>
                                      )}
                                      <p className="text-sm text-gray-400 mt-1">
                                        Template: {resume.template || 'Modern'}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-2">
                                        Updated: {new Date(resume.updatedAt ?? Date.now()).toLocaleDateString()}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      isAnalyzing ? (
                                        <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 flex justify-center">
                            <Button
                              onClick={async () => {
                                if (!selectedResume) return;
                                setIsAnalyzing(true);
                                setError(null);
                                try {
                                  await analyzeResume(selectedResume);
                                } finally {
                                  setIsAnalyzing(false);
                                }
                              }}
                              disabled={!selectedResume || isAnalyzing}
                              className="w-64 bg-green-600 hover:bg-green-700"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <BarChart3 className="mr-2 w-5 h-5" />
                                  Analyze Selected
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right: Upload Resume Card */}
                    <div className="w-full lg:w-1/2">
                      <Card className="bg-black/20 border-border/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Upload Resume (OCR)
                          </CardTitle>
                          <p className="text-gray-400">Upload a PDF/DOCX to run OCR and parsing, then analyze it.</p>
                        </CardHeader>
                        <CardContent>
                          <div
                            className={`m-4 text-center py-8 border-dashed border-2 ${
                              dragOver ? "border-green-500 bg-green-900/20" : "border-border/20 bg-transparent"
                            } rounded-lg`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              setDragOver(false);
                              const dropped = e.dataTransfer.files?.[0];
                              if (!dropped) return;
                              setFile(dropped);
                              await uploadResume(dropped);
                            }}
                          >
                            <p className="text-xl text-gray-700">{file ? file.name : "Drag & drop your resume here"}</p>
                            <p className="text-gray-500 mt-2">Or click to select a file (PDF, DOCX)</p>
                            <div className="mt-4">
                              <label className="inline-block">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".pdf,.doc,.docx,.txt"
                                  className="hidden"
                                  onChange={async (ev) => {
                                    const f = ev.target.files?.[0];
                                    if (!f) return;
                                    setFile(f);
                                    await uploadResume(f);
                                  }}
                                />
                                <Button className="bg-green-600 hover:bg-green-700" disabled={isUploading}
                                  onClick={() => {
                                    if (fileInputRef.current) {
                                      fileInputRef.current.click();
                                    }
                                  }}>
                                  {isUploading ? (
                                    <>
                                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                      Analyzing
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mr-2 w-5 h-5" />
                                      Select File
                                    </>
                                  )}
                                </Button>
                              </label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResult && (
              <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setActiveTab('select')}>Back to selection</Button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Big Score Card (dashboard palette) */}
                    <Card className="bg-gradient-to-br from-[#0b0714] via-[#2b123b] to-[#121223] border-0">
                      <CardContent className="p-8 text-center">
                        <p className="text-sm text-gray-400 uppercase">ATS Score</p>
                        <p className={`text-6xl font-extrabold mt-2 ${getScoreColor(analysisResult.atsScore)}`}>{analysisResult.atsScore}<span className="text-2xl ml-2 text-gray-400">/100</span></p>
                        <div className="mt-6">
                          <Progress value={analysisResult.atsScore} className="h-3 rounded-full bg-gradient-to-r from-green-500 via-primary to-amber-400" />
                        </div>
                        <p className="text-sm text-gray-400 mt-3">This score is a quick estimate of how well your resume performs against typical ATS checks.</p>
                      </CardContent>
                    </Card>

                    {/* Areas to Improve */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Areas to Improve</CardTitle>
                        <p className="text-sm text-gray-500">Top issues affecting your ATS score</p>
                      </CardHeader>
                      <CardContent>
                        {analysisResult.improvementAreas.length === 0 ? (
                          <p className="text-sm text-gray-50">No major issues detected. Your resume looks ATS-friendly.</p>
                        ) : (
                          <ul className="list-disc pl-5 space-y-2">
                            {analysisResult.improvementAreas.map((area, i) => (
                              <li key={i} className="text-sm text-gray-50">{area}</li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Recommendations</CardTitle>
                        <p className="text-sm text-gray-500">Actionable tips to boost your score</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysisResult.recommendations.length === 0 ? (
                            <li className="text-sm text-gray-50">No recommendations available.</li>
                          ) : (
                            analysisResult.recommendations.map((r, idx) => (
                              <li key={idx} className="text-sm text-gray-50">{r}</li>
                            ))
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* CTA column */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Improve my ATS</CardTitle>
                        <p className="text-sm text-gray-500">Pick how you'd like to improve your resume</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="font-medium">Rebuild your resume</p>
                          <p className="text-sm text-gray-500">Start from scratch in the visual builder to create a clean, ATS-friendly resume.</p>
                          <div className="flex gap-2 mt-2">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => router.push('/dashboard/builder')}>Rebuild Resume</Button>
                            <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/builder')}>Open Builder</Button>
                          </div>
                        </div>

                        <hr />

                        <div className="space-y-2">
                          <p className="font-medium">Tailor for a job</p>
                          <p className="text-sm text-gray-500">Optimize this resume for a specific job posting with targeted keyword alignment.</p>
                          <div className="flex gap-2 mt-2">
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => router.push('/dashboard/tailor')}>Tailor Resume</Button>
                            <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/tailor')}>Open Tailor</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Need help?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">If you want a hands-on walkthrough, use the builder to reconstruct your resume or the tailor tool to match a job posting.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
