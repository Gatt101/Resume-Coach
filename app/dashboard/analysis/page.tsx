"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, BarChart3, ArrowLeft, CheckCircle, AlertCircle, Target, TrendingUp, Zap } from "lucide-react";
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
    <div className="min-h-screen bg-dark p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push('/dashboard')}
          className="hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Resume Analyzer</h1>
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <TabsContent value="select" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Choose a Resume to Analyze
                </CardTitle>
                <p className="text-gray-600">
                  Select a resume to get instant ATS score and improvement recommendations
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                ) : resumes.length === 0 ? (
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
                  <div className="grid gap-4 md:grid-cols-2">
                    {resumes.map((resume) => {
                      const resumeId = resume._id || resume.id;
                      const selectedId = selectedResume?._id || selectedResume?.id;
                      const isSelected = resumeId === selectedId;
                      
                      return (
                        <div
                          key={resumeId}
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => !isAnalyzing && handleResumeSelect(resume)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{resume.title}</h3>
                              {resume.isLocal && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                  Local Resume
                                </span>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                Template: {resume.template || 'Modern'}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
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
                  )}

                {/* Analyze Selected Button */}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResult && (
              <div className="max-w-3xl mx-auto space-y-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm font-medium text-gray-600">ATS Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(analysisResult.atsScore)}`}>
                      {analysisResult.atsScore}/100
                    </p>
                    <Progress value={analysisResult.atsScore} className="mt-4" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Areas to Improve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.improvementAreas.length === 0 ? (
                      <p className="text-sm text-gray-600">No major issues detected. Your resume looks ATS-friendly.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-2">
                        {analysisResult.improvementAreas.map((area, i) => (
                          <li key={i} className="text-sm text-gray-700">{area}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {analysisResult.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((r, idx) => (
                          <li key={idx} className="text-sm text-gray-700">{r}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
