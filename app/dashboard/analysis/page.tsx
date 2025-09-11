"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, BarChart3, ArrowLeft, CheckCircle, AlertCircle, Target, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface Resume {
  _id: string;
  title: string;
  template: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

interface AnalysisResult {
  overallScore: number;
  atsScore: number;
  keywordMatch: number;
  sections: {
    [key: string]: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
  };
  missingKeywords: string[];
  strongPoints: string[];
  improvementAreas: string[];
  recommendations: string[];
}

export default function AnalyzePage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
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
      
      if (json.success && json.resumes) {
        setResumes(json.resumes);
      } else {
        setResumes([]);
      }
      
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
    setActiveTab("analyze");
    setError(null);
  };

  const handleAnalyzeResume = async () => {
    if (!selectedResume) {
      setError("Please select a resume to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: selectedResume._id,
          jobDescription: jobDescription || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
      setActiveTab("results");
      
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
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
            <TabsTrigger value="select" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Select Resume
            </TabsTrigger>
            <TabsTrigger value="analyze" disabled={!selectedResume} className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResult} className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Results
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
                  Select from your saved resumes for comprehensive analysis
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
                    {resumes.map((resume) => (
                      <div
                        key={resume._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedResume?._id === resume._id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleResumeSelect(resume)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{resume.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Template: {resume.template || 'Modern'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedResume?._id === resume._id && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyze" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Resume Analysis
                  </CardTitle>
                  <p className="text-gray-600">
                    {selectedResume?.title}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Job Description (Optional)
                      </label>
                      <Textarea
                        placeholder="Paste job description for targeted analysis..."
                        className="min-h-[150px] resize-none"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Adding a job description will provide more targeted feedback
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleAnalyzeResume}
                      disabled={isAnalyzing || !selectedResume}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                          Analyzing Resume...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="mr-2 w-5 h-5" />
                          Analyze Resume
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>What We Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">ATS Compatibility</h4>
                        <p className="text-sm text-gray-600">Format and structure optimization for Applicant Tracking Systems</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Keyword Analysis</h4>
                        <p className="text-sm text-gray-600">Match with job requirements and industry standards</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Content Quality</h4>
                        <p className="text-sm text-gray-600">Section completeness, impact statements, and clarity</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResult && (
              <>
                {/* Overall Score Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Overall Score</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                            {analysisResult.overallScore}/100
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full ${getScoreBgColor(analysisResult.overallScore)}`} />
                        </div>
                      </div>
                      <Progress value={analysisResult.overallScore} className="mt-3" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">ATS Score</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analysisResult.atsScore)}`}>
                            {analysisResult.atsScore}/100
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-green-600" />
                      </div>
                      <Progress value={analysisResult.atsScore} className="mt-3" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Keyword Match</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analysisResult.keywordMatch)}`}>
                            {analysisResult.keywordMatch}/100
                          </p>
                        </div>
                        <Zap className="w-8 h-8 text-blue-600" />
                      </div>
                      <Progress value={analysisResult.keywordMatch} className="mt-3" />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Section Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Section Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(analysisResult.sections).map(([section, data]) => (
                        <div key={section} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold capitalize">{section}</h4>
                            <Badge variant={data.score >= 80 ? "default" : data.score >= 60 ? "secondary" : "destructive"}>
                              {data.score}/100
                            </Badge>
                          </div>
                          <Progress value={data.score} className="h-2" />
                          <p className="text-sm text-gray-600">{data.feedback}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Strong Points</h4>
                        <ul className="space-y-1">
                          {analysisResult.strongPoints.map((point, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">Areas to Improve</h4>
                        <ul className="space-y-1">
                          {analysisResult.improvementAreas.map((area, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {analysisResult.missingKeywords.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-2">Missing Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.missingKeywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Action Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {analysisResult.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
