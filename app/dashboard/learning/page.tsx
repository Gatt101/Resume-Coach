"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, BarChart3, ArrowLeft, CheckCircle, AlertCircle, Upload } from "lucide-react";

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
  overallScore?: number;
  atsScore: number;
  keywordMatch?: number;
  improvementAreas: string[];
  recommendations: string[];
  sections?: Record<string, { score: number; feedback: string; suggestions: string[] }>;
  missingKeywords?: string[];
  strongPoints?: string[];
  skillGaps?: string[];
  experienceGaps?: string[];
  learningPath?: Array<{
    id: string;
    title: string;
    description: string;
    priority: number;
    estimatedWeeks: number;
    effortHours: number;
    resources: Array<{
      title: string;
      url: string;
      type: string;
      duration: string;
    }>;
    prerequisites: string[];
    confidence: number;
  }>;
}export default function LearningPage() {
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("select");
    const [jobRole, setJobRole] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchResumes();
    }, []);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/resume/gaps');
      if (!response.ok) throw new Error('Failed to fetch resumes');
      const json = await response.json();
      const serverResumes: Resume[] = json.resumes || [];            const localResumes: Resume[] = [];
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
                        } catch (e) { /* ignore parse errors */ }
                    }
                }
            }

            setResumes([...localResumes, ...serverResumes]);
            if (([...localResumes, ...serverResumes]).length > 0) setSelectedResume((prev) => prev ?? ([...localResumes, ...serverResumes][0]));
        } catch (err) {
            console.error('Error fetching resumes:', err);
            setError('Failed to load resumes.');
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeResume = async (resume: Resume, role?: string) => {
        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const resumeId = (resume as any)._id || (resume as any).id;
            const isLocal = (resume as any).isLocal || (typeof resumeId === 'string' && resumeId.startsWith('local_'));

            if (isLocal) {
                // Client-side lightweight analysis that aligns with provided role
                const data = resume.data || {};
                const textParts: string[] = [];
                if (data.summary) textParts.push(String(data.summary));
                if (Array.isArray(data.experience)) data.experience.forEach((e: any) => textParts.push(`${e.title || ''} ${e.company || ''} ${e.description || ''}`));
                if (Array.isArray(data.skills)) textParts.push(data.skills.join(' '));

                const docText = textParts.join(' ' ).toLowerCase();
                const roleText = (role || '').toLowerCase();
                const roleKeywords = roleText.split(/\W+/).filter(w => w.length > 3).slice(0, 30);

                const matched = roleKeywords.filter(k => docText.includes(k));
                const keywordMatch = roleKeywords.length ? Math.round((matched.length / roleKeywords.length) * 100) : 0;

                let score = 60;
                if (Array.isArray(data.experience) && data.experience.length > 0) score += 10;
                if (Array.isArray(data.skills) && data.skills.length > 0) score += 10;
                score = Math.max(0, Math.min(100, score));

                const improvement: string[] = [];
                if (!data.summary || String(data.summary).trim().length < 30) improvement.push('Add a concise professional summary.');
                if (!data.experience || data.experience.length === 0) improvement.push('Add detailed work experience with achievements.');
                if (!data.skills || data.skills.length === 0) improvement.push('List relevant technical and soft skills.');

                setAnalysisResult({
                    atsScore: score,
                    overallScore: score,
                    keywordMatch,
                    improvementAreas: improvement,
                    recommendations: improvement.map(i => `Recommendation: ${i}`),
                    missingKeywords: roleKeywords.filter(k => !matched.includes(k)),
                });

                setActiveTab('results');
                return;
            }

      // Server-side analysis via API which triggers Inngest AI
      const resp = await fetch('/api/resume/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resumeId, targetRole: role || null }),
      });            const json = await resp.json();
            if (!resp.ok) throw new Error(json?.error || 'Analysis failed');

      const analysis = json.analysis || json;
      setAnalysisResult({
        atsScore: analysis.atsScore ?? analysis.overallScore ?? 0,
        overallScore: analysis.overallScore ?? undefined,
        keywordMatch: analysis.keywordMatch ?? undefined,
        improvementAreas: analysis.improvementAreas ?? analysis.experienceGaps ?? [],
        recommendations: analysis.recommendations ?? [],
        sections: analysis.sections ?? undefined,
        missingKeywords: analysis.missingKeywords ?? undefined,
        strongPoints: analysis.strongPoints ?? undefined,
        skillGaps: analysis.skillGaps ?? undefined,
        experienceGaps: analysis.experienceGaps ?? undefined,
        learningPath: analysis.learningPath ?? undefined,
      });            setActiveTab('results');
        } catch (err: any) {
            console.error('Error analyzing resume:', err);
            setError(err?.message || 'Failed to analyze resume');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const uploadResume = async (file: File) => {
        const form = new FormData();
        form.append('resume', file);
        form.append('title', file.name);
        form.append('template', 'modern');

        try {
            const response = await fetch('/api/user/upload', { method: 'POST', body: form });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.error || `Upload failed (${response.status})`);
            }
            const data = await response.json();
            if (data?.resume) {
                setResumes(prev => [data.resume, ...prev]);
                setSelectedResume(data.resume);
                setActiveTab('results');
                await analyzeResume(data.resume, jobRole);
            }
        } catch (err) {
            console.error('Upload failed', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="min-h-screen bg-dark p-6">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Resume Gap Analysis (Role-based)</h1>
                        <p className="text-gray-400">Have the AI analyze your resume against a target role and receive gap recommendations.</p>
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
                            <FileText className="w-4 h-4" />
                            Gap Results
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
                                    Choose a Resume & Role
                                </CardTitle>
                                <p className="text-gray-600">Select a resume and provide the target role or paste a job description.</p>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                                    </div>
                                ) : (
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div>
                                            <div className="mb-4">
                                                <select className="w-full bg-white/5 px-3 py-2 rounded" value={(selectedResume?._id || selectedResume?.id) ?? ''} onChange={(e) => {
                                                    const id = e.target.value;
                                                    const found = resumes.find(r => (r._id || r.id) === id);
                                                    setSelectedResume(found ?? null);
                                                }}>
                                                    {resumes.length === 0 ? <option value="">No resumes</option> : resumes.map(r => (
                                                        <option key={r._id || r.id} value={r._id || r.id}>{r.title || r.data?.name || `Resume ${r._id || r.id}`}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm text-gray-300 mb-2">Target role / Job description</label>
                                                <textarea value={jobRole} onChange={(e) => setJobRole(e.target.value)} className="w-full min-h-[120px] p-2 rounded bg-white/5" placeholder="e.g. Senior React Developer — 5+ years, TypeScript, React, AWS"></textarea>
                                            </div>

                                            <div className="flex gap-3">
                                                <Button
                                                    className="w-48 bg-green-600 hover:bg-green-700"
                                                    onClick={async () => {
                                                        if (!selectedResume) return;
                                                        await analyzeResume(selectedResume, jobRole);
                                                    }}
                                                    disabled={!selectedResume || isAnalyzing}
                                                >
                                                    {isAnalyzing ? (
                                                        <>
                                                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />Analyzing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BarChart3 className="mr-2 w-5 h-5" />Analyze for role
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Hidden file input triggered by button to ensure click works reliably */}
                                                <input
                                                    id="learning-upload-input"
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.txt"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const f = e.target.files?.[0];
                                                        if (!f) return;
                                                        await uploadResume(f);
                                                    }}
                                                />

                                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                    Upload & Parse
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Notes</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-gray-400">Providing a specific job title or a short job description improves keyword matching and gap detection.</p>
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
                                    <h2 className="text-2xl font-bold text-white">Gap Analysis Results</h2>
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" onClick={() => setActiveTab('select')}>Back</Button>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="lg:col-span-2 space-y-6">
                                        <Card className="bg-gradient-to-r from-gray-800 via-gray-900 to-black border-0">
                                            <CardContent className="p-8 text-center">
                                                <p className="text-sm text-gray-400 uppercase">ATS Score</p>
                                                <p className={`text-6xl font-extrabold mt-2 ${getScoreColor(analysisResult.atsScore)}`}>{analysisResult.atsScore}<span className="text-2xl ml-2 text-gray-400">/100</span></p>
                                                <div className="mt-6">
                                                    <Progress value={analysisResult.atsScore} className="h-3 rounded-full" />
                                                </div>
                                                <p className="text-sm text-gray-400 mt-3">This score is an estimate of how well your resume matches ATS checks and the provided role.</p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Areas to Improve</CardTitle>
                                                <p className="text-sm text-gray-500">Top issues affecting your match</p>
                                            </CardHeader>
                                            <CardContent>
                                                {analysisResult.improvementAreas.length === 0 ? (
                                                    <p className="text-sm text-gray-50">No major issues detected.</p>
                                                ) : (
                                                    <ul className="list-disc pl-5 space-y-2">
                                                        {analysisResult.improvementAreas.map((area, i) => (
                                                            <li key={i} className="text-sm text-gray-50">{area}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Recommendations</CardTitle>
                                                <p className="text-sm text-gray-500">Actionable tips to close the gaps</p>
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

                                        {analysisResult.learningPath && analysisResult.learningPath.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Guided Learning Path</CardTitle>
                                                    <p className="text-sm text-gray-500">Structured plan to close your skill gaps</p>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {analysisResult.learningPath.map((module, idx) => (
                                                            <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-semibold">
                                                                            {module.priority}
                                                                        </span>
                                                                        <div>
                                                                            <h4 className="font-semibold text-gray-100">{module.title}</h4>
                                                                            <p className="text-sm text-gray-400">{module.description}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right text-sm text-gray-400">
                                                                        <div>{module.estimatedWeeks} weeks</div>
                                                                        <div>{module.effortHours}h/week</div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {module.prerequisites && module.prerequisites.length > 0 && (
                                                                    <div className="mb-3">
                                                                        <span className="text-xs font-medium text-gray-500">Prerequisites:</span>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {module.prerequisites.map((prereq, i) => (
                                                                                <span key={i} className="px-2 py-1 bg-gray-700 text-xs rounded">{prereq}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="space-y-2">
                                                                    <span className="text-xs font-medium text-gray-500">Learning Resources:</span>
                                                                    {module.resources.map((resource, i) => (
                                                                        <div key={i} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`px-2 py-1 text-xs rounded ${
                                                                                    resource.type === 'youtube' ? 'bg-red-600' :
                                                                                    resource.type === 'course' ? 'bg-blue-600' :
                                                                                    resource.type === 'documentation' ? 'bg-green-600' :
                                                                                    'bg-gray-600'
                                                                                }`}>
                                                                                    {resource.type}
                                                                                </span>
                                                                                <span className="text-sm text-gray-200">{resource.title}</span>
                                                                                <span className="text-xs text-gray-400">({resource.duration})</span>
                                                                            </div>
                                                                            <a 
                                                                                href={resource.url} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-400 hover:text-blue-300 text-sm"
                                                                            >
                                                                                Open →
                                                                            </a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {analysisResult.skillGaps && analysisResult.skillGaps.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Skill Gaps</CardTitle>
                                                    <p className="text-sm text-gray-500">Skills missing for your target role</p>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysisResult.skillGaps.map((skill, i) => (
                                                            <span key={i} className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">{skill}</span>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Missing Keywords</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysisResult.missingKeywords.map((k, i) => (
                                                            <span key={i} className="px-2 py-1 bg-white/5 rounded">{k}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400">No missing keywords detected.</p>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Quick Actions</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-col gap-2">
                                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => router.push('/dashboard/builder')}>Open Builder</Button>
                                                    <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/tailor')}>Tailor for Job</Button>
                                                </div>
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