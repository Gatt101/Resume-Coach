"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Plus, Edit, Trash2, Download, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface Resume {
  _id: string;
  title: string;
  template: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/resume");
      if (!response.ok) {
        throw new Error("Failed to fetch resumes");
      }
      const data = await response.json();
      if (data.success && data.resumes) {
        setResumes(data.resumes);
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

  const handleDelete = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    setDeletingId(resumeId);
    try {
      const response = await fetch("/api/user/resume", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete resume");
      }

      // Remove the deleted resume from the list
      setResumes(prev => prev.filter(resume => resume._id !== resumeId));
    } catch (error) {
      console.error("Error deleting resume:", error);
      setError("Failed to delete resume. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (resumeId: string) => {
    router.push(`/dashboard/builder?id=${resumeId}`);
  };

  const handleEdit = (resumeId: string) => {
    router.push(`/dashboard/builder?id=${resumeId}&edit=true`);
  };

  const handleTailor = (resumeId: string) => {
    router.push(`/dashboard/tailor?resumeId=${resumeId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Resumes</h1>
            <p className="text-gray-400">Manage your resume collection</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/builder")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Resume
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {resumes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No resumes yet</h3>
              <p className="text-gray-500 mb-6">Create your first resume to get started</p>
              <Button
                onClick={() => router.push("/dashboard/builder")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <Card key={resume._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-300 truncate">
                    {resume.title}
                  </CardTitle>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Template: {resume.template || "Modern"}</span>
                    <span>{new Date(resume.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {resume.data?.name && (
                      <p className="text-sm text-gray-400">
                        <strong>Name:</strong> {resume.data.name}
                      </p>
                    )}
                    {resume.data?.email && (
                      <p className="text-sm text-gray-400">
                        <strong>Email:</strong> {resume.data.email}
                      </p>
                    )}
                    {resume.data?.summary && (
                      <p className="text-sm text-gray-400">
                        <strong>Summary:</strong> {resume.data.summary.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(resume._id)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(resume._id)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleTailor(resume._id)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Tailor
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(resume._id)}
                      disabled={deletingId === resume._id}
                      className="flex-1"
                    >
                      {deletingId === resume._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}