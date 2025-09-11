import { Badge } from "@/components/ui/badge"

interface ResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
  summary?: string
  experience?: Array<{
    title?: string
    company?: string
    years?: string
    description?: string
    achievements?: string[]
  }>
  skills?: string[]
  education?: string
  projects?: Array<{
    name?: string
    description?: string
    technologies?: string[]
    link?: string
  }>
  certifications?: string[]
}

interface ClassicTemplateProps {
  data: ResumeData
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  // Safe data access with defaults
  const safeData = {
    name: data?.name || "Professional Name",
    email: data?.email || "email@example.com",
    phone: data?.phone || "Phone Number",
    location: data?.location,
    linkedin: data?.linkedin,
    website: data?.website,
    summary: data?.summary || "Professional summary not available",
    experience: Array.isArray(data?.experience) ? data.experience : [],
    skills: Array.isArray(data?.skills) ? data.skills : [],
    education: data?.education || "Education information not available",
    projects: Array.isArray(data?.projects) ? data.projects : [],
    certifications: Array.isArray(data?.certifications) ? data.certifications : []
  }

  return (
  <div className="max-w-4xl mx-auto bg-gray-800 text-gray-900 font-serif p-8 shadow-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">{safeData.name}</h1>
        <div className="text-sm space-y-1 text-gray-700">
          <p className="text-gray-700">{safeData.email} • {safeData.phone}</p>
          {safeData.location && <p className="text-gray-700">{safeData.location}</p>}
          {(safeData.linkedin || safeData.website) && (
            <p>
              {safeData.linkedin && <span className="text-gray-700">{safeData.linkedin}</span>}
              {safeData.linkedin && safeData.website && " • "}
              {safeData.website && <span className="text-gray-700">{safeData.website}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      <section className="mb-6">
  <h2 className="text-lg font-bold mb-2 uppercase tracking-wide border-b border-gray-300 text-gray-900">
          Professional Summary
        </h2>
  <p className="text-justify leading-relaxed text-gray-700">{safeData.summary}</p>
      </section>

      {/* Experience */}
      {safeData.experience.length > 0 && (
        <section className="mb-6">
  <h2 className="text-lg font-bold mb-2 uppercase tracking-wide border-b border-gray-300 text-gray-900">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {safeData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900">{exp.title || "Job Title"}</h3>
                  <span className="text-sm font-medium text-gray-700">{exp.years || "Years"}</span>
                </div>
                <p className="font-medium mb-2 text-gray-800">{exp.company || "Company"}</p>
                <p className="text-sm mb-2 text-gray-700">{exp.description || "Job description"}</p>
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4 text-gray-700">
                    {exp.achievements.map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {safeData.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2 uppercase tracking-wide border-b border-gray-300 text-gray-900">
            Skills & Competencies
          </h2>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {safeData.skills.map((skill, index) => (
                <span key={index} className="text-gray-700">• {skill}</span>
              ))}
            </div>
        </section>
      )}

      {/* Projects */}
      {safeData.projects.length > 0 && (
        <section className="mb-6">
  <h2 className="text-lg font-bold mb-2 uppercase tracking-wide border-b border-gray-300 text-gray-900">
            Notable Projects
          </h2>
          <div className="space-y-3">
            {safeData.projects.map((project, index) => (
              <div key={index}>
                <h3 className="font-bold text-gray-900">{project.name || "Project Name"}</h3>
                <p className="text-sm mb-1 text-gray-700">{project.description || "Project description"}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-xs text-gray-700">
                    Technologies: {project.technologies.join(", ")}
                  </p>
                )}
                {project.link && (
                  <p className="text-xs text-gray-700">{project.link}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      <section className="mb-6">
  <h2 className="text-lg font-bold mb-2 uppercase tracking-wide border-b border-gray-300 text-gray-900">
          Education
        </h2>
  <p className="text-gray-700">{safeData.education}</p>
      </section>

      {/* Certifications */}
      {safeData.certifications.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-2 uppercase tracking-wide border-b border-gray-300 text-gray-900">
            Certifications
          </h2>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
            {safeData.certifications.map((cert, index) => (
              <li key={index}>{cert}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
