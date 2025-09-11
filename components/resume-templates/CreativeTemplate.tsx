import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Globe, Linkedin, Star } from "lucide-react"
import { sanitizeResumeData } from "./utils"

interface CreativeTemplateProps {
  data: any
}

export function CreativeTemplate({ data }: CreativeTemplateProps) {
  const safeData = sanitizeResumeData(data)

  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-2xl">
      <div className="flex flex-col lg:flex-row min-h-[800px]">
        {/* Left Sidebar */}
        <div className="lg:w-1/3 bg-gradient-to-b from-purple-600 to-indigo-700 text-black p-6 lg:p-8">
          <div className="space-y-8">
            {/* Profile */}
            <div className="text-center">
              <div className="w-32 h-32 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl font-bold text-black">
                  {safeData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{safeData.name}</h1>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider border-b border-white/30 pb-2 mb-4">
                Contact
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="break-all">{safeData.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{safeData.phone}</span>
                </div>
                {safeData.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{safeData.location}</span>
                  </div>
                )}
                {safeData.linkedin && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs break-all">{safeData.linkedin}</span>
                  </div>
                )}
                {safeData.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs break-all">{safeData.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {safeData.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold uppercase tracking-wider border-b border-white/30 pb-2 mb-4">
                  Skills
                </h3>
                <div className="space-y-3">
                  {safeData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Star className="w-3 h-3 fill-yellow-300 text-yellow-300 flex-shrink-0" />
                      <span className="text-sm">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {safeData.certifications.length > 0 && (
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wider border-b border-white/30 pb-2 mb-4">
                  Certifications
                </h3>
                <div className="space-y-2">
                  {safeData.certifications.map((cert, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-yellow-300">●</span> {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:w-2/3 p-6 lg:p-8 space-y-8">
          {/* Professional Summary */}
          <section>
          <div className="mb-6">
    <h2 className="text-2xl lg:text-3xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-4 py-2 px-4 rounded-t-lg">
      About Me
    </h2>
    <div className="h-1 w-20 bg-blue-600 mb-4"></div>
    <p className="leading-relaxed text-justify bg-white/80 p-4 rounded-lg shadow-sm text-gray-800">
      {safeData.summary}
    </p>
  </div>
</section>

          {/* Experience */}
          {safeData.experience.length > 0 && (
            <section>
              <h2 className="text-2xl  lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
                Experience
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-6"></div>
              <div className="space-y-6">
                {safeData.experience.map((exp, index) => (
                  <div key={index} className="relative bg-white/60 p-6 rounded-xl shadow-sm border-l-4 border-purple-400">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold  text-gray-800 ">{exp.title}</h3>
                        <p className=" font-semibold text-lg  text-gray-800">{exp.company}</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-gray-700 mt-2 lg:mt-0">
                        {exp.years}
                      </Badge>
                    </div>
                    <p className="mb-4 leading-relaxed text-gray-800">{exp.description}</p>
                    {exp.achievements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Key Achievements:</h4>
                        <ul className="space-y-2">
                          {exp.achievements.map((achievement, idx) => (
                            <li key={idx} className="text-gray-600 flex items-start ">
                              <span className="text-purple-500 mr-2 mt-1 text-lg">◆</span>
                              <span className="text-sm">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {safeData.projects.length > 0 && (
            <section>
              <h2 className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
                Featured Projects
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-6"></div>
              <div className="grid gap-6 lg:grid-cols-2">
                {safeData.projects.map((project, index) => (
                  <div key={index} className="bg-white/60 p-6 rounded-xl shadow-sm border-t-4 border-indigo-400">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                      {project.link && (
                        <a 
                          href={project.link} 
                          className="text-purple-600 text-sm hover:underline"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View →
                        </a>
                      )}
                    </div>
                    <p className=" text-sm mb-4  text-gray-800">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200 text-purple-700"
                          >
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

          {/* Education */}
          <section>
            <h2 className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
              Education
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-6"></div>
            <div className="bg-white/60 p-6 rounded-xl shadow-sm">
              <p className="text-gray-800 font-medium">{safeData.education}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
