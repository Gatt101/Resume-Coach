import z from "zod";

const ResumeSchema = z.object({
  name: z.string().describe("Full name of the candidate"),
  email: z.string().email().describe("Professional email address"),
  phone: z.string().describe("Contact phone number"),
  location: z.string().describe("Current location (city, state/country)"),
  linkedin: z.string().optional().describe("LinkedIn profile URL"),
  website: z.string().optional().describe("Personal website or portfolio URL"),
  summary: z.string().describe("Professional summary highlighting key strengths and career objectives"),
  experience: z.array(z.object({
    title: z.string().describe("Job title"),
    company: z.string().describe("Company name"),
    years: z.string().describe("Employment duration (e.g., '2020 - 2022')"),
    description: z.string().describe("Brief role description"),
    achievements: z.array(z.string()).describe("Key accomplishments and quantified results")
  })).describe("Work experience in reverse chronological order"),
  skills: z.array(z.string()).optional().describe("Technical and professional skills"),
  education: z.string().optional().describe("Educational background"),
  projects: z.array(z.object({
    name: z.string().describe("Project name"),
    description: z.string().describe("Project description"),
    technologies: z.array(z.string()).describe("Technologies used"),
    link: z.string().optional().describe("Project link or URL")
  })).optional().describe("Notable projects"),
  certifications: z.array(z.string()).optional().describe("Professional certifications")
});

export default ResumeSchema;