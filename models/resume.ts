
import { Schema, model, models } from "mongoose";

const resumeSchema = new Schema(
    {
        userId: { type: String, required: true }, // Store Clerk user ID as string
        title: { type: String, required: true },
        template: { type: String, required: true, default: 'modern' },
        data: {
            name: String,
            email: String,
            phone: String,
            location: String,
            linkedin: String,
            website: String,
            summary: String,
            experience: [{
                title: String,
                company: String,
                years: String,
                description: String,
                achievements: [String]
            }],
            skills: [String],
            education: String,
            projects: [{
                name: String,
                description: String,
                technologies: [String],
                link: String
            }],
            certifications: [String]
        },
        metadata: {
            generatedAt: String,
            targetRole: String,
            experienceLevel: String,
            colorScheme: String,
            layout: String
        }
    },
    { timestamps: true }
)

const Resume = models.Resume || model("Resume", resumeSchema);

export default Resume;
