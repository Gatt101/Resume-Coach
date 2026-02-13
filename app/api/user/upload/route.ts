import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ocrService, type OCRResult, type OCRError } from "@/lib/services/ocr-service";

const ZAI_API_URL = process.env.ZAI_API_URL || "https://api.z.ai/api/paas/v4/chat/completions";
const ZAI_MODEL = process.env.ZAI_MODEL || "glm-4.7";
const ZAI_API_KEY = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY;

// Retry utility for AI parsing
async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 2000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('401') || message.includes('403')) {
        throw error;
      }
      if (attempt === maxRetries - 1) throw error;
      
      console.log(`AI parsing attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

function extractJsonFromModelOutput(rawOutput: string): unknown {
  let jsonText = rawOutput.trim();

  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const startIndex = jsonText.indexOf('{');
  const lastIndex = jsonText.lastIndexOf('}');

  if (startIndex === -1 || lastIndex === -1 || startIndex >= lastIndex) {
    throw new Error("No valid JSON object found in AI response");
  }

  const jsonString = jsonText.substring(startIndex, lastIndex + 1);
  const cleanedJson = jsonString
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ');

  return JSON.parse(cleanedJson);
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("resume") as File;
    const title = formData.get("title") as string;
    const template = formData.get("template") as string || "modern";

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Process file with enhanced OCR service
    let ocrResult: OCRResult;
    try {
      console.log(`Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);
      ocrResult = await ocrService.processFile(file);
      console.log(`OCR completed in ${ocrResult.processingTime}ms with confidence: ${ocrResult.confidence}`);
    } catch (error) {
      console.error("OCR processing failed:", error);
      
      const ocrError = error as OCRError;
      return new Response(
        JSON.stringify({
          error: "File processing failed",
          details: ocrError.message,
          code: ocrError.code,
          suggestions: ocrError.suggestions,
          recoverable: ocrError.recoverable
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse extracted text into structured resume data
    let structuredData;
    try {
      if (ocrResult.extractedText && ocrResult.extractedText.trim().length > 50 && ZAI_API_KEY) {
        console.log("Parsing extracted text with Z AI...");

        structuredData = await retryApiCall(async () => {
          const parsePrompt = `Extract resume information and return ONLY valid JSON. No explanations, no markdown, no extra text.

REQUIRED JSON FORMAT:
{
  "name": "string",
  "email": "string", 
  "phone": "string",
  "location": "string",
  "linkedin": "",
  "website": "",
  "summary": "string",
  "experience": [
    {
      "title": "string",
      "company": "string", 
      "years": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "skills": ["string"],
  "education": "string",
  "projects": [
    {
      "name": "string",
      "description": "string", 
      "technologies": ["string"],
      "link": ""
    }
  ],
  "certifications": ["string"]
}

RULES:
- Return ONLY the JSON object
- Use empty strings "" for missing values
- Use empty arrays [] for missing lists
- Ensure all strings are properly quoted
- No trailing commas
- No comments or explanations

RESUME TEXT:
${ocrResult.extractedText.substring(0, 3000)}`;

          const response = await fetch(ZAI_API_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ZAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: ZAI_MODEL,
              messages: [
                {
                  role: "user",
                  content: parsePrompt
                }
              ],
              temperature: 0.1,
              max_tokens: 2000
            })
          });

          if (!response.ok) {
            const errorPayload = await response.text().catch(() => "");
            throw new Error(`Z AI parsing request failed: ${response.status} ${errorPayload}`);
          }

          const parseResult = await response.json();
          const content = parseResult?.choices?.[0]?.message?.content;
          const parsedText = typeof content === "string"
            ? content
            : Array.isArray(content)
              ? content.map((item: { text?: string }) => item?.text || "").join(" ")
              : "";

          if (!parsedText.trim()) {
            throw new Error("Z AI returned empty parsing response");
          }

          return extractJsonFromModelOutput(parsedText);
        });

        console.log("Successfully parsed resume data with Z AI");
      } else {
        throw new Error("Insufficient text extracted for AI parsing");
      }
    } catch (error) {
      console.error("Error parsing resume with AI:", error);
      
      // Try to extract basic information from the text as fallback
      const text = ocrResult.extractedText;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Simple extraction logic
      const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{10,}/);
      const nameMatch = lines[0] && lines[0].length < 50 ? lines[0] : "";
      
      // Extract skills (look for common skill keywords)
      const skillKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'git', 'java', 'typescript'];
      const foundSkills = skillKeywords.filter(skill => 
        text.toLowerCase().includes(skill.toLowerCase())
      );
      
      structuredData = {
        name: nameMatch || "Please update your name",
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0].replace(/\s+/g, ' ').trim() : "",
        location: "",
        linkedin: "",
        website: "",
        summary: text.length > 100 ? 
          text.substring(0, 500) + "..." : 
          "Please add your professional summary",
        experience: [],
        skills: foundSkills,
        education: "",
        projects: [],
        certifications: []
      };
      
      console.log("Used fallback parsing with basic extraction");
    }

    // Create enhanced resume data with OCR results
    const processedResume = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      title: title || file.name || "Uploaded Resume",
      template,
      data: structuredData,
      metadata: {
        generatedAt: new Date().toISOString(),
        targetRole: "General",
        experienceLevel: "Mid-level",
        colorScheme: "blue",
        layout: "standard",
        uploadedFile: {
          originalName: ocrResult.originalFile.name,
          size: ocrResult.originalFile.size,
          type: ocrResult.originalFile.type,
          extractedText: ocrResult.extractedText.substring(0, 1000)
        },
        ocrResults: {
          confidence: ocrResult.confidence,
          method: ocrResult.method,
          processingTime: ocrResult.processingTime,
          errorRegions: ocrResult.errorRegions,
          hasErrors: ocrResult.errorRegions.length > 0
        }
      },
      isLocal: true
    };

    // Validate extracted text quality
    const textValidation = ocrService.validateExtractedText(ocrResult.extractedText);

    console.log("Enhanced OCR processing completed:", {
      confidence: ocrResult.confidence,
      method: ocrResult.method,
      processingTime: ocrResult.processingTime,
      errorCount: ocrResult.errorRegions.length,
      textValid: textValidation.isValid
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Resume processed with enhanced OCR",
        resume: processedResume,
        ocrResults: {
          extractedText: ocrResult.extractedText,
          confidence: ocrResult.confidence,
          method: ocrResult.method,
          processingTime: ocrResult.processingTime,
          errorRegions: ocrResult.errorRegions,
          originalFile: ocrResult.originalFile,
          textValidation
        },
        instructions: ocrResult.confidence < 0.8 ? 
          "Low confidence detected. Please review and correct the extracted text." :
          "Text extracted successfully. Review and proceed to tailoring."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Resume processing error:", error);

    return new Response(
      JSON.stringify({
        error: "Error processing resume file",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please check the file format and try again. Supported formats: PDF, DOCX, DOC, TXT"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
