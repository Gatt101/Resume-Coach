import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Resume from "@/models/resume";
import { connect } from "@/lib/mongoose";

export async function GET(){
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Connect to database
    await connect();

    // Fetch user's resumes
    const resumes = await Resume.find({ userId });
    return new Response(
      JSON.stringify({ resumes }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Save resume error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error while saving resume" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
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

    // Parse the resume data from the request body
    const body = await req.json();
    const { resumeData } = body;

    if (!resumeData) {
      return new Response(
        JSON.stringify({ error: "No resume data provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate that this is a local resume
    if (!resumeData.isLocal) {
      return new Response(
        JSON.stringify({ error: "Resume is not a local resume" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Connect to database
    await connect();

    // Prepare the resume data for database storage
    const dbResumeData = {
      userId,
      title: resumeData.title,
      template: resumeData.template,
      data: resumeData.data,
      metadata: {
        ...resumeData.metadata,
        savedAt: new Date().toISOString(),
        originallyLocal: true
      }
    };

    // Remove the local-specific fields
    delete dbResumeData.metadata.isLocal;

    console.log("Saving local resume to database:", {
      title: dbResumeData.title,
      template: dbResumeData.template,
      userId: dbResumeData.userId
    });

    // Create and save the resume
    const newResume = new Resume(dbResumeData);
    const savedResume = await newResume.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Resume saved to your account successfully",
        resume: savedResume
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Save resume error:", error);
    
    // Handle specific MongoDB validation errors
    if (error instanceof Error && error.message.includes('validation failed')) {
      return new Response(
        JSON.stringify({ 
          error: "Data validation failed",
          details: error.message,
          suggestion: "Please check the resume data and try again"
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error while saving resume",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
