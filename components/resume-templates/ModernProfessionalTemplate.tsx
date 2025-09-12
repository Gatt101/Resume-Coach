"use client";

import React from 'react';

interface ModernProfessionalTemplateProps {
  data: any;
}

export function ModernProfessionalTemplate({ data }: ModernProfessionalTemplateProps) {
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg" style={{ fontFamily: 'Times, serif' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {data.name || 'Your Name'}
        </h1>
        <div className="text-sm text-gray-600 space-x-2">
          {data.phone && <span>{data.phone}</span>}
          {data.phone && data.email && <span>|</span>}
          {data.email && <span>{data.email}</span>}
          {(data.phone || data.email) && (data.linkedin || data.website) && <span>|</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
          {data.linkedin && data.website && <span>|</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>

      {/* Professional Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
            PROFESSIONAL SUMMARY
          </h2>
          <p className="text-sm text-gray-800 leading-relaxed text-justify">
            {data.summary}
          </p>
        </div>
      )}

      {/* Education */}
      {data.education && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
            EDUCATION
          </h2>
          <div className="text-sm text-gray-800">
            {typeof data.education === 'string' ? (
              <p>{data.education}</p>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{data.education.institution || 'Institution Name'}</p>
                    <p className="italic">{data.education.degree || 'Degree'}</p>
                  </div>
                  <div className="text-right">
                    <p>{data.education.location || 'Location'}</p>
                    <p className="italic">{data.education.period || 'Period'}</p>
                  </div>
                </div>
                {data.education.gpa && (
                  <p className="mt-1">GPA: {data.education.gpa}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
            EXPERIENCE
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-900">{exp.title || 'Job Title'}</h3>
                    <p className="italic text-gray-800">{exp.company || 'Company Name'}</p>
                  </div>
                  <div className="text-right">
                    <p className="italic text-gray-800">{exp.years || 'Period'}</p>
                    <p className="text-gray-600 text-xs">{exp.location || ''}</p>
                  </div>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-800 mb-2">{exp.description}</p>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="text-sm text-gray-800 space-y-1">
                    {exp.achievements.map((achievement: string, achIndex: number) => (
                      <li key={achIndex} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
            PROJECTS
          </h2>
          <div className="space-y-3">
            {data.projects.map((project: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">
                    {project.name || 'Project Name'}
                    {project.technologies && project.technologies.length > 0 && (
                      <span className="font-normal italic text-gray-700">
                        {' | '}{project.technologies.join(', ')}
                      </span>
                    )}
                  </h3>
                  <p className="italic text-gray-800">{project.date || 'Date'}</p>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-800 mt-1">{project.description}</p>
                )}
                {project.achievements && project.achievements.length > 0 && (
                  <ul className="text-sm text-gray-800 mt-1 space-y-1">
                    {project.achievements.map((achievement: string, achIndex: number) => (
                      <li key={achIndex} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {project.link && (
                  <p className="text-sm text-blue-600 mt-1">{project.link}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
            TECHNICAL SKILLS
          </h2>
          <div className="text-sm text-gray-800">
            {typeof data.skills === 'object' && data.skills.languages ? (
              <div className="space-y-2">
                {data.skills.languages && (
                  <div>
                    <span className="font-semibold">Languages: </span>
                    <span>{Array.isArray(data.skills.languages) ? data.skills.languages.join(', ') : data.skills.languages}</span>
                  </div>
                )}
                {data.skills.frameworks && (
                  <div>
                    <span className="font-semibold">Frameworks: </span>
                    <span>{Array.isArray(data.skills.frameworks) ? data.skills.frameworks.join(', ') : data.skills.frameworks}</span>
                  </div>
                )}
                {data.skills.tools && (
                  <div>
                    <span className="font-semibold">Developer Tools: </span>
                    <span>{Array.isArray(data.skills.tools) ? data.skills.tools.join(', ') : data.skills.tools}</span>
                  </div>
                )}
                {data.skills.libraries && (
                  <div>
                    <span className="font-semibold">Libraries: </span>
                    <span>{Array.isArray(data.skills.libraries) ? data.skills.libraries.join(', ') : data.skills.libraries}</span>
                  </div>
                )}
              </div>
            ) : (
              <p>{Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}</p>
            )}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
            CERTIFICATIONS
          </h2>
          <ul className="text-sm text-gray-800 space-y-1">
            {data.certifications.map((cert: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievements & Leadership */}
      {data.achievements && data.achievements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
            ACHIEVEMENTS & LEADERSHIP
          </h2>
          <ul className="text-sm text-gray-800 space-y-1">
            {data.achievements.map((achievement: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}