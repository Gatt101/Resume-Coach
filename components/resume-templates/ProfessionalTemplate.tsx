import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react"
import { sanitizeResumeData } from "./utils"

interface ProfessionalTemplateProps {
  data: any
}

export function ProfessionalTemplate({ data }: ProfessionalTemplateProps) {
  const safeData = sanitizeResumeData(data)

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-800 shadow-xl border-t-8 border-blue-600">
      {/* Header */}
      <div className="p-8 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="text-center border-b border-blue-200 pb-6">
          <h1 className="text-4xl font-bold text-blue-800 mb-3">{safeData.name}</h1>
          <div className="flex justify-center gap-6 text-blue-600 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>{safeData.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{safeData.phone}</span>
            </div>
            {safeData.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{safeData.location}</span>
              </div>
            )}
            {safeData.linkedin && (
              <div className="flex items-center gap-1">
                <Linkedin className="w-4 h-4" />
                <span className="text-xs">{safeData.linkedin}</span>
              </div>
            )}
            {safeData.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span className="text-xs">{safeData.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Professional Summary */}
        <section>
          <h2 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 uppercase tracking-wide">
            EXECUTIVE SUMMARY
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300">
            {safeData.summary}
          </p>
        </section>

        {/* Professional Experience */}
        {safeData.experience.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-6 uppercase tracking-wide">
              PROFESSIONAL EXPERIENCE
            </h2>
            <div className="space-y-6">
              {safeData.experience.map((exp, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-800">{exp.title}</h3>
                      <p className="text-blue-600 font-medium text-lg">{exp.company}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-600 text-white">{exp.years}</Badge>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 leading-relaxed">{exp.description}</p>
                  {exp.achievements.length > 0 && (
                    <div className="ml-4">
                      <h4 className="text-sm font-semibold text-blue-700 mb-2">Key Achievements:</h4>
                      <ul className="space-y-1">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-gray-600 text-sm flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">▶</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {index < safeData.experience.length - 1 && (
                    <div className="border-b border-blue-100 mt-6"></div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Core Competencies & Skills */}
        {safeData.skills.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 uppercase tracking-wide">
              CORE COMPETENCIES
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {safeData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 font-medium">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Notable Projects */}
        {safeData.projects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 uppercase tracking-wide">
              NOTABLE PROJECTS
            </h2>
            <div className="space-y-4">
              {safeData.projects.map((project, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-blue-800">{project.name}</h3>
                    {project.link && (
                      <a 
                        href={project.link} 
                        className="text-blue-600 text-sm hover:underline"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View Project
                      </a>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education & Certifications */}
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 uppercase tracking-wide">
              EDUCATION
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">{safeData.education}</p>
            </div>
          </section>

          {safeData.certifications.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 uppercase tracking-wide">
                CERTIFICATIONS
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {safeData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <span className="text-gray-700 text-sm font-medium">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
