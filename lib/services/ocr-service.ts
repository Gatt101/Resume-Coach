import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_REQUEST_OPTIONS = { apiVersion: process.env.GEMINI_API_VERSION || "v1beta" };

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (error) {
    console.error("Error initializing Gemini AI:", error);
}

export interface TextRegion {
    id: string;
    text: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
    isError: boolean;
    suggestions?: string[];
}

export interface OCRResult {
    extractedText: string;
    confidence: number;
    errorRegions: TextRegion[];
    originalFile: {
        name: string;
        size: number;
        type: string;
        base64?: string;
    };
    processingTime: number;
    method: 'gemini-vision' | 'mammoth' | 'plain-text' | 'fallback';
}

export interface OCRError {
    code: string;
    message: string;
    suggestions: string[];
    recoverable: boolean;
}

export class EnhancedOCRService {
    private async retryWithBackoff<T>(
        fn: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error: any) {
                lastError = error;

                if (error.message?.includes('401') || error.message?.includes('403')) {
                    throw error;
                }

                if (attempt === maxRetries - 1) break;

                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    async processFile(file: File): Promise<OCRResult> {
        const startTime = Date.now();

        try {
            // Validate file
            this.validateFile(file);

            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

            let result: OCRResult;

            switch (file.type) {
                case "text/plain":
                    result = await this.processPlainText(file, base64);
                    break;
                case "application/pdf":
                    result = await this.processPDF(file, buffer, base64);
                    break;
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    result = await this.processDOCX(file, buffer, base64);
                    break;
                case "application/msword":
                    result = await this.processDOC(file, base64);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${file.type}`);
            }

            result.processingTime = Date.now() - startTime;
            return result;

        } catch (error) {
            throw this.createOCRError(error as Error);
        }
    }

    private validateFile(file: File): void {
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error("INVALID_FILE_TYPE");
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error("FILE_TOO_LARGE");
        }

        if (file.size === 0) {
            throw new Error("EMPTY_FILE");
        }
    }

    private async processPlainText(file: File, base64: string): Promise<OCRResult> {
        const text = await file.text();

        return {
            extractedText: text,
            confidence: 1.0,
            errorRegions: [],
            originalFile: {
                name: file.name,
                size: file.size,
                type: file.type,
                base64: `data:${file.type};base64,${base64}`
            },
            processingTime: 0,
            method: 'plain-text'
        };
    }

    private async processPDF(file: File, buffer: ArrayBuffer, base64: string): Promise<OCRResult> {
        if (!genAI) {
            throw new Error("GEMINI_API_UNAVAILABLE");
        }

        try {
            const extractedText = await this.retryWithBackoff(async () => {
                const model = genAI!.getGenerativeModel(
                    { model: GEMINI_MODEL },
                    GEMINI_REQUEST_OPTIONS
                );

                const result = await model.generateContent([
                    `You are an expert OCR system. Extract ALL text from this resume document with maximum accuracy.

INSTRUCTIONS:
- Extract every word, number, and symbol visible in the document
- Preserve the original structure and formatting as much as possible
- Include contact information, work experience, education, skills, etc.
- If text is unclear, include your best interpretation
- Do not add explanations or comments
- Return only the extracted text content

Focus on accuracy and completeness. This is a professional resume document.`,
                    {
                        inlineData: {
                            data: base64,
                            mimeType: file.type
                        }
                    }
                ]);

                return result.response.text();
            });

            // Analyze confidence and detect errors
            const analysis = this.analyzeTextQuality(extractedText);

            return {
                extractedText: extractedText,
                confidence: analysis.confidence,
                errorRegions: analysis.errorRegions,
                originalFile: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    base64: `data:${file.type};base64,${base64}`
                },
                processingTime: 0,
                method: 'gemini-vision'
            };

        } catch (error) {
            console.error("PDF processing error:", error);
            throw new Error("PDF_PROCESSING_FAILED");
        }
    }

    private async processDOCX(file: File, buffer: ArrayBuffer, base64: string): Promise<OCRResult> {
        try {
            const docxBuffer = Buffer.from(buffer);
            const result = await mammoth.extractRawText({ buffer: docxBuffer });

            const analysis = this.analyzeTextQuality(result.value);

            return {
                extractedText: result.value,
                confidence: analysis.confidence,
                errorRegions: analysis.errorRegions,
                originalFile: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    base64: `data:${file.type};base64,${base64}`
                },
                processingTime: 0,
                method: 'mammoth'
            };

        } catch (error) {
            console.error("DOCX processing error:", error);
            throw new Error("DOCX_PROCESSING_FAILED");
        }
    }

    private async processDOC(file: File, base64: string): Promise<OCRResult> {
        // Legacy DOC format - provide fallback
        return {
            extractedText: "",
            confidence: 0,
            errorRegions: [{
                id: "legacy-doc-error",
                text: "Legacy DOC format detected",
                confidence: 0,
                startIndex: 0,
                endIndex: 0,
                isError: true,
                suggestions: [
                    "Convert to DOCX format for better compatibility",
                    "Save as PDF and re-upload",
                    "Copy text manually into the editor"
                ]
            }],
            originalFile: {
                name: file.name,
                size: file.size,
                type: file.type,
                base64: `data:${file.type};base64,${base64}`
            },
            processingTime: 0,
            method: 'fallback'
        };
    }

    private analyzeTextQuality(text: string): { confidence: number; errorRegions: TextRegion[] } {
        const errorRegions: TextRegion[] = [];
        let confidence = 0.9; // Start with high confidence for Gemini Vision

        // Check for unclear markers from Gemini
        const unclearMatches = text.matchAll(/\[UNCLEAR: ([^\]]+)\]/g);
        for (const match of unclearMatches) {
            const startIndex = match.index || 0;
            const endIndex = startIndex + match[0].length;

            errorRegions.push({
                id: `unclear-${startIndex}`,
                text: match[1],
                confidence: 0.3,
                startIndex,
                endIndex,
                isError: true,
                suggestions: [
                    "Manual correction needed",
                    "Check original document",
                    "Verify spelling and context"
                ]
            });

            confidence -= 0.05; // Smaller penalty for unclear text
        }

        // Check for suspicious patterns (less aggressive)
        const suspiciousPatterns = [
            /\b[a-zA-Z]{25,}\b/g, // Extremely long words (likely OCR errors)
            /\d{15,}/g, // Very long numbers (likely OCR errors)
        ];

        suspiciousPatterns.forEach((pattern, patternIndex) => {
            const matches = text.matchAll(pattern);
            let patternCount = 0;
            for (const match of matches) {
                patternCount++;
                if (patternCount <= 3) { // Only flag first 3 instances
                    const startIndex = match.index || 0;
                    const endIndex = startIndex + match[0].length;

                    errorRegions.push({
                        id: `suspicious-${patternIndex}-${startIndex}`,
                        text: match[0],
                        confidence: 0.7,
                        startIndex,
                        endIndex,
                        isError: true,
                        suggestions: [
                            "Verify this text in original document",
                            "Check for OCR misinterpretation"
                        ]
                    });

                    confidence -= 0.02; // Smaller penalty
                }
            }
        });

        // Check text completeness
        if (text.length < 100) {
            confidence *= 0.5;
            errorRegions.push({
                id: "insufficient-text",
                text: "Document appears to have minimal text content",
                confidence: 0.2,
                startIndex: 0,
                endIndex: text.length,
                isError: true,
                suggestions: [
                    "Verify document contains readable text",
                    "Check if document is image-based",
                    "Try a different file format"
                ]
            });
        }

        return {
            confidence: Math.max(0.1, Math.min(1.0, confidence)),
            errorRegions
        };
    }

    private createOCRError(error: Error): OCRError {
        const errorMap: Record<string, OCRError> = {
            "INVALID_FILE_TYPE": {
                code: "INVALID_FILE_TYPE",
                message: "Unsupported file format. Please upload PDF, DOCX, DOC, or TXT files.",
                suggestions: [
                    "Convert your document to PDF format",
                    "Save as DOCX if using Word",
                    "Export as plain text file"
                ],
                recoverable: true
            },
            "FILE_TOO_LARGE": {
                code: "FILE_TOO_LARGE",
                message: "File size exceeds 10MB limit.",
                suggestions: [
                    "Compress your PDF file",
                    "Remove unnecessary images",
                    "Split large documents into sections"
                ],
                recoverable: true
            },
            "EMPTY_FILE": {
                code: "EMPTY_FILE",
                message: "The uploaded file appears to be empty.",
                suggestions: [
                    "Check that the file contains content",
                    "Try uploading a different file",
                    "Verify file wasn't corrupted during upload"
                ],
                recoverable: true
            },
            "GEMINI_API_UNAVAILABLE": {
                code: "GEMINI_API_UNAVAILABLE",
                message: "AI text extraction service is currently unavailable.",
                suggestions: [
                    "Try uploading a DOCX file instead",
                    "Convert PDF to text manually",
                    "Try again in a few minutes"
                ],
                recoverable: true
            },
            "PDF_PROCESSING_FAILED": {
                code: "PDF_PROCESSING_FAILED",
                message: "Failed to extract text from PDF. The PDF might be image-based or corrupted.",
                suggestions: [
                    "Ensure PDF contains selectable text",
                    "Try converting to DOCX format",
                    "Use OCR software to convert image-based PDF"
                ],
                recoverable: true
            },
            "DOCX_PROCESSING_FAILED": {
                code: "DOCX_PROCESSING_FAILED",
                message: "Failed to extract text from DOCX file.",
                suggestions: [
                    "Check if file is corrupted",
                    "Try saving as a new DOCX file",
                    "Convert to PDF and re-upload"
                ],
                recoverable: true
            }
        };

        return errorMap[error.message] || {
            code: "UNKNOWN_ERROR",
            message: "An unexpected error occurred during text extraction.",
            suggestions: [
                "Try a different file format",
                "Check file integrity",
                "Contact support if problem persists"
            ],
            recoverable: false
        };
    }

    // Method to get processing progress (for future use with WebSockets)
    getProcessingStatus(sessionId: string): { progress: number; status: string } {
        // Placeholder for progress tracking
        return { progress: 100, status: 'completed' };
    }

    // Method to validate extracted text quality
    validateExtractedText(text: string): { isValid: boolean; issues: string[] } {
        const issues: string[] = [];

        if (text.length < 50) {
            issues.push("Text appears too short for a complete resume");
        }

        if (!/[a-zA-Z]/.test(text)) {
            issues.push("No alphabetic characters detected");
        }

        if (text.split('\n').length < 5) {
            issues.push("Document structure appears incomplete");
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }
}

// Export singleton instance
export const ocrService = new EnhancedOCRService();
