"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  FileText,
  AlertTriangle,
  Maximize2
} from "lucide-react";
import type { TextRegion } from "@/lib/services/ocr-service";

interface DocumentViewerProps {
  document: {
    name: string;
    size: number;
    type: string;
    base64?: string;
  };
  highlightRegions?: TextRegion[];
  onRegionClick?: (region: TextRegion) => void;
}

export function DocumentViewer({ 
  document, 
  highlightRegions = [],
  onRegionClick 
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(125); // Start with larger zoom for better readability
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const viewerRef = useRef<HTMLDivElement>(null);

  const isPDF = document.type === 'application/pdf';
  const isImage = document.type.startsWith('image/');
  const isDoc = document.type.includes('word') || document.type.includes('document');

  // Handle zoom
  const handleZoomIn = () => setZoom(prev => Math.min(250, prev + 25));
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 25));
  const handleResetZoom = () => setZoom(125);

  // Handle rotation
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && viewerRef.current) {
      viewerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!document.base64) return;
    
    const link = document.createElement('a');
    link.href = document.base64;
    link.download = document.name;
    link.click();
  };

  // Render PDF viewer
  const renderPDFViewer = () => {
    if (!document.base64) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="w-12 h-12 mb-2" />
          <p>PDF preview not available</p>
          <p className="text-sm">Original file: {document.name}</p>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <embed
          src={document.base64}
          type="application/pdf"
          width="100%"
          height="600px"
          className="rounded border shadow-lg"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            minHeight: '600px'
          }}
        />
        
        {/* Highlight overlays for error regions */}
        {showHighlights && highlightRegions.map((region) => (
          <div
            key={region.id}
            className={`absolute border-2 cursor-pointer transition-all hover:opacity-80 ${
              region.confidence < 0.5 
                ? 'border-red-500 bg-red-200 bg-opacity-30' 
                : 'border-yellow-500 bg-yellow-200 bg-opacity-30'
            }`}
            style={{
              // These would need to be calculated based on OCR region coordinates
              // For now, we'll show them as overlays
              top: `${Math.random() * 70 + 10}%`,
              left: `${Math.random() * 70 + 10}%`,
              width: '100px',
              height: '20px'
            }}
            onClick={() => onRegionClick?.(region)}
            title={`Confidence: ${Math.round(region.confidence * 100)}% - "${region.text}"`}
          >
            <div className="absolute -top-6 left-0 text-xs bg-black text-white px-1 rounded opacity-0 hover:opacity-100 transition-opacity">
              {Math.round(region.confidence * 100)}%
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render document preview for non-PDF files
  const renderDocumentPreview = () => {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 rounded">
        <FileText className="w-16 h-16 mb-4 text-gray-400" />
        <p className="font-medium mb-2">{document.name}</p>
        <p className="text-sm text-gray-600 mb-2">
          {document.type.split('/')[1].toUpperCase()} Document
        </p>
        <p className="text-xs text-gray-500 mb-4">
          {(document.size / 1024 / 1024).toFixed(2)} MB
        </p>
        
        {isDoc && (
          <div className="text-center">
            <p className="text-sm text-blue-600 mb-2">
              Document content has been extracted for editing
            </p>
            <p className="text-xs text-gray-500">
              Original formatting preserved in exported versions
            </p>
          </div>
        )}

        {document.base64 && (
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download Original
          </Button>
        )}
      </div>
    );
  };

  return (
    <div ref={viewerRef} className="flex flex-col h-full">
      {/* Viewer Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-mono min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetZoom}>
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {isPDF && (
            <>
              <Button variant="ghost" size="sm" onClick={handleRotate}>
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHighlights(!showHighlights)}
                className={showHighlights ? 'bg-blue-100' : ''}
              >
                <AlertTriangle className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          {document.base64 && (
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-full mx-auto">
          {isPDF ? renderPDFViewer() : renderDocumentPreview()}
        </div>
      </div>

      {/* Error Regions Summary */}
      {highlightRegions.length > 0 && (
        <div className="p-2 border-t bg-yellow-50">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-800">
              {highlightRegions.length} potential {highlightRegions.length === 1 ? 'issue' : 'issues'} detected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHighlights(!showHighlights)}
              className="ml-auto"
            >
              {showHighlights ? 'Hide' : 'Show'} highlights
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}