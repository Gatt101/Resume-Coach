"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  FileText, 
  Eye,
  Edit3,
  RotateCcw,
  Save
} from "lucide-react";
import { DocumentViewer } from "./DocumentViewer";
import { PlainTextEditor } from "./PlainTextEditor";
import type { TextRegion } from "@/lib/services/ocr-service";

interface DualPaneEditorProps {
  originalDocument: {
    name: string;
    size: number;
    type: string;
    base64?: string;
  };
  extractedText: string;
  onTextChange: (text: string) => void;
  highlightRegions?: TextRegion[];
  readOnly?: boolean;
  confidence?: number;
}

export function DualPaneEditor({
  originalDocument,
  extractedText,
  onTextChange,
  highlightRegions = [],
  readOnly = false,
  confidence = 1.0
}: DualPaneEditorProps) {
  const [leftPaneWidth, setLeftPaneWidth] = useState(60); // Percentage - increased for better PDF preview
  const [isResizing, setIsResizing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [currentText, setCurrentText] = useState(extractedText);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Handle text changes
  const handleTextChange = (newText: string) => {
    setCurrentText(newText);
    setHasUnsavedChanges(newText !== extractedText);
  };

  // Save changes
  const handleSave = () => {
    onTextChange(currentText);
    setHasUnsavedChanges(false);
  };

  // Reset to original
  const handleReset = () => {
    setCurrentText(extractedText);
    setHasUnsavedChanges(false);
  };

  // Handle mouse resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newWidth));
      setLeftPaneWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Synchronized scrolling
  const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || !rightScrollRef.current) return;
    
    const scrollPercentage = e.currentTarget.scrollTop / 
      (e.currentTarget.scrollHeight - e.currentTarget.clientHeight);
    
    const rightScrollHeight = rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight;
    rightScrollRef.current.scrollTop = scrollPercentage * rightScrollHeight;
  };

  const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || !leftScrollRef.current) return;
    
    const scrollPercentage = e.currentTarget.scrollTop / 
      (e.currentTarget.scrollHeight - e.currentTarget.clientHeight);
    
    const leftScrollHeight = leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight;
    leftScrollRef.current.scrollTop = scrollPercentage * leftScrollHeight;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-lg">Document Editor</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{originalDocument.name}</span>
            <span className="text-gray-400">•</span>
            <span>{(originalDocument.size / 1024 / 1024).toFixed(2)} MB</span>
            {confidence < 1.0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className={`font-medium ${
                  confidence >= 0.8 ? 'text-green-600' : 
                  confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(confidence * 100)}% confidence
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? <PanelLeftClose className="w-4 h-4 mr-2" /> : <PanelLeftOpen className="w-4 h-4 mr-2" />}
            {showOriginal ? 'Hide Original' : 'Show Original'}
          </Button>
          
          {!readOnly && hasUnsavedChanges && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div 
        ref={containerRef}
        className="flex-1 flex relative overflow-hidden"
      >
        {/* Left Pane - Original Document */}
        {showOriginal && (
          <div 
            className="flex flex-col border-r bg-white"
            style={{ width: `${leftPaneWidth}%` }}
          >
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm">Original Document</span>
              </div>
            </div>
            
            <div 
              ref={leftScrollRef}
              className="flex-1 overflow-auto"
              onScroll={handleLeftScroll}
            >
              <DocumentViewer
                document={originalDocument}
                highlightRegions={highlightRegions}
              />
            </div>
          </div>
        )}

        {/* Resize Handle */}
        {showOriginal && (
          <div
            className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0 relative group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-200 transition-colors" />
          </div>
        )}

        {/* Right Pane - Text Editor */}
        <div 
          className="flex flex-col bg-white"
          style={{ width: showOriginal ? `${100 - leftPaneWidth}%` : '100%' }}
        >
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-sm">
                {readOnly ? 'Extracted Text' : 'Editable Text'}
              </span>
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 font-medium">• Unsaved changes</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={syncScroll}
                  onChange={(e) => setSyncScroll(e.target.checked)}
                  className="rounded"
                />
                Sync scroll
              </label>
            </div>
          </div>
          
          <div 
            ref={rightScrollRef}
            className="flex-1 overflow-auto"
            onScroll={handleRightScroll}
          >
            <PlainTextEditor
              text={currentText}
              onChange={handleTextChange}
              highlightRegions={highlightRegions}
              readOnly={readOnly}
              placeholder="Your resume text will appear here after OCR processing..."
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Characters: {currentText.length}</span>
          <span>Lines: {currentText.split('\n').length}</span>
          {highlightRegions.length > 0 && (
            <span className="text-orange-600">
              {highlightRegions.length} potential {highlightRegions.length === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-orange-600">Unsaved changes</span>
          )}
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}