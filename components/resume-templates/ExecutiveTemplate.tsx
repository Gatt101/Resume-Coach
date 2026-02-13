import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react"
import { sanitizeResumeData } from "./utils"

interface ExecutiveTemplateProps {
  data: unknown
}

export function ExecutiveTemplate({ data }: ExecutiveTemplateProps) {
  const safeData = sanitizeResumeData(data)

  return (
    <div className="max-w-5xl mx-auto bg-white text-gray-900 shadow-lg">
      <header className="bg-slate-900 text-white px-8 py-7">
        <h1 className="text-4xl font-bold tracking-tight">{safeData.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-200">
          <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" />{safeData.email}</span>
          <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" />{safeData.phone}</span>
          {safeData.location && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{safeData.location}</span>}
          {safeData.linkedin && <span className="inline-flex items-center gap-1"><Linkedin className="w-4 h-4" />{safeData.linkedin}</span>}
          {safeData.website && <span className="inline-flex items-center gap-1"><Globe className="w-4 h-4" />{safeData.website}</span>}
        </div>
      </header>

      <div className="grid md:grid-cols-[2fr_1fr] gap-8 p-8">
        <main className="space-y-7">
          <section>
            <h2 className="text-lg font-semibold border-b border-slate-200 pb-2 mb-3">Executive Summary</h2>
            <p className="text-sm leading-6 text-gray-800">{safeData.summary}</p>
          </section>

          {safeData.experience.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold border-b border-slate-200 pb-2 mb-3">Professional Experience</h2>
              <div className="space-y-5">
                {safeData.experience.map((exp, index) => (
                  <div key={index}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">{exp.title}</h3>
                        <p className="text-sm text-slate-600">{exp.company}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{exp.years}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                    {exp.achievements.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
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

          {safeData.projects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold border-b border-slate-200 pb-2 mb-3">Key Projects</h2>
              <div className="space-y-4">
                {safeData.projects.map((project, index) => (
                  <div key={index}>
                    <h3 className="text-base font-semibold">{project.name}</h3>
                    <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <p className="text-xs text-slate-600 mt-1">{project.technologies.join(" • ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Core Skills</h2>
            <div className="flex flex-wrap gap-2">
              {safeData.skills.slice(0, 18).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Education</h2>
            <p className="text-sm text-gray-800">{safeData.education}</p>
          </section>

          {safeData.certifications.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Certifications</h2>
              <ul className="text-sm text-gray-800 space-y-1 list-disc pl-5">
                {safeData.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
