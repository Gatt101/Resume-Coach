"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react";

interface OCRProgressTrackerProps {
  isProcessing: boolean;
  fileName?: string;
  fileSize?: number;
  onComplete?: () => void;
}

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  error?: string;
}

export function OCRProgressTracker({ 
  isProcessing, 
  fileName, 
  fileSize,
  onComplete 
}: OCRProgressTrackerProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [stages, setStages] = useState<ProcessingStage[]>([
    {
      id: "validation",
      name: "File Validation",
      description: "Checking file format and size",
      completed: false
    },
    {
      id: "extraction",
      name: "Text Extraction", 
      description: "Extracting text content using OCR",
      completed: false
    },
    {
      id: "analysis",
      name: "Quality Analysis",
      description: "Analyzing text quality and detecting errors",
      completed: false
    },
    {
      id: "parsing",
      name: "Content Parsing",
      description: "Structuring resume data with AI",
      completed: false
    }
  ]);

  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
      setCurrentStage(0);
      setStages(prev => prev.map(stage => ({ ...stage, completed: false, error: undefined })));
      return;
    }

    // Simulate processing stages
    const intervals: NodeJS.Timeout[] = [];
    
    // Stage 1: Validation (quick)
    intervals.push(setTimeout(() => {
      setProgress(25);
      setCurrentStage(1);
      setStages(prev => prev.map((stage, index) => 
        index === 0 ? { ...stage, completed: true } : stage
      ));
    }, 500));

    // Stage 2: Extraction (varies by file type)
    const extractionTime = fileName?.endsWith('.pdf') ? 3000 : 1500;
    intervals.push(setTimeout(() => {
      setProgress(50);
      setCurrentStage(2);
      setStages(prev => prev.map((stage, index) => 
        index === 1 ? { ...stage, completed: true } : stage
      ));
    }, 500 + extractionTime));

    // Stage 3: Analysis
    intervals.push(setTimeout(() => {
      setProgress(75);
      setCurrentStage(3);
      setStages(prev => prev.map((stage, index) => 
        index === 2 ? { ...stage, completed: true } : stage
      ));
    }, 500 + extractionTime + 1000));

    // Stage 4: Parsing
    intervals.push(setTimeout(() => {
      setProgress(100);
      setCurrentStage(4);
      setStages(prev => prev.map((stage, index) => 
        index === 3 ? { ...stage, completed: true } : stage
      ));
      onComplete?.();
    }, 500 + extractionTime + 2000));

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [isProcessing, fileName, onComplete]);

  if (!isProcessing && progress === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-sm">{fileName || "Processing file..."}</p>
              {fileSize && (
                <p className="text-xs text-gray-500">
                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Processing Progress</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Processing Stages */}
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {stage.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : stage.error ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : currentStage === index ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    stage.completed ? 'text-green-700' : 
                    stage.error ? 'text-red-700' :
                    currentStage === index ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {stage.name}
                  </p>
                  <p className="text-xs text-gray-500">{stage.description}</p>
                  {stage.error && (
                    <p className="text-xs text-red-600 mt-1">{stage.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status Message */}
          {progress === 100 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Processing completed successfully!
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}