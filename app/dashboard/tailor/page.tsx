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
    setSelectedResume(resume);
    setTailoredResume(null);
    setActiveTab("tailor");
    setError(null);
    setSuccess(null);
  };

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) {
      setError("Please provide a job description.");
      return;
    }
    if (!selectedResume) {
      setError("Please select a resume to tailor.");
      return;
    }

    // Prevent tailoring if resume is only stored locally
    if ((selectedResume as any)?.metadata?.method === 'local' || String(selectedResume._id).startsWith('local-')) {
      setError('This resume is stored locally in your browser. Please click "Save to Account" first to upload it before tailoring.');
      return;
    }

    setIsTailoring(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId: selectedResume._id,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume");
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

  const renderResumeTemplate = (resumeData: any, template: string) => {
    if (!resumeData) return null;
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
                  <div className="space-y-4">
                    {/* Show locally stored temp resume (if any) */}
                    {tempLocalResume && (
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

                    <div className="grid gap-4 md:grid-cols-2">
                      {resumes.map((resume) => (
                       <div
                         key={resume._id}
                         className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                           selectedResume?._id === resume._id
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
                             <div className="h-100 overflow-hidden mt-2 border border-gray-300 rounded">
                             {renderResumeTemplate(resume.data, resume.template)}
                             </div>
                           </div>
                           {selectedResume?._id === resume._id && (
                             <CheckCircle className="w-5 h-5 text-purple-600" />
                           )}
                         </div>
                       </div>
                     ))}
                    </div>
                  </div>
                 )}
               </CardContent>
             </Card>
             <Card>
               <CardContent>
                 <div
                   className={`m-4 text-center py-12 border-dashed border-2 ${
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
                    Job Description
                  </CardTitle>
                  <p className="text-gray-600">
                    Paste the job posting to tailor your resume
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste the complete job description here..."
                    className="min-h-[300px] resize-none"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <Button
                    onClick={handleTailorResume}
                    disabled={isTailoring || !jobDescription.trim() || !selectedResume}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Tailoring Resume...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 w-5 h-5" />
                        Tailor Resume
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
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Original Resume</CardTitle>
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
                      <CardTitle className="text-purple-600">Tailored Resume</CardTitle>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => window.print()}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-lg shadow-sm border max-h-[500px] overflow-y-auto">
                      <div className="scale-50 transform-gpu origin-top-left w-[200%]">
                        {renderResumeTemplate(tailoredResume, selectedResume?.template || "modern")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}