"use server";

import Resume from "@/models/resume";
import { connect } from "@/lib/mongoose";

export async function CreateResume(userId: string, resumeData: any, template: string = 'modern') 
{
    await connect();
    
    // Generate a title based on resume data
    const title = resumeData.name ? `${resumeData.name}'s Resume` : 'My Resume';
    
    const newResume = new Resume
    ({ 
        userId, 
        title,
        template,
        data: resumeData,
        metadata: resumeData.metadata || {}
    });
    
    await newResume.save();
    return newResume;
}

export async function UpdateResume(userId: string, resumeId: string, resumeData: any, template?: string) {
    await connect();
    
    const updateData: any = { data: resumeData };
    if (template) updateData.template = template;
    if (resumeData.metadata) updateData.metadata = resumeData.metadata;
    
    const updatedResume = await Resume.findOneAndUpdate(
        { userId, _id: resumeId }, 
        updateData, 
        { new: true }
    );
    return updatedResume;
}

export async function DeleteResume(userId: string, resumeId: string) {
    await connect();

    await Resume.findOneAndDelete({ userId, _id: resumeId });
}

export async function GetUserResumes(userId: string) {
    await connect();

    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });
    return resumes;
}

export async function GetResumeById(resumeId: string) {
  await connect();
  const resume = await Resume.findById(resumeId);
  return resume;
}
