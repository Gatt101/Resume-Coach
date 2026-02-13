"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, FileText, Wand2, Loader2, CheckCircle, Github, LayoutTemplate, Sparkles, FileDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplatePreview } from "@/components/resume-templates/TemplatePreview"
import { ModernTemplate } from "@/components/resume-templates/ModernTemplate"
import { ClassicTemplate } from "@/components/resume-templates/ClassicTemplate"
import { CreativeTemplate } from "@/components/resume-templates/CreativeTemplate"
import { ProfessionalTemplate } from "@/components/resume-templates/ProfessionalTemplate"
import { MinimalTemplate } from "@/components/resume-templates/MinimalTemplate"
import { ExecutiveTemplate } from "@/components/resume-templates/ExecutiveTemplate"
import { ModernProfessionalTemplate } from "@/components/resume-templates/ModernProfessionalTemplate"
import { ExamplePrompts } from "@/components/resume-templates/ExamplePrompts"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import ManualResumeForm from "@/components/ManualResumeForm"
import { Progress } from "@/components/ui/progress"
import GitHubResumeModal from "@/components/GitHubResumeModal"
import GitHubResumeButton from "@/components/GitHubResumeButton"

import { ResumeIngestPayload } from "@/lib/services/github-resume-processor"
import jsPDF from "jspdf"
import { toCanvas } from "html-to-image"

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
    const descriptionLength = description.trim().length
    const canGenerate = descriptionLength >= 50

    const templates = [
        { value: "modern", label: "Modern", description: "Clean, contemporary design with gradient header" },
        { value: "classic", label: "Classic", description: "Traditional, formal layout with serif typography" },
        { value: "creative", label: "Creative", description: "Colorful, innovative design with sidebar layout" },
        { value: "professional", label: "Professional", description: "Corporate-style layout with blue accents" },
        { value: "minimal", label: "Minimal", description: "Simple, elegant layout with strong readability" },
        { value: "executive", label: "Executive", description: "Leadership-focused format with premium structure" },
        { value: "ats", label: "ATS Friendly", description: "Keyword-focused, recruiter and parser friendly" },
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

            // Wait for fonts to avoid layout shifts in exported PDF
            if (typeof document !== 'undefined' && 'fonts' in document) {
                try {
                    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
                } catch {
                    // Continue even if font readiness check fails
                }
            }

            // Initialize compact, paginated A4 PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const contentWidth = pageWidth - margin * 2;
            const contentHeight = pageHeight - margin * 2;

            const captureHost = document.createElement('div');
            captureHost.style.position = 'fixed';
            captureHost.style.left = '-100000px';
            captureHost.style.top = '0';
            captureHost.style.width = `${Math.max(1, Math.floor(resumeElement.scrollWidth))}px`;
            captureHost.style.background = '#ffffff';
            captureHost.style.pointerEvents = 'none';
            captureHost.style.zIndex = '-1';

            const clonedResume = resumeElement.cloneNode(true) as HTMLElement;
            clonedResume.style.margin = '0';
            clonedResume.style.transform = 'none';
            clonedResume.style.background = '#ffffff';
            captureHost.appendChild(clonedResume);
            document.body.appendChild(captureHost);

            let fullCanvas: HTMLCanvasElement;
            try {
                fullCanvas = await toCanvas(captureHost, {
                    cacheBust: true,
                    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.7),
                    backgroundColor: '#ffffff',
                });
            } finally {
                document.body.removeChild(captureHost);
            }

            const pxPerMm = fullCanvas.width / contentWidth;
            const pageSliceHeightPx = Math.max(1, Math.floor(contentHeight * pxPerMm));
            let offsetY = 0;
            let pageIndex = 0;

            while (offsetY < fullCanvas.height) {
                const remainingPx = fullCanvas.height - offsetY;
                const sliceHeightPx = Math.min(pageSliceHeightPx, remainingPx);

                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = fullCanvas.width;
                pageCanvas.height = sliceHeightPx;
                const ctx = pageCanvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Failed to initialize PDF page canvas');
                }

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                ctx.drawImage(fullCanvas, 0, offsetY, fullCanvas.width, sliceHeightPx, 0, 0, pageCanvas.width, pageCanvas.height);

                const imgData = pageCanvas.toDataURL('image/jpeg', 0.82);
                const renderedHeightMm = sliceHeightPx / pxPerMm;

                if (pageIndex > 0) {
                    pdf.addPage();
                }

                pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, renderedHeightMm, undefined, 'FAST');
                offsetY += sliceHeightPx;
                pageIndex += 1;
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
                case "minimal":
                    return <MinimalTemplate data={safeResumeData} />
                case "executive":
                    return <ExecutiveTemplate data={safeResumeData} />
                case "ats":
                    return <ModernProfessionalTemplate data={safeResumeData} />
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
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 p-4 text-slate-100 sm:p-6">
            <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-blue-700/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 top-40 h-72 w-72 rounded-full bg-cyan-600/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.08),transparent_40%)]" />
            <div className="mx-auto w-full max-w-7xl">
            <section className="mb-6 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 shadow-2xl backdrop-blur">
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push('/dashboard')}
                            className="h-11 w-11 border-slate-700 bg-slate-950 text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                            aria-label="Back to dashboard"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2 shadow-lg shadow-blue-700/30">
                                <Wand2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">AI Resume Builder</h1>
                                <p className="text-sm text-slate-300 sm:text-base">Create polished, ATS-ready resumes with AI assistance</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="border-blue-400/40 bg-blue-500/10 text-blue-200">{templates.length} templates</Badge>
                                    <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-200">Auto-save enabled</Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden rounded-xl border border-slate-700 bg-slate-950/70 p-3 lg:block">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Current Template</p>
                        <p className="mt-1 text-base font-semibold text-white">{templates.find((t) => t.value === selectedTemplate)?.label || "Modern"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-slate-700/70 bg-slate-950/40 p-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400"><LayoutTemplate className="h-3.5 w-3.5" /> Selected Template</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">{templates.find((t) => t.value === selectedTemplate)?.label || "Modern"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400"><Sparkles className="h-3.5 w-3.5" /> Generation Mode</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">AI + Manual + GitHub</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400"><FileDown className="h-3.5 w-3.5" /> Export</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">Preview + Compressed PDF</p>
                    </div>
                </div>
            </section>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mx-auto mb-6 w-full max-w-fit sm:mb-8">
                    <TabsList className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700/90 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                        <TabsTrigger 
                            value="create" 
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-transparent px-5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-100 data-[state=active]:border-blue-400/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 data-[state=active]:text-white"
                        >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">AI Create</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="github" 
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-transparent px-5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-100 data-[state=active]:border-blue-400/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 data-[state=active]:text-white"
                        >
                            <Github className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">GitHub</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="manual" 
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-transparent px-5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-100 data-[state=active]:border-blue-400/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 data-[state=active]:text-white"
                        >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Manual Entry</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="templates" 
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-transparent px-5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-100 data-[state=active]:border-blue-400/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 data-[state=active]:text-white"
                        >
                            <Wand2 className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Templates</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="preview" 
                            disabled={!resume} 
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-transparent px-5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-100 data-[state=active]:border-blue-400/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 data-[state=active]:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent"
                        >
                            <Download className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Preview</span>
                            {isLoading && (
                                <Badge variant="secondary" className="ml-1 bg-blue-100 text-xs text-blue-700">
                                    {progress}%
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="create" className="space-y-6">
                    <Card className="mx-auto w-full max-w-5xl border-slate-700/80 bg-slate-900/70 shadow-xl backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-100">
                                <FileText className="w-5 h-5" />
                                Tell us about yourself
                            </CardTitle>
                            <p className="text-slate-300">
                                Describe your professional background, skills, and career goals. Our AI will create a tailored resume for you.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label className="block text-sm font-medium text-slate-200">
                                        Professional Background
                                    </label>
                                    <Badge variant="outline" className={`text-xs ${canGenerate ? 'border-emerald-400/50 text-emerald-300' : 'border-slate-600 text-slate-400'}`}>
                                        {descriptionLength}/50 min
                                    </Badge>
                                </div>
                                <Textarea
                                    placeholder="Example: Software engineer with 5 years of experience in React, Node.js, and Python. Passionate about building scalable web applications and leading development teams. Looking for a senior developer role at a tech company focused on innovation..."
                                    className="min-h-[140px] w-full resize-none border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 sm:min-h-[200px]"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <p className="mt-1 text-xs text-slate-400">
                                    Include your experience, skills, achievements, and career objectives (minimum 50 characters).
                                </p>
                            </div>

                            <Collapsible open={showExamples} onOpenChange={setShowExamples}>
                                <CollapsibleTrigger className="text-sm font-medium text-blue-300 transition-colors hover:text-blue-200">
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
                                <label className="mb-3 block text-sm font-medium text-slate-200">
                                    Quick Template Preview
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {templates.map((template) => (
                                        <div
                                            key={template.value}
                                            className={`cursor-pointer rounded-lg border p-3 transition-all ${
                                                selectedTemplate === template.value
                                                    ? 'border-blue-500 bg-blue-500/15 shadow-md shadow-blue-600/10'
                                                    : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                                            }`} onClick={() => setSelectedTemplate(template.value)}>
                                            <h4 className="text-sm font-medium text-slate-100">{template.label}</h4>
                                            <p className="mt-1 text-xs text-slate-400">{template.description}</p>
                                            {selectedTemplate === template.value && (
                                                <Badge className="mt-2 bg-blue-600 text-xs">Selected</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateResume}
                                disabled={isLoading || !description.trim() || !canGenerate}
                                className="h-12 w-full bg-blue-600 text-base text-white hover:bg-blue-500 disabled:opacity-50 sm:text-lg"
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
                                <div className="space-y-4 rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-200">
                                            Creating your professional resume...
                                        </span>
                                        <span className="text-sm text-blue-300">
                                            {progress}%
                                        </span>
                                    </div>
                                    
                                    <Progress 
                                        value={progress} 
                                        className="w-full h-2"
                                    />
                                    
                                    <div className="text-xs text-blue-300">
                                        AI is analyzing your background and crafting your resume.
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="github" className="space-y-6">
                    <Card className="mx-auto max-w-5xl border-slate-700/80 bg-slate-900/70 shadow-xl backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-100">
                                <Github className="w-5 h-5" />
                                Build Resume from GitHub
                            </CardTitle>
                            <p className="text-slate-300">
                                Generate a professional resume from your GitHub profile and repositories. 
                                We will analyze your code, projects, and contributions to create a tailored resume.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center">
                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4">
                                        <Github className="w-8 h-8 text-slate-300" />
                                        <div className="text-left">
                                            <h3 className="font-medium text-slate-100">Connect Your GitHub</h3>
                                            <p className="text-sm text-slate-400">
                                                We will analyze your repositories, languages, and contributions
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <FileText className="w-4 h-4 text-white" />
                                        </div>
                                        <h4 className="mb-1 font-medium text-slate-100">Smart Analysis</h4>
                                        <p className="text-xs text-slate-400">
                                            Analyzes your repositories, languages, and contribution patterns
                                        </p>
                                    </div>
                                    
                                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Wand2 className="w-4 h-4 text-white" />
                                        </div>
                                        <h4 className="mb-1 font-medium text-slate-100">Auto-Generated</h4>
                                        <p className="text-xs text-slate-400">
                                            Creates professional summaries and project descriptions
                                        </p>
                                    </div>
                                    
                                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <h4 className="mb-1 font-medium text-slate-100">Fully Editable</h4>
                                        <p className="text-xs text-slate-400">
                                            Review and customize everything before finalizing
                                        </p>
                                    </div>
                                </div>

                                <GitHubResumeButton
                                    onClick={() => setIsGitHubModalOpen(true)}
                                    className="w-full max-w-md mx-auto h-12 text-base sm:text-lg bg-gray-900 hover:bg-gray-800 text-white"
                                >
                                    <Github className="w-5 h-5 mr-2" />
                                    Connect GitHub Profile
                                </GitHubResumeButton>

                                <p className="mt-4 text-xs text-slate-400">
                                    Your GitHub profile must be public for analysis. We do not store any tokens or personal data.
                                </p>
                            </div>

                            <div className="border-t border-slate-700 pt-6">
                                <h4 className="mb-3 font-medium text-slate-100">What we will analyze:</h4>
                                <div className="grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-2">
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
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="mb-2 text-2xl font-bold text-slate-100">Manual Resume Entry</h2>
                        <p className="text-slate-300">
                            {resumeSource === 'ai' ? 
                                'Edit your AI-generated resume or fill in your details manually' : 
                                resumeSource === 'github' ?
                                'Edit your GitHub-generated resume or fill in your details manually' :
                                'Fill in your details manually to create a professional resume'
                            }
                        </p>
                        {resumeSource === 'ai' && (
                            <div className="mt-3 rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
                                <p className="text-sm text-blue-200">
                                    Your AI-generated resume has been loaded below. You can edit any field and regenerate the preview.
                                </p>
                            </div>
                        )}
                        {resumeSource === 'github' && (
                            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                                <p className="text-sm text-slate-200">
                                    <Github className="w-4 h-4 inline mr-1" />
                                    Your GitHub-generated resume has been loaded below. You can edit any field and regenerate the preview.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 shadow-lg sm:p-6">
                        <ManualResumeForm 
                            onSubmit={handleManualSubmit}
                            onCancel={() => setActiveTab("create")}
                            initialData={resume}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                    <div className="text-center mb-8">
                        <h2 className="mb-2 text-2xl font-bold text-slate-100">Choose Your Resume Template</h2>
                        <p className="text-slate-300">Select a design that best represents your professional style</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-2 sm:px-0">
                        {templates.map((template) => (
                            <TemplatePreview
                                key={template.value}
                                template={template.value}
                                isSelected={selectedTemplate === template.value}
                                onClick={() => setSelectedTemplate(template.value)}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center mt-6 sm:mt-8 gap-3">
                        <Button
                            onClick={() => setActiveTab("create")}
                            variant="outline"
                            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                        >
                            Back to Create
                        </Button>
                        <Button
                            onClick={() => setActiveTab("preview")}
                            disabled={!resume}
                            className="bg-blue-600 hover:bg-blue-500"
                        >
                            View Preview
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                    {resume ? (
                        <>
                            <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-100 sm:text-2xl">Your Resume</h2>
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <span>Template: {templates.find(t => t.value === selectedTemplate)?.label}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {resumeSource === 'ai' ? (
                                        <Button
                                            onClick={handleEditResume}
                                            variant="outline"
                                            className="border-blue-500/50 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Edit Resume
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setActiveTab("create")}
                                            variant="outline"
                                            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                                        >
                                            Generate New
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => setActiveTab("templates")}
                                        variant="outline"
                                        className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                                    >
                                        Change Template
                                    </Button>
                                    <Button
                                        onClick={handleDownloadPDF}
                                        className="bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                     <Button
                                        onClick={saveResumeToAccount}
                                        className="bg-blue-600 hover:bg-blue-500"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Save to Account
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full px-2 sm:px-0">
                                <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-slate-700 bg-white shadow-2xl" data-resume-preview>
                                    {renderResumeTemplate()}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="mx-auto max-w-xl rounded-xl border border-slate-700 bg-slate-900/70 py-12 text-center">
                            <FileText className="mx-auto mb-4 h-16 w-16 text-slate-500" />
                            <h3 className="mb-2 text-lg font-medium text-slate-100">No Resume Generated Yet</h3>
                            <p className="mb-4 text-slate-300">Create your resume first to see the preview</p>
                            <Button onClick={() => setActiveTab("create")} className="bg-blue-600 hover:bg-blue-500">
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
        </div>
    )
}
