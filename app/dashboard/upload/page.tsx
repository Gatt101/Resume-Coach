"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, Edit, Save, Download, Eye, EyeOff } from "lucide-react";
import { ModernTemplate } from "@/components/resume-templates/ModernTemplate";
import { ClassicTemplate } from "@/components/resume-templates/ClassicTemplate";
import { CreativeTemplate } from "@/components/resume-templates/CreativeTemplate";
import { ProfessionalTemplate } from "@/components/resume-templates/ProfessionalTemplate";

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    years: string;
    description: string;
    achievements: string[];
  }>;
  skills: string[];
  education: string;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link: string;
  }>;
  certifications: string[];
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [template, setTemplate] = useState("modern");
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("title", file.name);
      formData.append("template", template);

      const response = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setExtractedText(data.extractedText || "");
        setResumeData(data.resume.data);
        setSuccess("Resume processed successfully! You can now edit the extracted information.");
      } else {
        throw new Error(data.error || "Processing failed");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setError(error instanceof Error ? error.message : "Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const updateResumeData = (field: string, value: any) => {
    if (!resumeData) return;
    
    setResumeData(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const addExperience = () => {
    if (!resumeData) return;
    
    const newExperience = {
      title: "",
      company: "",
      years: "",
      description: "",
      achievements: [""]
    };
    
    setResumeData(prev => ({
      ...prev!,
      experience: [...prev!.experience, newExperience]
    }));
  };

  const updateExperience = (index: number, field: string, value: any) => {
    if (!resumeData) return;
    
    const updatedExperience = [...resumeData.experience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    };
    
    setResumeData(prev => ({
      ...prev!,
      experience: updatedExperience
    }));
  };

  const addProject = () => {
    if (!resumeData) return;
    
    const newProject = {
      name: "",
      description: "",
      technologies: [],
      link: ""
    };
    
    setResumeData(prev => ({
      ...prev!,
      projects: [...prev!.projects, newProject]
    }));
  };

  const renderResumeTemplate = () => {
    if (!resumeData) return null;

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

  const saveResume = async () => {
    if (!resumeData) return;

    try {
      const response = await fetch("/api/user/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: resumeData,
          template: template
        }),
      });

      if (response.ok) {
        setSuccess("Resume saved successfully!");
        setIsEditing(false);
      } else {
        throw new Error("Failed to save resume");
      }
    } catch (error) {
      setError("Failed to save resume. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Resume Upload</h1>
          <p className="text-gray-400">Upload your resume and let AI extract and structure your information</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Upload Area */}
        {!resumeData && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragOver ? "border-purple-500 bg-purple-50" : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Processing Your Resume</h3>
                    <p className="text-gray-500">Extracting text and analyzing content...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Your Resume</h3>
                    <p className="text-gray-500 mb-4">
                      Drag and drop your resume here, or click to browse
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                      Supports PDF, DOCX, and TXT files (max 5MB)
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Split View */}
        {resumeData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Extracted Information Editor */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Extracted Information
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {isEditing ? "View Mode" : "Edit Mode"}
                    </Button>
                    {isEditing && (
                      <Button size="sm" onClick={saveResume} className="bg-purple-600 hover:bg-purple-700">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={resumeData.name}
                          onChange={(e) => updateResumeData("name", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={resumeData.email}
                          onChange={(e) => updateResumeData("email", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={resumeData.phone}
                          onChange={(e) => updateResumeData("phone", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={resumeData.location}
                          onChange={(e) => updateResumeData("location", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={resumeData.linkedin}
                          onChange={(e) => updateResumeData("linkedin", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={resumeData.website}
                          onChange={(e) => updateResumeData("website", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Professional Summary</h3>
                    <Textarea
                      value={resumeData.summary}
                      onChange={(e) => updateResumeData("summary", e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                    />
                  </div>

                  {/* Skills */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Skills</h3>
                    <Textarea
                      value={resumeData.skills.join(", ")}
                      onChange={(e) => updateResumeData("skills", e.target.value.split(", ").filter(s => s.trim()))}
                      disabled={!isEditing}
                      placeholder="Enter skills separated by commas"
                      rows={3}
                    />
                  </div>

                  {/* Experience */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700">Work Experience</h3>
                      {isEditing && (
                        <Button size="sm" variant="outline" onClick={addExperience}>
                          Add Experience
                        </Button>
                      )}
                    </div>
                    {resumeData.experience.map((exp, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <Label>Job Title</Label>
                            <Input
                              value={exp.title}
                              onChange={(e) => updateExperience(index, "title", e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(index, "company", e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Years</Label>
                            <Input
                              value={exp.years}
                              onChange={(e) => updateExperience(index, "years", e.target.value)}
                              disabled={!isEditing}
                              placeholder="e.g., 2020 - 2023"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(index, "description", e.target.value)}
                              disabled={!isEditing}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Achievements</Label>
                            <Textarea
                              value={exp.achievements.join("\n")}
                              onChange={(e) => updateExperience(index, "achievements", e.target.value.split("\n").filter(a => a.trim()))}
                              disabled={!isEditing}
                              placeholder="Enter achievements, one per line"
                              rows={3}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Education */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Education</h3>
                    <Textarea
                      value={resumeData.education}
                      onChange={(e) => updateResumeData("education", e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Live Resume Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                  <div className="flex gap-2">
                    <select
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="creative">Creative</option>
                      <option value="professional">Professional</option>
                    </select>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg shadow-lg border max-h-[800px] overflow-y-auto">
                    <div className="scale-75 transform-gpu origin-top-left w-[133%]">
                      {renderResumeTemplate()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extracted Text Preview */}
              {extractedText && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Raw Extracted Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded text-xs max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{extractedText}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}