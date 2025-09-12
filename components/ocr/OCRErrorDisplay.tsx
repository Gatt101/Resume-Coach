"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Lightbulb
} from "lucide-react";
import type { TextRegion } from "@/lib/services/ocr-service";

interface OCRErrorDisplayProps {
  confidence: number;
  errorRegions: TextRegion[];
  extractedText: string;
  onRetry?: () => void;
  onManualCorrection?: () => void;
}

export function OCRErrorDisplay({
  confidence,
  errorRegions,
  extractedText,
  onRetry,
  onManualCorrection
}: OCRErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "text-green-600 bg-green-50 border-green-200";
    if (conf >= 0.6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return "High Confidence";
    if (conf >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  const criticalErrors = errorRegions.filter(region => region.confidence < 0.5);
  const warnings = errorRegions.filter(region => region.confidence >= 0.5 && region.confidence < 0.8);

  return (
    <div className="space-y-4">
      {/* Confidence Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              confidence >= 0.8 ? 'bg-green-500' : 
              confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            OCR Quality Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold">{Math.round(confidence * 100)}%</p>
              <p className={`text-sm ${getConfidenceColor(confidence).split(' ')[0]}`}>
                {getConfidenceLabel(confidence)}
              </p>
            </div>
            <Badge variant={confidence >= 0.8 ? "default" : confidence >= 0.6 ? "secondary" : "destructive"}>
              {errorRegions.length} {errorRegions.length === 1 ? 'Issue' : 'Issues'} Found
            </Badge>
          </div>

          {confidence < 0.8 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {confidence < 0.6 
                  ? "Low confidence detected. Manual review recommended before proceeding."
                  : "Some issues detected. Please review the extracted text for accuracy."
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry OCR
              </Button>
            )}
            {onManualCorrection && (
              <Button variant="outline" size="sm" onClick={onManualCorrection}>
                Manual Correction
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Details */}
      {showDetails && errorRegions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detected Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Critical Errors */}
              {criticalErrors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Critical Issues ({criticalErrors.length})
                  </h4>
                  <div className="space-y-2">
                    {criticalErrors.map((region) => (
                      <div
                        key={region.id}
                        className="p-3 border border-red-200 rounded-lg bg-red-50 cursor-pointer hover:bg-red-100"
                        onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-mono text-sm text-red-800 bg-red-100 px-2 py-1 rounded">
                              "{region.text}"
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Confidence: {Math.round(region.confidence * 100)}%
                            </p>
                          </div>
                          <Badge variant="destructive" className="ml-2">
                            Critical
                          </Badge>
                        </div>
                        
                        {selectedRegion === region.id && region.suggestions && (
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              Suggestions:
                            </p>
                            <ul className="text-sm text-red-600 space-y-1">
                              {region.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-400 mt-1">•</span>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings ({warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {warnings.map((region) => (
                      <div
                        key={region.id}
                        className="p-3 border border-yellow-200 rounded-lg bg-yellow-50 cursor-pointer hover:bg-yellow-100"
                        onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-mono text-sm text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
                              "{region.text}"
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                              Confidence: {Math.round(region.confidence * 100)}%
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            Warning
                          </Badge>
                        </div>
                        
                        {selectedRegion === region.id && region.suggestions && (
                          <div className="mt-3 pt-3 border-t border-yellow-200">
                            <p className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              Suggestions:
                            </p>
                            <ul className="text-sm text-yellow-600 space-y-1">
                              {region.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-yellow-400 mt-1">•</span>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {errorRegions.length === 0 && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">No issues detected. Text extraction appears accurate.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Preview with Highlights */}
      {showDetails && extractedText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extracted Text Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {extractedText.substring(0, 1000)}
                {extractedText.length > 1000 && "..."}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Showing first 1000 characters. Full text available in editor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}