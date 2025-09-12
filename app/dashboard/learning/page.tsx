"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, BarChart3, ArrowLeft, CheckCircle, AlertCircle, Upload, Target, BookOpen, Lightbulb } from "lucide-react";

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

interface GapAnalysisResult {
  overallScore: number;
  skillGaps: string[];
  experienceGaps: string[];
  recommendations: string[];
  learningPath: Array<{
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
  strongPoints?: string[];
  targetRole?: string;
  missingKeywords?: string[];
}

interface UploadedResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

export default function LearningPage() {
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [uploadedResumeData, setUploadedResumeData] = useState<UploadedResumeData | null>(null);
    const [targetRole, setTargetRole] = useState<string>("");
    const [analysisResult, setAnalysisResult] = useState<GapAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("upload");
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
            const serverResumes: Resume[] = json.resumes || [];
            
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
                        } catch (e) { /* ignore parse errors */ }
                    }
                }
            }

            setResumes([...localResumes, ...serverResumes]);
        } catch (err) {
            console.error('Error fetching resumes:', err);
            setError('Failed to load resumes.');
        } finally {
            setIsLoading(false);
        }
    };

    const performGapAnalysis = async () => {
        if (!targetRole.trim()) {
            setError('Please specify a target role for analysis');
            return;
        }

        if (!selectedResume && !uploadedResumeData) {
            setError('Please select a resume or upload one for analysis');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            let resumeData;
            let resumeId;

            if (selectedResume) {
                resumeId = selectedResume._id || selectedResume.id;
                if (!resumeId) {
                    throw new Error('Invalid resume ID');
                }
                resumeData = selectedResume;
            } else if (uploadedResumeData) {
                resumeData = uploadedResumeData;
                resumeId = 'uploaded-resume';
            }

            // For uploaded resumes or local analysis
            if (resumeId === 'uploaded-resume' || selectedResume?.isLocal) {
                // Simulate AI analysis with local processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const analysis = createLocalGapAnalysis(resumeData, targetRole);
                setAnalysisResult(analysis);
                setActiveTab('results');
                return;
            }

      // Server-side analysis via API which triggers Inngest AI
      const resp = await fetch('/api/resume/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeId: resumeId, targetRole: targetRole.trim() }),
            });
            
            const json = await resp.json();
            if (!resp.ok) throw new Error(json?.error || 'Gap analysis failed');

      const analysis = json.analysis || json;
      setAnalysisResult({
                overallScore: analysis.overallScore || 0,
                skillGaps: analysis.skillGaps || [],
                experienceGaps: analysis.experienceGaps || [],
                recommendations: analysis.recommendations || [],
                learningPath: analysis.learningPath || [],
                strongPoints: analysis.strongPoints || [],
                targetRole: targetRole,
                missingKeywords: analysis.missingKeywords || [],
            });
            
            setActiveTab('results');
        } catch (err: any) {
            console.error('Error performing gap analysis:', err);
            setError(err?.message || 'Failed to perform gap analysis');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const createLocalGapAnalysis = (resumeData: any, role: string): GapAnalysisResult => {
        const skills = resumeData?.skills || [];
        const experience = resumeData?.experience || [];
        const summary = resumeData?.summary || '';
        
        // Basic role-based analysis
        const roleKeywords = role.toLowerCase();
        let skillGaps: string[] = [];
        let experienceGaps: string[] = [];
        let learningPath: any[] = [];
        
        // Analyze common tech skills based on role
        if (roleKeywords.includes('react') && !skills.some((s: string) => s.toLowerCase().includes('react'))) {
            skillGaps.push('React.js');
            learningPath.push({
                id: 'react-fundamentals',
                title: 'React.js Fundamentals',
                description: 'Learn React components, hooks, and modern patterns for building interactive UIs',
                priority: 1,
                estimatedWeeks: 4,
                effortHours: 10,
                resources: [
                    {
                        title: 'React Official Tutorial',
                        url: 'https://react.dev/learn',
                        type: 'documentation',
                        duration: '8 hours'
                    }
                ],
                prerequisites: ['JavaScript ES6+', 'HTML/CSS'],
                confidence: 0.9
            });
        }
        
        if (roleKeywords.includes('python') && !skills.some((s: string) => s.toLowerCase().includes('python'))) {
            skillGaps.push('Python');
            learningPath.push({
                id: 'python-fundamentals',
                title: 'Python Programming',
                description: 'Learn Python programming from basics to advanced concepts',
                priority: 1,
                estimatedWeeks: 4,
                effortHours: 10,
                resources: [
                    {
                        title: 'Python for Everybody by Dr. Chuck',
                        url: 'https://www.youtube.com/watch?v=8DvywoWv6fI',
                        type: 'youtube',
                        duration: '14 hours'
                    }
                ],
                prerequisites: ['Basic programming concepts'],
                confidence: 0.9
            });
        }
        
        // Check for experience gaps
        if (experience.length < 2) {
            experienceGaps.push('Limited professional work experience');
        }
        
        if (!summary || summary.length < 50) {
            experienceGaps.push('Weak professional summary');
        }
        
        // Calculate overall score
        let score = 60; // Base score
        score += skills.length * 2; // +2 per skill
        score += experience.length * 8; // +8 per experience entry
        if (summary && summary.length > 50) score += 10;
        
        // Adjust score based on role match
        const roleText = role.toLowerCase();
        const docText = `${summary} ${skills.join(' ')} ${experience.map((e: any) => `${e.title} ${e.description}`).join(' ')}`.toLowerCase();
        const roleWords = roleText.split(/\W+/).filter(w => w.length > 3);
        const matchedWords = roleWords.filter(w => docText.includes(w));
        const matchPercentage = roleWords.length ? (matchedWords.length / roleWords.length) : 0;
        score += matchPercentage * 20; // Up to +20 for good keyword match
        
        score = Math.max(30, Math.min(95, Math.round(score)));
        
        return {
            overallScore: score,
            skillGaps,
            experienceGaps,
            learningPath: learningPath.sort((a, b) => a.priority - b.priority),
            recommendations: [
                'Focus on building practical projects that demonstrate your skills',
                'Contribute to open source projects to gain experience',
                'Network with professionals in your target field',
                'Consider taking online courses or certifications',
                'Update your resume regularly with new skills and experiences'
            ],
            targetRole: role
        };
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setError(null);
            
            // Basic file validation
            if (!file.type.includes('pdf') && !file.type.includes('doc') && !file.type.includes('txt')) {
                throw new Error('Please upload a PDF, DOC, or TXT file');
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('File size must be less than 5MB');
            }

            // For demo purposes, create mock resume data
            // In a real implementation, you'd parse the actual file
            const mockResumeData: UploadedResumeData = {
                personalInfo: {
                    name: 'John Doe',
                    email: 'john.doe@email.com',
                    phone: '+1-555-0123',
                    location: 'San Francisco, CA'
                },
                summary: 'Experienced software developer with 3 years of experience in web development, passionate about creating efficient and scalable solutions.',
                experience: [
                    {
                        title: 'Software Developer',
                        company: 'Tech Solutions Inc.',
                        duration: '2022 - Present',
                        description: 'Developed web applications using React and Node.js, improved application performance by 30%'
                    }
                ],
                education: [
                    {
                        degree: 'Bachelor of Science in Computer Science',
                        school: 'University of California',
                        year: '2021'
                    }
                ],
                skills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'Git'],
                projects: [
                    {
                        name: 'E-commerce Platform',
                        description: 'Built a full-stack e-commerce application with React and Express',
                        technologies: ['React', 'Express', 'MongoDB']
                    }
                ]
            };

            setUploadedResumeData(mockResumeData);
            setSelectedResume(null); // Clear selected resume if any
            setActiveTab('analyze');
            
        } catch (err: any) {
            setError(err.message || 'Failed to upload file');
        }

        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
                    <div className="p-2 bg-purple-600 rounded-lg">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Resume Gap Analysis</h1>
                        <p className="text-gray-400">Discover skill and experience gaps between your resume and target roles, with personalized learning paths.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload
                        </TabsTrigger>
                        <TabsTrigger value="analyze" className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Analyze
                        </TabsTrigger>
                        <TabsTrigger value="results" disabled={!analysisResult} className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Learn
                        </TabsTrigger>
                    </TabsList>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <TabsContent value="upload" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Upload Resume or Select from Library
                                </CardTitle>
                                <p className="text-gray-600">Choose how you want to provide your resume for gap analysis.</p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Upload Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">Upload New Resume</h3>
                                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-400 mb-4">Drop your resume here or click to browse</p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.doc,.docx,.txt"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                            <Button 
                                                variant="outline" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full"
                                            >
                                                Choose File
                                            </Button>
                                            <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, TXT (Max 5MB)</p>
                                        </div>
                                        
                                        {uploadedResumeData && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                    <p className="text-green-700 font-medium">Resume uploaded successfully!</p>
                                                </div>
                                                <p className="text-green-600 text-sm mt-1">Name: {uploadedResumeData.personalInfo.name}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Existing Resumes Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">Use Existing Resume</h3>
                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                    </div>
                                ) : (
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {resumes.length === 0 ? (
                                                    <p className="text-gray-400 text-center py-4">No resumes found</p>
                                                ) : (
                                                    resumes.map(resume => (
                                                        <div 
                                                            key={resume._id || resume.id}
                                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                                selectedResume?._id === resume._id || selectedResume?.id === resume.id
                                                                    ? 'border-purple-500 bg-purple-50' 
                                                                    : 'border-gray-300 hover:border-purple-300'
                                                            }`}
                                                            onClick={() => {
                                                                setSelectedResume(resume);
                                                                setUploadedResumeData(null);
                                                            }}
                                                        >
                                                            <p className="font-medium text-white">{resume.title}</p>
                                                            <p className="text-sm text-gray-400">
                                                                {resume.isLocal ? 'Local' : 'Server'} • 
                                                                {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : 'Unknown date'}
                                                            </p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <Button 
                                        onClick={() => setActiveTab('analyze')}
                                        disabled={!selectedResume && !uploadedResumeData}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        Continue to Analysis
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analyze" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Target Role Analysis
                                </CardTitle>
                                <p className="text-gray-600">Specify the role you're targeting to get personalized gap analysis and learning recommendations.</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                    <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="target-role" className="text-white">Target Role</Label>
                                            <Input
                                                id="target-role"
                                                value={targetRole}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                placeholder="e.g., Senior Frontend Developer"
                                                className="mt-1"
                                            />
                                            </div>

                                        <div>
                                            <Label htmlFor="role-description" className="text-white">Role Description (Optional)</Label>
                                            <Textarea
                                                id="role-description"
                                                value={targetRole}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                placeholder="Paste job description or add more details about the role requirements..."
                                                className="mt-1 min-h-[120px]"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                The more detailed your target role description, the better our analysis will be.
                                            </p>
                                            </div>

                                                <Button
                                            onClick={performGapAnalysis}
                                            disabled={!targetRole.trim() || (!selectedResume && !uploadedResumeData) || isAnalyzing}
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                                >
                                                    {isAnalyzing ? (
                                                        <>
                                                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                                    Analyzing Gaps...
                                                        </>
                                                    ) : (
                                                        <>
                                                    <Target className="mr-2 w-5 h-5" />
                                                    Analyze Resume Gaps
                                                        </>
                                                    )}
                                                </Button>
                                        </div>

                                        <div>
                                            <Card>
                                                <CardHeader>
                                                <CardTitle className="text-sm">Selected Resume</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                {uploadedResumeData ? (
                                                    <div>
                                                        <p className="font-medium text-white">{uploadedResumeData.personalInfo.name}</p>
                                                        <p className="text-sm text-gray-400">Uploaded Resume</p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {uploadedResumeData.skills.length} skills • {uploadedResumeData.experience.length} experience entries
                                                        </p>
                                                    </div>
                                                ) : selectedResume ? (
                                                    <div>
                                                        <p className="font-medium text-white">{selectedResume.title}</p>
                                                        <p className="text-sm text-gray-400">
                                                            {selectedResume.isLocal ? 'Local Resume' : 'Server Resume'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 text-sm">No resume selected</p>
                                                )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="results" className="space-y-6">
                        {analysisResult && (
                            <div className="max-w-6xl mx-auto">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-white">Gap Analysis Results</h2>
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" onClick={() => setActiveTab('analyze')}>Back to Analysis</Button>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Overall Score */}
                                        <Card className="bg-gradient-to-r from-purple-800 via-purple-900 to-black border-0">
                                            <CardContent className="p-8 text-center">
                                                <p className="text-sm text-gray-300 uppercase tracking-wide">Role Match Score</p>
                                                <p className={`text-6xl font-extrabold mt-2 ${getScoreColor(analysisResult.overallScore)}`}>
                                                    {analysisResult.overallScore}<span className="text-2xl ml-2 text-gray-400">/100</span>
                                                </p>
                                                <div className="mt-6">
                                                    <Progress value={analysisResult.overallScore} className="h-3 rounded-full" />
                                                </div>
                                                <p className="text-sm text-gray-300 mt-3">
                                                    How well your current profile matches "{analysisResult.targetRole}"
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {/* Learning Path */}
                                        {analysisResult.learningPath && analysisResult.learningPath.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <BookOpen className="w-5 h-5" />
                                                        Personalized Learning Path
                                                    </CardTitle>
                                                    <p className="text-sm text-gray-500">Structured plan to bridge your skill gaps</p>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {analysisResult.learningPath.map((module, idx) => (
                                                            <div key={module.id} className="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-semibold">
                                                                            {module.priority}
                                                                        </span>
                                                                        <div>
                                                                            <h4 className="font-semibold text-white">{module.title}</h4>
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
                                                                        <span className="text-xs font-medium text-gray-400">Prerequisites:</span>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {module.prerequisites.map((prereq, i) => (
                                                                                <span key={i} className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300">{prereq}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="space-y-2">
                                                                    <span className="text-xs font-medium text-gray-400">Learning Resources:</span>
                                                                    {module.resources.map((resource, i) => (
                                                                        <div key={i} className="flex items-center justify-between bg-gray-700 p-2 rounded">
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
                                                                                className="text-purple-400 hover:text-purple-300 text-sm"
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

                                        {/* Recommendations */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Lightbulb className="w-5 h-5" />
                                                    Action Recommendations
                                                </CardTitle>
                                                <p className="text-sm text-gray-500">Immediate steps you can take</p>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-3">
                                                    {analysisResult.recommendations.map((recommendation, idx) => (
                                                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-200">
                                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                            {recommendation}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Skill Gaps */}
                                        {analysisResult.skillGaps && analysisResult.skillGaps.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Skill Gaps</CardTitle>
                                                    <p className="text-sm text-gray-500">Skills you need to develop</p>
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

                                        {/* Experience Gaps */}
                                        {analysisResult.experienceGaps && analysisResult.experienceGaps.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                    <CardTitle>Experience Gaps</CardTitle>
                                                    <p className="text-sm text-gray-500">Areas needing more experience</p>
                                            </CardHeader>
                                            <CardContent>
                                                    <ul className="space-y-2">
                                                        {analysisResult.experienceGaps.map((gap, i) => (
                                                            <li key={i} className="text-sm text-orange-400 flex items-center gap-2">
                                                                <AlertCircle className="w-4 h-4" />
                                                                {gap}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Strong Points */}
                                        {analysisResult.strongPoints && analysisResult.strongPoints.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Your Strengths</CardTitle>
                                                    <p className="text-sm text-gray-500">What you're already good at</p>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {analysisResult.strongPoints.map((strength, i) => (
                                                            <li key={i} className="text-sm text-green-400 flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" />
                                                                {strength}
                                                            </li>
                                                        ))}
                                                    </ul>
                                            </CardContent>
                                        </Card>
                                        )}

                                        {/* Quick Actions */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Quick Actions</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-col gap-2">
                                                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => router.push('/dashboard/builder')}>
                                                        Improve Resume
                                                    </Button>
                                                    <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/tailor')}>
                                                        Tailor for Job
                                                    </Button>
                                                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('analyze')}>
                                                        Analyze Another Role
                                                    </Button>
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