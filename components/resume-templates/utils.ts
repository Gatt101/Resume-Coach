// Utility function to safely process resume data for templates
export interface SafeResumeData {
  name: string
  email: string
  phone: string
  location?: string
  linkedin?: string
  website?: string
  summary: string
  experience: Array<{
    title: string
    company: string
    years: string
    description: string
    achievements: string[]
  }>
  skills: string[]
  education: string
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    link?: string
  }>
  certifications: string[]
}

export function sanitizeResumeData(data: any): SafeResumeData {
  return {
    name: data?.name || "Professional Name",
    email: data?.email || "email@example.com",
    phone: data?.phone || "Phone Number",
    location: data?.location,
    linkedin: data?.linkedin,
    website: data?.website,
    summary: data?.summary || "Professional summary not available",
    experience: Array.isArray(data?.experience) ? data.experience.map((exp: any) => ({
      title: exp?.title || "Job Title",
      company: exp?.company || "Company",
      years: exp?.years || "Years",
      description: exp?.description || "Job description",
      achievements: Array.isArray(exp?.achievements) ? exp.achievements : []
    })) : [],
    skills: Array.isArray(data?.skills) ? data.skills : [],
    education: data?.education || "Education information not available",
    projects: Array.isArray(data?.projects) ? data.projects.map((proj: any) => ({
      name: proj?.name || "Project Name",
      description: proj?.description || "Project description",
      technologies: Array.isArray(proj?.technologies) ? proj.technologies : [],
      link: proj?.link
    })) : [],
    certifications: Array.isArray(data?.certifications) ? data.certifications : []
  }
}
