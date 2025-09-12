"use client";

import React, { useState } from 'react';
import { z } from 'zod';
import { Github, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ResumeIngestPayload } from '@/lib/services/github-resume-processor';

export interface GitHubResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resumeData: ResumeIngestPayload, metadata: any) => void;
}

interface GitHubFormData {
  username: string;
  preferredRole?: string;
  techStack: string[];
  targetCompany?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
  maxRepositories: number;
  minStarsForProjects: number;
}

interface ProcessingStep {
  id: string;
  label: string;
  completed: boolean;
  error?: string;
}

const ROLE_OPTIONS = [
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'fullstack', label: 'Full-Stack Developer' },
  { value: 'mobile', label: 'Mobile Developer' },
  { value: 'devops', label: 'DevOps Engineer' },
  { value: 'data', label: 'Data Engineer' },
  { value: 'ml', label: 'Machine Learning Engineer' },
  { value: 'security', label: 'Security Engineer' },
];

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior (0-2 years)' },
  { value: 'mid', label: 'Mid-level (2-5 years)' },
  { value: 'senior', label: 'Senior (5+ years)' },
  { value: 'lead', label: 'Lead/Principal (8+ years)' },
];

const COMMON_TECH_STACK = [
  'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust',
  'Node.js', 'Express', 'FastAPI', 'Django', 'Spring', 'Docker', 'Kubernetes', 'AWS', 'Azure',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Git', 'CI/CD'
];

export default function GitHubResumeModal({ isOpen, onClose, onSuccess }: GitHubResumeModalProps) {
  const [formData, setFormData] = useState<GitHubFormData>({
    username: '',
    techStack: [],
    maxRepositories: 6,
    minStarsForProjects: 0,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [techStackInput, setTechStackInput] = useState('');

  const resetForm = () => {
    setFormData({
      username: '',
      techStack: [],
      maxRepositories: 6,
      minStarsForProjects: 0,
    });
    setTechStackInput('');
    setError(null);
    setProcessingSteps([]);
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  const addTechStack = (tech: string) => {
    if (tech && !formData.techStack.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, tech],
      }));
    }
    setTechStackInput('');
  };

  const removeTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech),
    }));
  };

  const updateProcessingStep = (stepId: string, completed: boolean, error?: string) => {
    setProcessingSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, completed, error }
          : step
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    // Initialize processing steps
    const steps: ProcessingStep[] = [
      { id: 'validate', label: 'Validating GitHub username', completed: false },
      { id: 'fetch-profile', label: 'Fetching GitHub profile', completed: false },
      { id: 'fetch-repos', label: 'Analyzing repositories', completed: false },
      { id: 'process-skills', label: 'Categorizing skills', completed: false },
      { id: 'generate-resume', label: 'Generating resume', completed: false },
    ];
    setProcessingSteps(steps);

    try {
      // Step 1: Validate
      updateProcessingStep('validate', true);
      
      // Prepare request payload
      const requestPayload = {
        username: formData.username.trim(),
        hints: {
          preferredRole: formData.preferredRole,
          techStack: formData.techStack.length > 0 ? formData.techStack : undefined,
          targetCompany: formData.targetCompany?.trim() || undefined,
          experienceLevel: formData.experienceLevel,
        },
        options: {
          maxRepositories: formData.maxRepositories,
          minStarsForProjects: formData.minStarsForProjects,
          includeOpenSourceExperience: true,
          conservativeEstimates: true,
        },
      };

      // Step 2-5: API call
      updateProcessingStep('fetch-profile', true);
      updateProcessingStep('fetch-repos', true);
      updateProcessingStep('process-skills', true);
      
      const response = await fetch('/api/resume/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to process GitHub data');
      }

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to process GitHub data');
      }

      updateProcessingStep('generate-resume', true);

      // Success - call onSuccess with the resume data
      setTimeout(() => {
        onSuccess(result.data.resume, result.data.metadata);
        resetForm();
      }, 500);

    } catch (err) {
      console.error('GitHub resume generation error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Mark current step as failed
      const currentStep = processingSteps.find(step => !step.completed);
      if (currentStep) {
        updateProcessingStep(currentStep.id, false, errorMessage);
      }
      
      setIsProcessing(false);
    }
  };

  const isFormValid = formData.username.trim().length > 0;
  const completedSteps = processingSteps.filter(step => step.completed).length;
  const progressPercentage = processingSteps.length > 0 ? (completedSteps / processingSteps.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Build Resume from GitHub
          </DialogTitle>
          <DialogDescription>
            Generate a professional resume from your GitHub profile and repositories.
            We'll analyze your code, projects, and contributions to create a tailored resume.
          </DialogDescription>
        </DialogHeader>

        {!isProcessing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GitHub Username */}
            <div className="space-y-2">
              <Label htmlFor="username">GitHub Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g., octocat"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
              <p className="text-sm text-muted-foreground">
                Your GitHub profile must be public for us to analyze it.
              </p>
            </div>

            <Separator />

            {/* Optional Hints Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <Label className="text-base font-medium">Optional: Help us tailor your resume</Label>
              </div>

              {/* Preferred Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Target Role</Label>
                <Select
                  value={formData.preferredRole || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preferredRole: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <Select
                  value={formData.experienceLevel || ''}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, experienceLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <Label htmlFor="techStack">Preferred Technologies</Label>
                <div className="flex gap-2">
                  <Input
                    id="techStack"
                    type="text"
                    placeholder="Add a technology..."
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechStack(techStackInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTechStack(techStackInput)}
                    disabled={!techStackInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                
                {/* Common tech stack suggestions */}
                <div className="flex flex-wrap gap-1">
                  {COMMON_TECH_STACK.filter(tech => !formData.techStack.includes(tech)).slice(0, 8).map(tech => (
                    <Button
                      key={tech}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => addTechStack(tech)}
                    >
                      + {tech}
                    </Button>
                  ))}
                </div>

                {/* Selected tech stack */}
                {formData.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.techStack.map(tech => (
                      <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechStack(tech)}>
                        {tech} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Company */}
              <div className="space-y-2">
                <Label htmlFor="company">Target Company (Optional)</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="e.g., Google, Microsoft, Startup"
                  value={formData.targetCompany || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetCompany: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Advanced Options</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxRepos">Max Repositories: {formData.maxRepositories}</Label>
                  <Input
                    id="maxRepos"
                    type="range"
                    min="3"
                    max="10"
                    value={formData.maxRepositories}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxRepositories: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minStars">Min Stars for Projects: {formData.minStarsForProjects}</Label>
                  <Input
                    id="minStars"
                    type="range"
                    min="0"
                    max="50"
                    value={formData.minStarsForProjects}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStarsForProjects: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid}>
                <Github className="h-4 w-4 mr-2" />
                Generate Resume
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium">Processing your GitHub data...</h3>
              <p className="text-sm text-muted-foreground">
                This may take a few moments while we analyze your repositories and contributions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{completedSteps}/{processingSteps.length}</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>

              <div className="space-y-2">
                {processingSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : step.error ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    <span className={step.error ? 'text-red-500' : step.completed ? 'text-green-600' : ''}>
                      {step.label}
                    </span>
                    {step.error && (
                      <span className="text-xs text-red-500">- {step.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}