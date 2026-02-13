import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react"
import { sanitizeResumeData } from "./utils"

interface MinimalTemplateProps {
  data: unknown
}

export function MinimalTemplate({ data }: MinimalTemplateProps) {
  const safeData = sanitizeResumeData(data)

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 shadow-lg p-10">
      <header className="border-b border-gray-300 pb-6 mb-6">
        <h1 className="text-4xl font-semibold tracking-tight">{safeData.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" />{safeData.email}</span>
          <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" />{safeData.phone}</span>
          {safeData.location && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{safeData.location}</span>}
          {safeData.linkedin && <span className="inline-flex items-center gap-1"><Linkedin className="w-4 h-4" />{safeData.linkedin}</span>}
          {safeData.website && <span className="inline-flex items-center gap-1"><Globe className="w-4 h-4" />{safeData.website}</span>}
        </div>
      </header>

      <section className="mb-6">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-2">Summary</h2>
        <p className="text-sm leading-6 text-gray-800">{safeData.summary}</p>
      </section>

      {safeData.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-3">Experience</h2>
          <div className="space-y-5">
            {safeData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{exp.title}</h3>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                  </div>
                  <span className="text-xs text-gray-500">{exp.years}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
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

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-2">Skills</h2>
          <p className="text-sm text-gray-800">{safeData.skills.join(", ") || "Not provided"}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-2">Education</h2>
          <p className="text-sm text-gray-800">{safeData.education}</p>
        </div>
      </section>
    </div>
  )
}
