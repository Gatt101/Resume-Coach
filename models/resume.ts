
import { Schema, model, models } from "mongoose";

// Define the uploaded file schema separately
const uploadedFileSchema = new Schema({
    originalName: { type: String, required: false },
    size: { type: Number, required: false },
    type: { type: String, required: false },
    extractedText: { type: String, required: false }
}, { _id: false });

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
            layout: String,
            uploadedFile: { type: uploadedFileSchema, required: false }
        }
    },
    { timestamps: true }
)

const Resume = models.Resume || model("Resume", resumeSchema);

export default Resume;
