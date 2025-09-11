"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Wand2, Download, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { ModernTemplate } from "@/components/resume-templates/ModernTemplate";
import { ClassicTemplate } from "@/components/resume-templates/ClassicTemplate";
import { CreativeTemplate } from "@/components/resume-templates/CreativeTemplate";
import { ProfessionalTemplate } from "@/components/resume-templates/ProfessionalTemplate";
import { useRouter } from "next/navigation";

interface Resume {
  _id: string;
  title: string;
  template: string;
  data: any; 
  createdAt: string;
  updatedAt: string;
}

export default function TailorPage() 
{
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [tailoredResume, setTailoredResume] = useState<any | null>(null); // Replace with specific type
  const [isLoading, setIsLoading] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("select");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tempLocalResume, setTempLocalResume] = useState<any | null>(null);
  const [tempLocalFile, setTempLocalFile] = useState<File | null>(null);
<<<<<<< HEAD
=======
  const [uploadedResumeOptions, setUploadedResumeOptions] = useState<any[]>([]);
>>>>>>> my-feature-branch

  // Handle file selection from input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(selectedFile.type)) {
        setError("Please upload a PDF, DOC, or DOCX file.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(selectedFile);
      // store temporarily in browser immediately so user can preview without saving
      saveTempResumeToBrowser(selectedFile);
      uploadResume(selectedFile);
    }
  };

  // Handle drag and drop events
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(droppedFile.type)) {
        setError("Please upload a PDF, DOC, or DOCX file.");
        return;
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(droppedFile);
      // store temporarily in browser immediately so user can preview without saving
      saveTempResumeToBrowser(droppedFile);
      uploadResume(droppedFile);
    }
  };

  // Trigger file input click when button is clicked
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Upload resume to server
  const uploadResume = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("title", file.name); // Use file name as title
      formData.append("template", "modern"); // Default template

      const response = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Try to parse JSON error, otherwise fall back to text
        let errText = `Upload failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          errText = errJson.error || JSON.stringify(errJson);
        } catch (e) {
          try { errText = await response.text(); } catch (_) {}
        }
        throw new Error(errText);
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        // Server returned non-JSON (HTML) despite ok status - surface a friendly message
        const text = await response.text().catch(() => null);
        throw new Error(text ? `Upload succeeded but response parsing failed: ${text.substring(0, 200)}` : 'Upload succeeded but response was not JSON');
      }

      setSuccess("Resume uploaded successfully!");
<<<<<<< HEAD
=======
      
      // Create multiple template options from the uploaded resume
      const extractedData = data.resume.data;
      
      // Get the original file data from tempLocalResume
      const originalFileData = tempLocalResume?.data?.file;
      
      console.log('Creating template options with OCR data:', {
        hasTempLocalResume: !!tempLocalResume,
        hasFileData: !!originalFileData,
        fileName: originalFileData?.name,
        fileType: originalFileData?.type,
        hasBase64: !!originalFileData?.base64,
        extractedDataKeys: Object.keys(extractedData || {}),
        extractedDataSample: {
          name: extractedData?.name,
          email: extractedData?.email,
          summary: extractedData?.summary?.substring(0, 100) + '...',
          skillsCount: extractedData?.skills?.length || 0,
          experienceCount: extractedData?.experience?.length || 0
        }
      });
      
      const uploadedOptions = [
        {
          ...data.resume,
          _id: `original-${data.resume._id}`,
          title: `${data.resume.title} (Original)`,
          template: 'original',
          isOriginal: true,
          originalFile: originalFileData,
          data: {
            ...extractedData,
            originalFile: originalFileData // Store original file in data as well
          }
        },
        {
          ...data.resume,
          _id: `modern-${data.resume._id}`,
          title: `${data.resume.title} (Modern Template)`,
          template: 'modern',
          data: extractedData // This should contain the OCR extracted data
        },
        {
          ...data.resume,
          _id: `professional-${data.resume._id}`,
          title: `${data.resume.title} (Professional Template)`,
          template: 'professional',
          data: extractedData // This should contain the OCR extracted data
        },
        {
          ...data.resume,
          _id: `creative-${data.resume._id}`,
          title: `${data.resume.title} (Creative Template)`,
          template: 'creative',
          data: extractedData // This should contain the OCR extracted data
        }
      ];
      
      setUploadedResumeOptions(uploadedOptions);
      
>>>>>>> my-feature-branch
      // Prevent duplicates: only add server resume once
      setResumes((prev) => {
        if (prev.some(r => String(r._id) === String(data.resume._id))) return prev;
        return [...prev, data.resume];
      });
      // If we had a temp local resume for this file, mark it as uploaded and store server data
      try {
        if (tempLocalResume && tempLocalFile && tempLocalFile.name === file.name && tempLocalFile.size === file.size) {
          const updated = { ...tempLocalResume };
          updated.metadata = { ...(updated.metadata || {}), uploaded: true, serverId: data.resume._id };
          updated.serverData = data.resume;
          localStorage.setItem('ai_resume_temp', JSON.stringify(updated));
          setTempLocalResume(updated);
        }
      } catch (e) {
        // ignore localStorage errors
      }
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      setError(error instanceof Error ? error.message : "Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch resumes on mount
  useEffect(() => {
    fetchResumes();
    // load any locally saved temp resume
    const temp = loadTempFromBrowser();
    if (temp) {
      setTempLocalResume(temp);
    }
  }, []);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/resume");
      if (!response.ok) {
        throw new Error("Failed to fetch resumes");
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
<<<<<<< HEAD
    setSelectedResume(resume);
    setTailoredResume(null);
    setActiveTab("tailor");
    setError(null);
    setSuccess(null);
  };

  const handleTailorResume = async () => {
=======
    try {
      // Validate resume object
      if (!resume || !resume._id) {
        setError("Invalid resume selected. Please try again.");
        return;
      }

      setSelectedResume(resume);
      setTailoredResume(null);
      setActiveTab("tailor");
      setError(null);
      setSuccess(`Selected resume: ${resume.title}`);
    } catch (error) {
      console.error("Error selecting resume:", error);
      setError("Failed to select resume. Please try again.");
    }
  };

  const handleTailorResume = async () => {
    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validation checks
    if (!jobDescription.trim()) {
      setError("Please provide a job description.");
      return;
    }
<<<<<<< HEAD
=======
    
>>>>>>> my-feature-branch
    if (!selectedResume) {
      setError("Please select a resume to tailor.");
      return;
    }

<<<<<<< HEAD
=======
    // Check if resume has valid ID
    if (!actualResumeId || actualResumeId === '') {
      setError("Selected resume is invalid. Please try selecting a different resume.");
      return;
    }

    // Prevent tailoring if resume is only stored locally
    if ((selectedResume as any)?.metadata?.method === 'local' || String(actualResumeId).startsWith('local-')) {
      setError('This resume is stored locally in your browser. Please click "Save to Account" first to upload it before tailoring.');
      return;
    }

    setIsTailoring(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Tailoring resume with ID:', actualResumeId);
      
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId: actualResumeId,
          jobDescription,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to tailor resume";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTailoredResume(data.resume);
      setActiveTab("result");
      setSuccess("Resume successfully tailored for the job!");
    } catch (error) {
      console.error("Error tailoring resume:", error);
      setError(error instanceof Error ? error.message : "Failed to tailor resume. Please try again.");
    } finally {
      setIsTailoring(false);
    }
  };

  const renderResumeTemplate = (resumeData: any, template: string, originalFile?: any) => {
    if (!resumeData) return null;
    
    // Debug logging to see what data is being passed
    console.log('Rendering template:', template, 'with data:', {
      hasResumeData: !!resumeData,
      dataKeys: Object.keys(resumeData || {}),
      name: resumeData?.name,
      email: resumeData?.email,
      summaryLength: resumeData?.summary?.length || 0,
      skillsCount: resumeData?.skills?.length || 0,
      experienceCount: resumeData?.experience?.length || 0
    });
    
    // Handle original document display
    if (template === 'original') {
      // Try to get original file from multiple sources
      const fileData = originalFile || resumeData?.originalFile || resumeData?.file;
      
      if (fileData && fileData.base64) {
        const base64 = fileData.base64;
        const type = fileData.type || 'application/octet-stream';
        
        if (type.includes('pdf')) {
          return (
            <div className="w-full h-[400px] bg-white rounded">
              <embed src={base64} type={type} width="100%" height="100%" className="rounded" />
            </div>
          );
        }
        
        return (
          <div className="p-4 bg-white rounded">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="font-semibold mb-1 text-sm">Original Document</p>
              <p className="text-xs text-gray-600 mb-2">{fileData.name}</p>
              <p className="text-xs text-gray-500">({Math.round((fileData.size || 0) / 1024)} KB)</p>
            </div>
          </div>
        );
      }
      
      // Fallback if no original file data
      return (
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="font-semibold mb-1 text-sm">Original Document</p>
            <p className="text-xs text-gray-500">File preview not available</p>
          </div>
        </div>
      );
    }
    
>>>>>>> my-feature-branch
    // If this is a temporarily stored file (base64 PDF), show an embed preview
    if (resumeData?.file && resumeData.file.base64) {
      const base64 = resumeData.file.base64;
      const type = resumeData.file.type || 'application/octet-stream';
      // If PDF, embed
      if (type.includes('pdf')) {
        return (
          <div className="w-full h-[700px] bg-white">
            <embed src={base64} type={type} width="100%" height="100%" />
          </div>
        );
      }
      // For DOC/DOCX, provide a download link and basic metadata
      return (
        <div className="p-6 bg-white">
          <p className="font-semibold mb-2">Preview not available for this file type</p>
          <p className="text-sm text-gray-600 mb-4">{resumeData.file.name} ({Math.round((resumeData.file.size || 0) / 1024)} KB)</p>
          <a href={base64} download={resumeData.file.name} className="text-purple-600 underline">Download file</a>
        </div>
      );
    }

    switch (template) {
      case "modern":
        return <ModernTemplate data={resumeData} />;
      case "classic":
        return <ClassicTemplate data={resumeData} />;
      case "creative":
        return <CreativeTemplate data={resumeData} />;
      case "professional":
        return <ProfessionalTemplate data={resumeData} />;
      default:
        return <ModernTemplate data={resumeData} />;
    }
  };

  // --- Browser temporary storage helpers ---
  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async function saveTempResumeToBrowser(file: File) {
    try {
      const base64 = await readFileAsBase64(file);
      const temp = {
        _id: `local-${Date.now()}`,
        title: file.name,
        template: 'modern',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            base64
          }
        },
        metadata: { method: 'local' }
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_resume_temp', JSON.stringify(temp));
      }
      setTempLocalResume(temp);
      setTempLocalFile(file);
<<<<<<< HEAD
=======
      
      console.log('Saved temp resume with file data:', {
        name: file.name,
        type: file.type,
        size: file.size,
        hasBase64: !!base64
      });
      
>>>>>>> my-feature-branch
      setSuccess('Saved resume locally for temporary use');
      setError(null);
    } catch (err) {
      console.error('Failed to save temp resume to browser', err);
      setError('Failed to save resume locally');
    }
  }

  function loadTempFromBrowser() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('ai_resume_temp');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      setTempLocalResume(parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to load temp resume from browser', err);
      return null;
    }
  }

  function removeTempFromBrowser() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('ai_resume_temp');
    setTempLocalResume(null);
    setTempLocalFile(null);
    setSuccess(null);
  }

  // Template-specific download function that uses actual template styling
  const downloadSpecificResume = async (resumeData: any, template: string, resumeId: string) => {
    try {
      setSuccess(`Downloading ${resumeData.title || 'resume'} with ${template} template...`);
      
      // Get the actual resume data - handle both direct data and nested data structure
      const actualData = resumeData.data || resumeData;
      
      console.log('Download data for', template, ':', {
        resumeId,
        hasData: !!actualData,
        dataKeys: Object.keys(actualData || {}),
        name: actualData?.name,
        template: template
      });

      // Create template-specific HTML based on the template type
      const createTemplateHTML = (data: any, templateType: string) => {
        // Base styles for all templates
        const baseStyles = `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
          }
          @media print {
            body { padding: 20px; margin: 0; }
            .no-print { display: none !important; }
          }
          @page {
            size: A4;
            margin: 0.75in;
          }
          h1, h2, h3 { page-break-after: avoid; }
          .section { page-break-inside: avoid; margin-bottom: 25px; }
        `;

        // Template-specific styling
        let templateStyles = '';
        let headerClass = '';
        let sectionClass = '';

        switch (templateType) {
          case 'modern':
            templateStyles = `
              .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3498db; }
              .name { font-size: 32px; font-weight: 300; color: #2c3e50; margin-bottom: 10px; }
              .contact { font-size: 14px; color: #7f8c8d; }
              .section-title { font-size: 20px; color: #3498db; margin-bottom: 15px; font-weight: 600; }
              .experience-item { margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #ecf0f1; }
              .job-title { font-size: 18px; font-weight: 600; color: #2c3e50; }
              .company { color: #3498db; font-weight: 500; margin-bottom: 8px; }
              .skills-container { display: flex; flex-wrap: wrap; gap: 10px; }
              .skill { background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; }
            `;
            break;
          case 'professional':
            templateStyles = `
              .header { text-align: left; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #2c3e50; }
              .name { font-size: 28px; font-weight: 700; color: #2c3e50; margin-bottom: 8px; }
              .contact { font-size: 14px; color: #666; }
              .section-title { font-size: 18px; color: #2c3e50; margin-bottom: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
              .experience-item { margin-bottom: 18px; }
              .job-title { font-size: 16px; font-weight: 600; color: #2c3e50; }
              .company { color: #666; font-weight: 500; margin-bottom: 6px; }
              .skills-container { display: flex; flex-wrap: wrap; gap: 8px; }
              .skill { background: #f8f9fa; border: 1px solid #dee2e6; padding: 6px 12px; border-radius: 4px; font-size: 13px; color: #495057; }
            `;
            break;
          case 'creative':
            templateStyles = `
              .header { text-align: center; margin-bottom: 35px; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; }
              .name { font-size: 30px; font-weight: 400; margin-bottom: 10px; }
              .contact { font-size: 14px; opacity: 0.9; }
              .section-title { font-size: 22px; color: #667eea; margin-bottom: 15px; font-weight: 500; position: relative; }
              .section-title:after { content: ''; position: absolute; bottom: -5px; left: 0; width: 50px; height: 3px; background: linear-gradient(135deg, #667eea, #764ba2); }
              .experience-item { margin-bottom: 22px; padding: 15px; background: #f8f9ff; border-radius: 8px; }
              .job-title { font-size: 18px; font-weight: 600; color: #4c63d2; }
              .company { color: #667eea; font-weight: 500; margin-bottom: 10px; }
              .skills-container { display: flex; flex-wrap: wrap; gap: 12px; }
              .skill { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 18px; border-radius: 25px; font-size: 14px; font-weight: 500; }
            `;
            break;
          case 'classic':
          default:
            templateStyles = `
              .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #333; }
              .name { font-size: 26px; font-weight: 600; color: #333; margin-bottom: 8px; }
              .contact { font-size: 14px; color: #666; }
              .section-title { font-size: 16px; color: #333; margin-bottom: 10px; font-weight: 600; text-decoration: underline; }
              .experience-item { margin-bottom: 15px; }
              .job-title { font-size: 15px; font-weight: 600; color: #333; }
              .company { color: #666; margin-bottom: 5px; }
              .skills-container { display: flex; flex-wrap: wrap; gap: 6px; }
              .skill { background: #f5f5f5; padding: 4px 8px; border-radius: 3px; font-size: 12px; color: #333; }
            `;
        }

        return `
          <div style="max-width: 800px; margin: 0 auto;">
            <style>
              ${baseStyles}
              ${templateStyles}
            </style>
            
            <!-- Header -->
            <div class="header">
              <div class="name">${data.name || 'Professional Name'}</div>
              <div class="contact">
                ${data.email || ''} ${data.phone ? '• ' + data.phone : ''} ${data.location ? '• ' + data.location : ''}
                ${data.linkedin ? '<br>' + data.linkedin : ''}
              </div>
            </div>

            <!-- Professional Summary -->
            ${data.summary ? `
            <div class="section">
              <div class="section-title">Professional Summary</div>
              <p style="text-align: justify; line-height: 1.7;">${data.summary}</p>
            </div>
            ` : ''}

            <!-- Experience -->
            ${data.experience && data.experience.length > 0 ? `
            <div class="section">
              <div class="section-title">Professional Experience</div>
              ${data.experience.map((exp: any) => `
                <div class="experience-item">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
                    <div class="job-title">${exp.title || ''}</div>
                    <span style="font-size: 14px; color: #7f8c8d; font-style: italic;">${exp.years || ''}</span>
                  </div>
                  <div class="company">${exp.company || ''}</div>
                  ${exp.description ? `<p style="margin-bottom: 10px; text-align: justify;">${exp.description}</p>` : ''}
                  ${exp.achievements && exp.achievements.length > 0 ? `
                    <ul style="margin: 0; padding-left: 20px;">
                      ${exp.achievements.map((achievement: string) => `<li style="margin-bottom: 5px;">${achievement}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Skills -->
            ${data.skills && data.skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Skills & Expertise</div>
              <div class="skills-container">
                ${data.skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
              </div>
            </div>
            ` : ''}

            <!-- Education -->
            ${data.education ? `
            <div class="section">
              <div class="section-title">Education</div>
              <p>${data.education}</p>
            </div>
            ` : ''}

            <!-- Projects -->
            ${data.projects && data.projects.length > 0 ? `
            <div class="section">
              <div class="section-title">Projects</div>
              ${data.projects.map((project: any) => `
                <div style="margin-bottom: 15px;">
                  <h3 style="font-size: 16px; margin: 0 0 5px 0; color: #34495e; font-weight: 600;">${project.name || ''}</h3>
                  ${project.description ? `<p style="margin-bottom: 8px;">${project.description}</p>` : ''}
                  ${project.technologies && project.technologies.length > 0 ? `
                    <div style="font-size: 14px; color: #7f8c8d;">
                      <strong>Technologies:</strong> ${project.technologies.join(', ')}
                    </div>
                  ` : ''}
                  ${project.link ? `<div style="margin-top: 5px;"><a href="${project.link}" style="color: #3498db; font-size: 14px;">${project.link}</a></div>` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Certifications -->
            ${data.certifications && data.certifications.length > 0 ? `
            <div class="section">
              <div class="section-title">Certifications</div>
              <ul style="margin: 0; padding-left: 20px;">
                ${data.certifications.map((cert: string) => `<li style="margin-bottom: 5px;">${cert}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
        `;
      };

      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        setError('Please allow popups to download PDF');
        return;
      }

      const resumeHTML = createTemplateHTML(actualData, template);
      const fileName = `${actualData.name || resumeData.title || 'resume'}-${template}`;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}</title>
          <meta charset="UTF-8">
        </head>
        <body>
          ${resumeHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            }
            
            window.onafterprint = function() {
              window.close();
            }
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      setSuccess(`Opening print dialog for ${fileName}. Choose "Save as PDF" to download.`);
      
    } catch (error) {
      console.error('Error downloading resume:', error);
      setError(`Failed to download resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  // Download tailored resume as PDF
  const downloadTailoredResumePDF = async () => {
    if (!tailoredResume || !selectedResume) {
      setError('No tailored resume available for download.');
      return;
    }
    
    await downloadSpecificResume(tailoredResume, selectedResume.template || 'modern', 'tailored-' + selectedResume._id);
  };

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Resume Tailor</h1>
            <p className="text-gray-400">Optimize your resume for specific job descriptions</p>
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
            <TabsTrigger value="tailor" disabled={!selectedResume} className="flex items-center gap-2">
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
                  Choose a Resume to Tailor
                </CardTitle>
                <p className="text-gray-100">
                  Select from your saved resumes to optimize for a specific job
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No resumes found</p>
                    <Button
                      onClick={() => router.push("/dashboard/builder")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Create Your First Resume
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Show uploaded resume options if available */}
                    {uploadedResumeOptions.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-gray-700">Recently Uploaded Resume Options</h3>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setUploadedResumeOptions([]);
                              setSelectedResume(null);
                              setSuccess("Cleared uploaded resume options");
                            }}
                          >
                            Clear Options
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {uploadedResumeOptions.map((option) => (
                            <div
                              key={option._id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                selectedResume && selectedResume._id === option._id
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => handleResumeSelect(option)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-700 text-sm">{option.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {option.isOriginal ? "Original Document" : `Template: ${option.template}`}
                                    </p>
                                  </div>
                                  {selectedResume && selectedResume._id === option._id && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                                
                                <div className="bg-white rounded border max-h-32 overflow-hidden">
                                  <div className="scale-25 transform-gpu origin-top-left w-[400%]" data-resume-preview="true">
                                    {renderResumeTemplate(
                                      option.data, 
                                      option.template, 
                                      option.originalFile
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResumeSelect(option);
                                      setActiveTab("tailor");
                                    }}
                                  >
                                    Select
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await downloadSpecificResume(option, option.template, option._id);
                                    }}
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show locally stored temp resume (if any) */}
                    {tempLocalResume && uploadedResumeOptions.length === 0 && (
>>>>>>> my-feature-branch
                      <div className={`p-4 border rounded-lg transition-all bg-yellow-50`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-700">{tempLocalResume.title} (Local)</h3>
                            <p className="text-sm text-gray-500 mt-1">Stored in your browser</p>
                            <p className="text-xs text-gray-500 mt-2">Uploaded: {new Date(tempLocalResume.updatedAt).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button size="sm" onClick={() => {
                              // Use locally stored resume for preview only
                              setSelectedResume(tempLocalResume);
                              setTailoredResume(null);
                              setActiveTab('tailor');
                              setSuccess('Using local resume for preview (save to account to tailor)');
                            }} className="bg-yellow-600 hover:bg-yellow-700 text-white">Use Locally</Button>
                            <Button size="sm" onClick={() => {
                              // If already uploaded, add server data to resumes list and skip
                              if (tempLocalResume?.metadata?.uploaded && tempLocalResume.serverData) {
                                setResumes(prev => {
                                  if (prev.some(r => String(r._id) === String(tempLocalResume.serverData._id))) return prev;
                                  return [...prev, tempLocalResume.serverData];
                                });
                                setSuccess('Resume already uploaded to your account');
                                return;
                              }
                              // Save to account by uploading original file (if still available)
                              if (tempLocalFile) {
                                uploadResume(tempLocalFile);
                              } else {
                                setError('Original file not available to upload. Please upload again.');
                              }
                            }} className="bg-purple-600 hover:bg-purple-700 text-white">Save to Account</Button>
                            <Button size="sm" variant="outline" onClick={removeTempFromBrowser}>Remove</Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Separator if we have uploaded options */}
                    {uploadedResumeOptions.length > 0 && resumes.length > 0 && (
                      <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="text-sm text-gray-500 font-medium">Your Saved Resumes</span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                    )}

                    {/* Existing saved resumes */}
                    {resumes.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {resumes.map((resume) => (
                         <div
                           key={resume._id}
                           className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                             selectedResume && selectedResume._id === resume._id
                               ? "border-purple-500 bg-purple-50"
                               : "border-gray-200 hover:border-gray-300"
                           }`}
                           onClick={() => handleResumeSelect(resume)}
                         >
                           <div className="flex items-start justify-between">
                             <div className="flex-1">
                               <h3 className="font-semibold text-gray-400">{resume.title}</h3>
                               <p className="text-sm text-gray-500 mt-1">
                                 Template: {resume.template || "Modern"}
                               </p>
                               <p className="text-xs text-gray-500 mt-2">
                                 Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                               </p> 
                               <div className="h-100 overflow-hidden mt-2 border border-gray-300 rounded" data-resume-preview="true">
                               {renderResumeTemplate(resume.data, resume.template)}
                               </div>
                               
                               <div className="flex gap-2 mt-3">
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="flex-1 text-xs"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleResumeSelect(resume);
                                     setActiveTab("tailor");
                                   }}
                                 >
                                   Select for Tailoring
                                 </Button>
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="text-xs"
                                   onClick={async (e) => {
                                     e.stopPropagation();
                                     await downloadSpecificResume(resume, resume.template || 'modern', resume._id);
                                   }}
                                 >
                                   <Download className="w-3 h-3" />
                                 </Button>
                               </div>
                             </div>
                             {selectedResume && selectedResume._id === resume._id && (
                               <CheckCircle className="w-5 h-5 text-purple-600" />
                             )}
                           </div>
                         </div>
                       ))}
                      </div>
                    )}
                  </div>
                )}
               </CardContent>
             </Card>
             
             {/* Single Upload Section */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <FileText className="w-5 h-5" />
                   Upload New Resume
                 </CardTitle>
                 <p className="text-gray-100">
                   Upload a new resume file to add more options for tailoring
                 </p>
               </CardHeader>
               <CardContent>
                 <div
                   className={`text-center py-12 border-dashed border-2 ${
                     dragOver ? "border-purple-500 bg-purple-50" : "border-gray-700"
                   } rounded-lg`}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                 >
                   <p className="text-center text-2xl text-white">
                     {file ? file.name : "Upload Your Own Resume"}
                   </p>
                   <p className="text-center text-gray-400 mt-2">
                     Drag and drop your resume file here or click to upload
                   </p>
                   <div className="mt-4">
                     <Button
                       className="bg-purple-600 hover:bg-purple-700"
                       onClick={handleButtonClick}
                       disabled={isUploading}
                     >
                       {isUploading ? (
                         <>
                           <Loader2 className="mr-2 w-5 h-5 animate-spin" />
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
                       accept=".pdf,.doc,.docx"
                       className="hidden"
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

          <TabsContent value="tailor" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Job Description Analysis
                  </CardTitle>
                  <p className="text-gray-600">
                    Paste the complete job posting to optimize your resume for ATS systems
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Job URL (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://www.company.com/jobs/position"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <Button variant="outline" size="sm">
                        Extract
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Job Description *</label>
                    <Textarea
                      placeholder="Paste the complete job description here including:
• Job title and company name
• Required qualifications and skills
• Job responsibilities and duties
• Preferred experience and education
• Company culture and values

The more detailed the job description, the better we can optimize your resume for ATS systems."
                      className="min-h-[300px] resize-none text-sm"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Include only the responsibilities and qualifications sections for better results</span>
                      <span>{jobDescription.length} characters</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">ATS Optimization Tips:</p>
                        <ul className="text-blue-800 space-y-1 text-xs">
                          <li>• Include exact keywords from the job posting</li>
                          <li>• Match technical skills and certifications</li>
                          <li>• Use industry-specific terminology</li>
                          <li>• Highlight relevant experience and achievements</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleTailorResume}
                    disabled={isTailoring || !jobDescription.trim() || !selectedResume}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Analyzing & Tailoring Resume...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 w-5 h-5" />
                        Analyze & Tailor Resume
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {selectedResume && (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Resume Preview</CardTitle>
                    <p className="text-gray-600">{selectedResume.title}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-lg shadow-sm border max-h-[400px] overflow-y-auto">
                      <div className="scale-50 transform-gpu origin-top-left w-[200%]">
                        {renderResumeTemplate(selectedResume.data, selectedResume.template)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-6">
            {tailoredResume && (
              <>
                {/* ATS Score Improvement Section */}
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      ATS Optimization Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {tailoredResume.metadata?.originalScore || 45}%
                        </div>
                        <div className="text-sm text-gray-600">Original ATS Score</div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-8 h-0.5 bg-green-600"></div>
                          <Wand2 className="w-5 h-5" />
                          <div className="w-8 h-0.5 bg-green-600"></div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {tailoredResume.metadata?.optimizationScore || 85}%
                        </div>
                        <div className="text-sm text-gray-600">Optimized ATS Score</div>
                      </div>
                    </div>
                    
                    {tailoredResume.metadata?.keywordsAdded && tailoredResume.metadata.keywordsAdded.length > 0 && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <h4 className="font-semibold text-gray-700 mb-2">Keywords Added:</h4>
                        <div className="flex flex-wrap gap-2">
                          {tailoredResume.metadata.keywordsAdded.map((keyword: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Original Resume</span>
                        <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                          ATS: {tailoredResume.metadata?.originalScore || 45}%
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white rounded-lg shadow-sm border max-h-[500px] overflow-y-auto">
                        <div className="scale-50 transform-gpu origin-top-left w-[200%]">
                          {selectedResume && renderResumeTemplate(selectedResume.data, selectedResume.template)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-purple-600">Tailored Resume</CardTitle>
                          <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                            ATS: {tailoredResume.metadata?.optimizationScore || 85}%
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={downloadTailoredResumePDF}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white rounded-lg shadow-sm border max-h-[500px] overflow-y-auto">
                        <div className="scale-50 transform-gpu origin-top-left w-[200%]" data-resume-preview="true" data-tailored-resume="true">
                          {renderResumeTemplate(tailoredResume, selectedResume?.template || "modern")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}