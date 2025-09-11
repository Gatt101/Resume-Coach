import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react"
import { sanitizeResumeData } from "./utils"

interface ModernTemplateProps {
  data: any
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const safeData = sanitizeResumeData(data)

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-800 shadow-lg">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <h1 className="text-4xl font-bold mb-2">{safeData.name}</h1>
        <div className="flex flex-wrap gap-4 text-blue-100">
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{safeData.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            <span className="text-sm">{safeData.phone}</span>
          </div>
          {safeData.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{safeData.location}</span>
            </div>
          )}
          {safeData.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">{safeData.linkedin}</span>
            </div>
          )}
          {safeData.website && (
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span className="text-sm">{safeData.website}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Professional Summary */}
        <section>
          <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{safeData.summary}</p>
        </section>

        {/* Experience */}
        {safeData.experience.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {safeData.experience.map((exp, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{exp.title}</h3>
                      <p className="text-blue-600 font-medium">{exp.company}</p>
                    </div>
                    <Badge variant="outline" className="text-gray-600">{exp.years}</Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{exp.description}</p>
                  {exp.achievements.length > 0 && (
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
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
          <section>
            <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              Core Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {safeData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {safeData.projects.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              Notable Projects
            </h2>
            <div className="grid gap-4">
              {safeData.projects.map((project, index) => (
                <Card key={index} className="border-l-4 border-l-blue-400">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
                    <p className="text-gray-700 mb-3">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.link && (
                      <a 
                        href={project.link} 
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View Project →
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Education & Certifications */}
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              Education
            </h2>
            <p className="text-gray-700">{safeData.education}</p>
          </section>

          {safeData.certifications.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
                Certifications
              </h2>
              <ul className="space-y-2">
                {safeData.certifications.map((cert, index) => (
                  <li key={index} className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    {cert}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
