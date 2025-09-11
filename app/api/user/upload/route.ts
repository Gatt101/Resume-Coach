import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

// Initialize Gemini AI with error handling
let genAI: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } else {
    console.error("GEMINI_API_KEY not found in environment variables");
  }
} catch (error) {
  console.error("Error initializing Gemini AI:", error);
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

    // Validate file type and size
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Please upload PDF, DOC, DOCX, or TXT files." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return new Response(
        JSON.stringify({ error: "File size exceeds 5MB limit" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract text from file
    let extractedText = "";
    
    try {
      const buffer = await file.arrayBuffer();
      
      if (file.type === "text/plain") {
        extractedText = await file.text();
      } else if (file.type === "application/pdf") {
        // Use Gemini Vision API for PDF text extraction
        if (genAI) {
          try {
            console.log("Processing PDF with Gemini Vision API...");
            const base64 = Buffer.from(buffer).toString('base64');
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const result = await model.generateContent([
              "Extract all text content from this resume document. Return only the raw text content without any formatting or analysis. Include all personal information, work experience, education, skills, and other resume sections.",
              {
                inlineData: {
                  data: base64,
                  mimeType: file.type
                }
              }
            ]);
            
            extractedText = result.response.text();
            console.log("Successfully extracted text from PDF using Gemini Vision API");
          } catch (geminiError) {
            console.error("Gemini Vision API error:", geminiError);
            extractedText = "Error extracting text from PDF. Please ensure the PDF contains selectable text or try converting to a text-based format.";
          }
        } else {
          extractedText = "PDF processing requires Gemini API. Please ensure GEMINI_API_KEY is configured.";
        }
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // Use mammoth for DOCX files
        try {
          const docxBuffer = Buffer.from(buffer);
          const result = await mammoth.extractRawText({ buffer: docxBuffer });
          extractedText = result.value;
        } catch (docxError) {
          console.error("Error parsing DOCX:", docxError);
          extractedText = "Error extracting text from DOCX file. Please try converting to PDF or plain text.";
        }
      } else if (file.type === "application/msword") {
        // For older DOC files, provide guidance
        extractedText = "Legacy DOC format detected. For best results, please convert to DOCX or PDF format and upload again.";
      } else {
        extractedText = "Unsupported file format for text extraction.";
      }
    } catch (error) {
      console.error("Error extracting text from file:", error);
      extractedText = "Error processing document. Please try a different file format.";
    }

    // Use AI to parse the extracted text into structured resume data
    let structuredData;
    try {
      if (extractedText && extractedText.trim().length > 50 && genAI) {
        console.log("Parsing extracted text with Gemini AI...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const parsePrompt = `
          Parse the following resume text and extract structured information. Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
          {
            "name": "Full name of the person",
            "email": "email@example.com",
            "phone": "phone number",
            "location": "city, state/country",
            "linkedin": "linkedin URL or empty string",
            "website": "website URL or empty string",
            "summary": "professional summary or objective",
            "experience": [
              {
                "title": "job title",
                "company": "company name",
                "years": "employment period (e.g., '2020 - 2022')",
                "description": "brief role description",
                "achievements": ["achievement 1", "achievement 2"]
              }
            ],
            "skills": ["skill1", "skill2", "skill3"],
            "education": "education details",
            "projects": [
              {
                "name": "project name",
                "description": "project description",
                "technologies": ["tech1", "tech2"],
                "link": "project URL or empty string"
              }
            ],
            "certifications": ["certification1", "certification2"]
          }

          Resume text to parse:
          ${extractedText}
        `;

        const parseResult = await model.generateContent(parsePrompt);
        const parsedText = parseResult.response.text();
        
        // Clean up the response to extract JSON
        let jsonText = parsedText.trim();
        
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Try to find JSON object in the response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredData = JSON.parse(jsonMatch[0]);
          console.log("Successfully parsed resume data with AI");
        } else {
          throw new Error("Could not find valid JSON in AI response");
        }
      } else {
        throw new Error("Insufficient text extracted for AI parsing");
      }
    } catch (error) {
      console.error("Error parsing resume with AI:", error);
      // Fallback structured data with extracted text
      structuredData = {
        name: "Please update your name",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
        summary: extractedText.length > 100 ? extractedText.substring(0, 500) + "..." : "Please add your professional summary",
        experience: [],
        skills: [],
        education: "",
        projects: [],
        certifications: []
      };
    }

    // Return the processed resume data without saving to database
    // The client will store this locally in browser storage
    const processedResume = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate a local ID
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
          originalName: file.name,
          size: file.size,
          type: file.type,
          extractedText: extractedText.substring(0, 1000) // Store first 1000 chars for reference
        }
      },
      isLocal: true // Flag to indicate this is stored locally, not in database
    };

    console.log("Processed resume data (will be stored locally):", {
      ...processedResume,
      data: { ...processedResume.data, summary: processedResume.data.summary?.substring(0, 100) + "..." }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Resume processed successfully - stored locally in browser",
        resume: processedResume,
        extractedText: extractedText.substring(0, 500) + "...", // Preview of extracted text
        instructions: "This resume is stored locally in your browser. Use 'Save to Account' to persist it to your account."
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