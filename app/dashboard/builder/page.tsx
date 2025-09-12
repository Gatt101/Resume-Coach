"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, FileText, Wand2, Loader2, CheckCircle, Clock, AlertCircle, Github } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplatePreview } from "@/components/resume-templates/TemplatePreview"
import { ModernTemplate } from "@/components/resume-templates/ModernTemplate"
import { ClassicTemplate } from "@/components/resume-templates/ClassicTemplate"
import { CreativeTemplate } from "@/components/resume-templates/CreativeTemplate"
import { ProfessionalTemplate } from "@/components/resume-templates/ProfessionalTemplate"
import { ExamplePrompts } from "@/components/resume-templates/ExamplePrompts"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import ManualResumeForm from "@/components/ManualResumeForm"
import { Progress } from "@/components/ui/progress"
import GitHubResumeModal from "@/components/GitHubResumeModal"
import GitHubResumeButton from "@/components/GitHubResumeButton"

import { ResumeIngestPayload } from "@/lib/services/github-resume-processor"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export default function BuilderPage() {
    const router = useRouter()
    const [description, setDescription] = useState("")
    const [selectedTemplate, setSelectedTemplate] = useState("modern")
    const [resume, setResume] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("create")
    const [showExamples, setShowExamples] = useState(false)
    const [resumeSource, setResumeSource] = useState<'manual' | 'ai' | 'github' | null>(null)
    const [progress, setProgress] = useState(0)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)

    const templates = [
        { value: "modern", label: "Modern", description: "Clean, contemporary design with gradient header" },
        { value: "classic", label: "Classic", description: "Traditional, formal layout with serif typography" },
        { value: "creative", label: "Creative", description: "Colorful, innovative design with sidebar layout" },
        { value: "professional", label: "Professional", description: "Corporate-style layout with blue accents" },
    ]

    const handleGenerateResume = async () => {
        if (!description.trim()) {
            setError('Please provide a description of your background and preferences.')
            return
        }

        setIsLoading(true)
        setError(null)
        setProgress(0)
        
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90))
        }, 200)
        
        try {
            const response = await fetch('/api/resume/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    description, 
                    template: selectedTemplate,
                    preferSync: true
                }),
            })
            
            if (!response.ok) {
                throw new Error('Failed to generate resume')
            }
            
            const data = await response.json()
            
            clearInterval(progressInterval)
            setProgress(100)
            
            if (data.resume) {
                setResume(data.resume)
                setResumeSource('ai')
                setActiveTab("preview")
                console.log('AI Resume Generated:', data.resume)
                
                // Auto-save the generated resume
                try {
                    await fetch('/api/user/resume', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            resume: data.resume, 
                            template: selectedTemplate 
                        }),
                    });
                    console.log('Resume auto-saved to account');
                } catch (saveError) {
                    console.error('Failed to auto-save resume:', saveError);
                }
            } else {
                throw new Error('No resume data received from AI')
            }
            
        } catch (err) {
            clearInterval(progressInterval)
            setError('An error occurred while generating the resume. Please try again.')
            console.error('Resume generation error:', err)
        } finally {
            setIsLoading(false)
            setProgress(0)
        }
    }

    const handleManualSubmit = async (data: any) => {
        // Sanitize the data to ensure it has the correct structure
        const sanitizedData = {
            name: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
            location: data?.location || "",
            linkedin: data?.linkedin || "",
            website: data?.website || "",
            summary: data?.summary || "",
            experience: Array.isArray(data?.experience) ? data.experience.filter((exp: any) => 
                exp.title && exp.company && exp.years && exp.description
            ) : [],
            skills: Array.isArray(data?.skills) ? data.skills.filter((skill: string) => skill.trim() !== "") : [],
            education: data?.education || "",
            projects: Array.isArray(data?.projects) ? data.projects.filter((proj: any) => 
                proj.name && proj.description
            ).map((proj: any) => ({
                ...proj,
                technologies: Array.isArray(proj.technologies) ? proj.technologies.filter((tech: string) => tech.trim() !== "") : []
            })) : [],
            certifications: Array.isArray(data?.certifications) ? data.certifications.filter((cert: string) => cert.trim() !== "") : []
        }

        setResume(sanitizedData)
        setResumeSource('manual')
        setActiveTab("preview")
        console.log('Manual Resume Created:', sanitizedData)
        
        // Auto-save the manual resume
        try {
            await fetch('/api/user/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    resume: sanitizedData, 
                    template: selectedTemplate 
                }),
            });
            console.log('Manual resume auto-saved to account');
        } catch (saveError) {
            console.error('Failed to auto-save manual resume:', saveError);
        }
    }

    const handleGitHubSuccess = async (resumeData: ResumeIngestPayload, metadata: any) => {
        console.log('GitHub Resume Generated:', resumeData, metadata);
        
        setResume(resumeData);
        setResumeSource('github');
        setIsGitHubModalOpen(false);
        setActiveTab("preview");
        
        // Auto-save the GitHub-generated resume
        try {
            await fetch('/api/user/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    resume: resumeData, 
                    template: selectedTemplate,
                    metadata: metadata
                }),
            });
            console.log('GitHub resume auto-saved to account');
        } catch (saveError) {
            console.error('Failed to auto-save GitHub resume:', saveError);
        }
    }


    
    const handleEditResume = () => {
        // Ensure the resume data is properly formatted for manual editing
        if (resume) {
            const sanitizedResumeData = {
                name: resume?.name ?? "",
                email: resume?.email ?? "",
                phone: resume?.phone ?? "",
                location: resume?.location ?? "",
                linkedin: resume?.linkedin ?? "",
                website: resume?.website ?? "",
                summary: resume?.summary ?? "",
                experience: Array.isArray(resume?.experience) ? resume.experience.map((exp: any) => ({
                    title: exp?.title ?? "",
                    company: exp?.company ?? "",
                    years: exp?.years ?? "",
                    description: exp?.description ?? "",
                    achievements: Array.isArray(exp?.achievements) ? exp.achievements.filter((ach: any) => ach) : [""]
                })) : [{
                    title: "",
                    company: "",
                    years: "",
                    description: "",
                    achievements: [""]
                }],
                skills: Array.isArray(resume?.skills) ? resume.skills.filter((skill: any) => skill) : [],
                education: resume?.education ?? "",
                projects: Array.isArray(resume?.projects) ? resume.projects.map((proj: any) => ({
                    name: proj?.name ?? "",
                    description: proj?.description ?? "",
                    technologies: Array.isArray(proj?.technologies) ? proj.technologies.filter((tech: any) => tech) : [""],
                    link: proj?.link ?? ""
                })) : [],
                certifications: Array.isArray(resume?.certifications) ? resume.certifications.filter((cert: any) => cert) : []
            }
            setResume(sanitizedResumeData)
        }
        setActiveTab("manual")
    }

    const handleDownloadPDF = async () => {
        if (!resume) {
            alert("No resume data available to download.");
            return;
        }

        try {
            // Find the resume template element in the preview
            const resumeElement = document.querySelector('[data-resume-template]') as HTMLElement;
            
            if (!resumeElement) {
                alert("Please switch to preview tab first to generate PDF.");
                return;
            }

            // Create a canvas from the resume template with better compatibility options
            const canvas = await html2canvas(resumeElement, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: resumeElement.scrollWidth,
                height: resumeElement.scrollHeight,
                ignoreElements: (element) => {
                    // Skip elements that might cause parsing issues
                    return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
                },
                onclone: (clonedDoc) => {
                    // Replace modern CSS color functions with fallback colors
                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        * {
                            color: inherit !important;
                            background-color: inherit !important;
                            border-color: inherit !important;
                        }
                        .bg-gradient-to-r { background: linear-gradient(to right, #3b82f6, #1e40af) !important; }
                        .text-white { color: #ffffff !important; }
                        .text-gray-600 { color: #4b5563 !important; }
                        .text-gray-800 { color: #1f2937 !important; }
                        .text-gray-900 { color: #111827 !important; }
                        .bg-white { background-color: #ffffff !important; }
                        .bg-gray-50 { background-color: #f9fafb !important; }
                        .bg-blue-600 { background-color: #2563eb !important; }
                        .border-gray-200 { border-color: #e5e7eb !important; }
                    `;
                    clonedDoc.head.appendChild(style);
                    return clonedDoc;
                }
            });

            // Calculate dimensions for A4 page
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Initialize jsPDF
            const pdf = new jsPDF({
                orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Convert canvas to image data
            const imgData = canvas.toDataURL('image/png');

            // If content is longer than one page, we might need to split it
            if (imgHeight <= pageHeight) {
                // Fits in one page
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            } else {
                // Multiple pages needed
                let yPosition = 0;
                const pageHeight = 297;
                
                while (yPosition < imgHeight) {
                    if (yPosition > 0) {
                        pdf.addPage();
                    }
                    
                    pdf.addImage(
                        imgData, 
                        'PNG', 
                        0, 
                        -yPosition, 
                        imgWidth, 
                        imgHeight
                    );
                    
                    yPosition += pageHeight;
                }
            }

            // Sanitize filename
            const safeName = (resume?.name || "resume")
                .toString()
                .trim()
                .replace(/[^\w\-]+/g, "_");

            // Save the PDF
            pdf.save(`${safeName}-${selectedTemplate}.pdf`);
            console.log("PDF generated successfully from template.");
            
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Fallback to simplified PDF generation without html2canvas
            try {
                console.log("Attempting fallback PDF generation...");
                await generateFallbackPDF();
            } catch (fallbackError) {
                console.error("Fallback PDF generation failed:", fallbackError);
                alert("PDF generation failed. Please try using your browser's print function (Ctrl+P) to save as PDF.");
            }
        }
    };

    const generateFallbackPDF = async () => {
        if (!resume) return;

        // Generate PDF using jsPDF without html2canvas
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Constants for layout
        const margin = 15;
        let yOffset = margin;
        const maxWidth = 180; // A4 width (210mm) - margins
        const pageHeight = 297;

        // Helper function to add text and handle page breaks
        const addText = (text: string, x: number, y: number, fontSize: number, weight: string = "normal") => {
            if (y > pageHeight - 20) {
                pdf.addPage();
                return margin;
            }
            pdf.setFontSize(fontSize);
            pdf.setFont("helvetica", weight);
            const lines = pdf.splitTextToSize(text, maxWidth);
            pdf.text(lines, x, y);
            return y + lines.length * (fontSize * 0.5);
        };

        // Header
        pdf.setFillColor(59, 130, 246); // Blue
        pdf.rect(0, 0, 210, 35, "F");
        pdf.setTextColor(255, 255, 255);
        yOffset = addText(resume.name || "Resume", margin, yOffset + 15, 20, "bold");
        
        // Contact Info
        pdf.setTextColor(0, 0, 0);
        yOffset = margin + 45;
        const contactInfo = [resume.email, resume.phone, resume.location].filter(Boolean).join(" | ");
        if (contactInfo) {
            yOffset = addText(contactInfo, margin, yOffset, 11);
        }

        yOffset += 10;

        // Summary
        if (resume.summary) {
            yOffset = addText("PROFESSIONAL SUMMARY", margin, yOffset, 14, "bold");
            yOffset += 5;
            yOffset = addText(resume.summary, margin, yOffset, 11);
            yOffset += 10;
        }

        // Experience
        if (resume.experience?.length > 0) {
            yOffset = addText("EXPERIENCE", margin, yOffset, 14, "bold");
            yOffset += 5;
            resume.experience.forEach((exp: any) => {
                yOffset = addText(`${exp.title} - ${exp.company}`, margin, yOffset, 12, "bold");
                if (exp.years) yOffset = addText(exp.years, margin, yOffset, 10);
                if (exp.description) yOffset = addText(exp.description, margin, yOffset, 10);
                yOffset += 8;
            });
        }

        // Skills
        if (resume.skills?.length > 0) {
            yOffset = addText("SKILLS", margin, yOffset, 14, "bold");
            yOffset += 5;
            yOffset = addText(resume.skills.join(", "), margin, yOffset, 11);
            yOffset += 10;
        }

        // Education
        if (resume.education) {
            yOffset = addText("EDUCATION", margin, yOffset, 14, "bold");
            yOffset += 5;
            yOffset = addText(resume.education, margin, yOffset, 11);
        }

        // Save
        const safeName = (resume?.name || "resume").replace(/[^\w\-]+/g, "_");
        pdf.save(`${safeName}-fallback.pdf`);
        console.log("Fallback PDF generated successfully.");
    };

    const renderResumeTemplate = () => {
        if (!resume) return null
        
        // Ensure resume data is properly structured before passing to templates
        const safeResumeData = {
            name: resume?.name || "Professional Name",
            email: resume?.email || "email@example.com", 
            phone: resume?.phone || "Phone Number",
            location: resume?.location || "",
            linkedin: resume?.linkedin || "",
            website: resume?.website || "",
            summary: resume?.summary || "Professional summary not available",
            experience: Array.isArray(resume?.experience) ? resume.experience : [],
            skills: Array.isArray(resume?.skills) ? resume.skills : [],
            education: resume?.education || "",
            projects: Array.isArray(resume?.projects) ? resume.projects : [],
            certifications: Array.isArray(resume?.certifications) ? resume.certifications : []
        }
        
        const TemplateComponent = () => {
            switch (selectedTemplate) {
                case "modern":
                    return <ModernTemplate data={safeResumeData} />
                case "classic":
                    return <ClassicTemplate data={safeResumeData} />
                case "creative":
                    return <CreativeTemplate data={safeResumeData} />
                case "professional":
                    return <ProfessionalTemplate data={safeResumeData} />
                default:
                    return <ModernTemplate data={safeResumeData} />
            }
        }

        return (
            <div data-resume-template>
                <TemplateComponent />
            </div>
        )
    }

    // save to account
    const saveResumeToAccount: () => Promise<void> = async () => {
        if (!resume) return;

        try {
            const response = await fetch('/api/user/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    resume, 
                    template: selectedTemplate 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save resume");
            }
            
            const data = await response.json();
            console.log("Resume saved to account:", data);
            
            // Show success message
            alert("Resume saved to your account successfully!");
            
        } catch (error) {
            console.error("Error saving resume:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            alert(`Failed to save resume: ${errorMessage}`);
        }
    }

    // Rest of the component remains unchanged
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
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">AI Resume Builder</h1>
                        <p className="text-gray-400">Create professional resumes with AI assistance</p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto mb-8">
                    <TabsTrigger value="create" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        AI Create
                    </TabsTrigger>
                    <TabsTrigger value="github" className="flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        GitHub
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Manual Entry
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="preview" disabled={!resume} className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Preview
                        {isLoading && (
                            <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700">
                                {progress}%
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-6">
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Tell us about yourself
                            </CardTitle>
                            <p className="text-gray-400">
                                Describe your professional background, skills, and career goals. Our AI will create a tailored resume for you.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Professional Background
                                </label>
                                <Textarea
                                    placeholder="Example: Software engineer with 5 years of experience in React, Node.js, and Python. Passionate about building scalable web applications and leading development teams. Looking for a senior developer role at a tech company focused on innovation..."
                                    className="w-full min-h-[200px] resize-none"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Include your experience, skills, achievements, and career objectives (minimum 50 characters)
                                </p>
                            </div>

                            <Collapsible open={showExamples} onOpenChange={setShowExamples}>
                                <CollapsibleTrigger className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    {showExamples ? 'Hide' : 'Show'} example prompts →
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3">
                                    <ExamplePrompts onSelectPrompt={(prompt) => {
                                        setDescription(prompt)
                                        setShowExamples(false)
                                    }} />
                                </CollapsibleContent>
                            </Collapsible>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                    Quick Template Preview
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {templates.map((template) => (
                                        <div
                                            key={template.value}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                selectedTemplate === template.value
                                                    ? 'border-blue-500 bg-blue-300/10'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`} onClick={() => setSelectedTemplate(template.value)}>
                                            <h4 className="font-medium text-sm">{template.label}</h4>
                                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                                            {selectedTemplate === template.value && (
                                                <Badge className="mt-2 text-xs bg-blue-500">Selected</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateResume}
                                disabled={isLoading || !description.trim() || description.length < 50}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                        Generating Your Resume...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 w-5 h-5" />
                                        Generate AI Resume
                                    </>
                                )}
                            </Button>

                            {isLoading && (
                                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-900">
                                            Creating your professional resume...
                                        </span>
                                        <span className="text-sm text-blue-700">
                                            {progress}%
                                        </span>
                                    </div>
                                    
                                    <Progress 
                                        value={progress} 
                                        className="w-full h-2"
                                    />
                                    
                                    <div className="text-xs text-blue-600">
                                        🤖 AI is analyzing your background and crafting the perfect resume...
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="github" className="space-y-6">
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Github className="w-5 h-5" />
                                Build Resume from GitHub
                            </CardTitle>
                            <p className="text-gray-400">
                                Generate a professional resume from your GitHub profile and repositories. 
                                We'll analyze your code, projects, and contributions to create a tailored resume.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center">
                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                                        <Github className="w-8 h-8 text-gray-600" />
                                        <div className="text-left">
                                            <h3 className="font-medium text-gray-900">Connect Your GitHub</h3>
                                            <p className="text-sm text-gray-600">
                                                We'll analyze your repositories, languages, and contributions
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <FileText className="w-4 h-4 text-white" />
                                        </div>
                                        <h4 className="font-medium text-blue-900 mb-1">Smart Analysis</h4>
                                        <p className="text-xs text-blue-700">
                                            Analyzes your repositories, languages, and contribution patterns
                                        </p>
                                    </div>
                                    
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Wand2 className="w-4 h-4 text-white" />
                                        </div>
                                        <h4 className="font-medium text-green-900 mb-1">Auto-Generated</h4>
                                        <p className="text-xs text-green-700">
                                            Creates professional summaries and project descriptions
                                        </p>
                                    </div>
                                    
                                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <h4 className="font-medium text-purple-900 mb-1">Fully Editable</h4>
                                        <p className="text-xs text-purple-700">
                                            Review and customize everything before finalizing
                                        </p>
                                    </div>
                                </div>

                                <GitHubResumeButton
                                    onClick={() => setIsGitHubModalOpen(true)}
                                    className="w-full max-w-md mx-auto h-12 text-lg bg-gray-900 hover:bg-gray-800 text-white"
                                >
                                    <Github className="w-5 h-5 mr-2" />
                                    Connect GitHub Profile
                                </GitHubResumeButton>

                                <p className="text-xs text-gray-500 mt-4">
                                    Your GitHub profile must be public for analysis. We don't store any tokens or personal data.
                                </p>
                            </div>

                            <div className="border-t pt-6">
                                <h4 className="font-medium text-gray-900 mb-3">What we'll analyze:</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Repository activity and stars
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Programming languages used
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Project descriptions and topics
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Contribution patterns
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Open source contributions
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Technical skill categorization
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manual" className="space-y-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Manual Resume Entry</h2>
                        <p className="text-gray-400">
                            {resumeSource === 'ai' ? 
                                'Edit your AI-generated resume or fill in your details manually' : 
                                resumeSource === 'github' ?
                                'Edit your GitHub-generated resume or fill in your details manually' :
                                'Fill in your details manually to create a professional resume'
                            }
                        </p>
                        {resumeSource === 'ai' && (
                            <div className="mt-3 p-3 bg-blue-900/50 border border-blue-700 rounded-lg">
                                <p className="text-blue-200 text-sm">
                                    ✨ Your AI-generated resume has been loaded below. You can edit any field and regenerate the preview.
                                </p>
                            </div>
                        )}
                        {resumeSource === 'github' && (
                            <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                                <p className="text-gray-200 text-sm">
                                    <Github className="w-4 h-4 inline mr-1" />
                                    Your GitHub-generated resume has been loaded below. You can edit any field and regenerate the preview.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className=" rounded-lg shadow-lg p-6">
                        <ManualResumeForm 
                            onSubmit={handleManualSubmit}
                            onCancel={() => setActiveTab("create")}
                            initialData={resume}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Resume Template</h2>
                        <p className="text-gray-600">Select a design that best represents your professional style</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {templates.map((template) => (
                            <TemplatePreview
                                key={template.value}
                                template={template.value}
                                isSelected={selectedTemplate === template.value}
                                onClick={() => setSelectedTemplate(template.value)}
                            />
                        ))}
                    </div>

                    <div className="flex justify-center mt-8">
                        <Button
                            onClick={() => setActiveTab("create")}
                            variant="outline"
                            className="mr-4"
                        >
                            Back to Create
                        </Button>
                        <Button
                            onClick={() => setActiveTab("preview")}
                            disabled={!resume}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            View Preview
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                    {resume ? (
                        <>
                            <div className="flex justify-between items-center max-w-4xl mx-auto">
                                <div>
                                    <h2 className="text-2xl font-bold text-white/120">Your Resume </h2>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <span>Template: {templates.find(t => t.value === selectedTemplate)?.label}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {resumeSource === 'ai' ? (
                                        <Button
                                            onClick={handleEditResume}
                                            variant="outline"
                                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Edit Resume
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setActiveTab("create")}
                                            variant="outline"
                                        >
                                            Generate New
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => setActiveTab("templates")}
                                        variant="outline"
                                    >
                                        Change Template
                                    </Button>
                                    <Button
                                        onClick={handleDownloadPDF}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                     <Button
                                        onClick={saveResumeToAccount}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Save to Account
                                    </Button>
                                </div>
                            </div>

                            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden" data-resume-preview>
                                {renderResumeTemplate()}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Resume Generated Yet</h3>
                            <p className="text-gray-600 mb-4">Create your resume first to see the preview</p>
                            <Button onClick={() => setActiveTab("create")} className="bg-blue-600 hover:bg-blue-700">
                                Start Creating
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* GitHub Resume Modal */}
            <GitHubResumeModal
                isOpen={isGitHubModalOpen}
                onClose={() => setIsGitHubModalOpen(false)}
                onSuccess={handleGitHubSuccess}
            />
        </div>
    )
}