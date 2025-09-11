"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, User, Briefcase, Mail, Phone, MapPin, Globe, Linkedin, GraduationCap, Award, Code } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import ResumeSchema from "@/models/ResumeSchema"
import { z } from "zod"

type ResumeData = z.infer<typeof ResumeSchema>

interface ManualResumeFormProps {
  onSubmit: (data: ResumeData) => void
  onCancel?: () => void
  initialData?: Partial<ResumeData>
}

export default function ManualResumeForm({ onSubmit, onCancel, initialData }: ManualResumeFormProps) {
  const [formData, setFormData] = useState<ResumeData>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    location: initialData?.location ?? "",
    linkedin: initialData?.linkedin ?? "",
    website: initialData?.website ?? "",
    summary: initialData?.summary ?? "",
    experience: Array.isArray(initialData?.experience) && initialData.experience.length > 0 
      ? initialData.experience.map(exp => ({
          title: exp?.title ?? "",
          company: exp?.company ?? "",
          years: exp?.years ?? "",
          description: exp?.description ?? "",
          achievements: Array.isArray(exp?.achievements) ? exp.achievements.filter(ach => ach) : [""]
        }))
      : [{
          title: "",
          company: "",
          years: "",
          description: "",
          achievements: [""]
        }],
    skills: Array.isArray(initialData?.skills) ? initialData.skills.filter(skill => skill) : [],
    education: initialData?.education ?? "",
    projects: Array.isArray(initialData?.projects) 
      ? initialData.projects.map(proj => ({
          name: proj?.name ?? "",
          description: proj?.description ?? "",
          technologies: Array.isArray(proj?.technologies) ? proj.technologies.filter(tech => tech) : [""],
          link: proj?.link ?? ""
        }))
      : [],
    certifications: Array.isArray(initialData?.certifications) ? initialData.certifications.filter(cert => cert) : []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle input changes for basic fields
  const handleInputChange = (field: keyof Omit<ResumeData, 'experience' | 'skills' | 'projects' | 'certifications'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  // Handle array field changes (skills, certifications)
  const handleArrayChange = (field: 'skills' | 'certifications', index: number, value: string) => {
    const currentArray = formData[field] || []
    const updatedArray = [...currentArray]
    
    // If array is empty, initialize it
    if (updatedArray.length === 0) {
      updatedArray.push("")
    }
    
    updatedArray[index] = value
    setFormData(prev => ({
      ...prev,
      [field]: updatedArray
    }))
  }

  // Add item to array fields
  const addArrayItem = (field: 'skills' | 'certifications') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), ""]
    }))
  }

  // Remove item from array fields
  const removeArrayItem = (field: 'skills' | 'certifications', index: number) => {
    const currentArray = formData[field] || []
    if (currentArray.length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: currentArray.filter((_, i) => i !== index)
      }))
    }
  }

  // Handle project changes
  const handleProjectChange = (index: number, field: keyof NonNullable<ResumeData['projects']>[0], value: string) => {
    const currentProjects = formData.projects || []
    const updatedProjects = [...currentProjects]
    
    // If array is empty, initialize it
    if (updatedProjects.length === 0) {
      updatedProjects.push({name: "", description: "", technologies: [""], link: ""})
    }
    
    if (field === 'technologies') {
      return
    }
    updatedProjects[index] = {
      ...updatedProjects[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      projects: updatedProjects
    }))
  }

  // Handle project technology changes
  const handleProjectTechChange = (projectIndex: number, techIndex: number, value: string) => {
    const currentProjects = formData.projects || []
    const updatedProjects = [...currentProjects]
    
    // If array is empty, initialize it
    if (updatedProjects.length === 0) {
      updatedProjects.push({name: "", description: "", technologies: [""], link: ""})
    }
    
    const updatedTechnologies = [...updatedProjects[projectIndex].technologies]
    updatedTechnologies[techIndex] = value
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      technologies: updatedTechnologies
    }
    setFormData(prev => ({
      ...prev,
      projects: updatedProjects
    }))
  }

  // Add new project
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), {
        name: "",
        description: "",
        technologies: [""],
        link: ""
      }]
    }))
  }

  // Remove project
  const removeProject = (index: number) => {
    const currentProjects = formData.projects || []
    if (currentProjects.length > 1) {
      setFormData(prev => ({
        ...prev,
        projects: currentProjects.filter((_, i) => i !== index)
      }))
    }
  }

  // Add technology to specific project
  const addProjectTech = (projectIndex: number) => {
    const updatedProjects = [...(formData.projects || [])]
    updatedProjects[projectIndex].technologies.push("")
    setFormData(prev => ({
      ...prev,
      projects: updatedProjects
    }))
  }

  // Remove technology from specific project
  const removeProjectTech = (projectIndex: number, techIndex: number) => {
    const updatedProjects = [...(formData.projects || [])]
    if (updatedProjects[projectIndex].technologies.length > 1) {
      updatedProjects[projectIndex].technologies = updatedProjects[projectIndex].technologies.filter((_, i) => i !== techIndex)
      setFormData(prev => ({
        ...prev,
        projects: updatedProjects
      }))
    }
  }

  // Handle experience changes
  const handleExperienceChange = (index: number, field: keyof ResumeData['experience'][0], value: string) => {
    const updatedExperience = [...formData.experience]
    if (field === 'achievements') {
      // Handle achievements array separately
      return
    }
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      experience: updatedExperience
    }))
  }

  // Handle achievement changes
  const handleAchievementChange = (expIndex: number, achIndex: number, value: string) => {
    const updatedExperience = [...formData.experience]
    const updatedAchievements = [...updatedExperience[expIndex].achievements]
    updatedAchievements[achIndex] = value
    updatedExperience[expIndex] = {
      ...updatedExperience[expIndex],
      achievements: updatedAchievements
    }
    setFormData(prev => ({
      ...prev,
      experience: updatedExperience
    }))
  }

  // Add new experience
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: "",
        company: "",
        years: "",
        description: "",
        achievements: [""]
      }]
    }))
  }

  // Remove experience
  const removeExperience = (index: number) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index)
      }))
    }
  }

  // Add achievement to specific experience
  const addAchievement = (expIndex: number) => {
    const updatedExperience = [...formData.experience]
    updatedExperience[expIndex].achievements.push("")
    setFormData(prev => ({
      ...prev,
      experience: updatedExperience
    }))
  }

  // Remove achievement from specific experience
  const removeAchievement = (expIndex: number, achIndex: number) => {
    const updatedExperience = [...formData.experience]
    if (updatedExperience[expIndex].achievements.length > 1) {
      updatedExperience[expIndex].achievements = updatedExperience[expIndex].achievements.filter((_, i) => i !== achIndex)
      setFormData(prev => ({
        ...prev,
        experience: updatedExperience
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Basic validation checks with null safety
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = "Email is required"
    }
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = "Phone is required" 
    }
    if (!formData.location || !formData.location.trim()) {
      newErrors.location = "Location is required"
    }
    if (!formData.summary || !formData.summary.trim()) {
      newErrors.summary = "Professional summary is required"
    }

    // Check if at least one experience entry is filled
    const hasValidExperience = formData.experience?.some(exp => 
      exp.title?.trim() && exp.company?.trim() && exp.years?.trim() && exp.description?.trim()
    )
    if (!hasValidExperience) {
      newErrors.experience = "At least one work experience entry is required with all fields filled"
    }

    try {
      // Prepare data for schema validation with null safety
      const dataToValidate = {
        ...formData,
        name: formData.name ?? "",
        email: formData.email ?? "",
        phone: formData.phone ?? "",
        location: formData.location ?? "",
        linkedin: formData.linkedin ?? "",
        website: formData.website ?? "",
        summary: formData.summary ?? "",
        education: formData.education ?? "",
        skills: formData.skills?.filter((skill: string) => skill && skill.trim() !== "") || [],
        certifications: formData.certifications?.filter((cert: string) => cert && cert.trim() !== "") || [],
        projects: formData.projects?.filter((proj: any) => proj && (proj.name?.trim() || proj.description?.trim())) || []
      }
      
      ResumeSchema.parse(dataToValidate)
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return false
      }
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((issue) => {
          const path = issue.path.join('.')
          newErrors[path] = issue.message
        })
      }
      setErrors(newErrors)
      return false
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Clean up the data before submitting
      const cleanedData = {
        ...formData,
        // Filter out empty strings from arrays
        skills: formData.skills?.filter(skill => skill.trim() !== "") || [],
        certifications: formData.certifications?.filter(cert => cert.trim() !== "") || [],
        // Ensure experience has achievements as arrays and filter empty ones
        experience: formData.experience.map(exp => ({
          ...exp,
          achievements: exp.achievements?.filter(ach => ach.trim() !== "") || []
        })),
        // Clean up projects
        projects: formData.projects?.map(proj => ({
          ...proj,
          technologies: proj.technologies?.filter(tech => tech.trim() !== "") || []
        })).filter(proj => proj.name.trim() !== "" || proj.description.trim() !== "") || []
      }
      onSubmit(cleanedData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-1">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john.doe@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="New York, NY"
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            <div>
              <Label htmlFor="linkedin" className="flex items-center gap-1">
                <Linkedin className="w-4 h-4" />
                LinkedIn (Optional)
              </Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div>
              <Label htmlFor="website" className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Website (Optional)
              </Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://johndoe.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="summary" className="flex items-center gap-1">
            Summary <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            placeholder="A brief professional summary highlighting your key strengths, experience, and career objectives..."
            className={`min-h-[100px] ${errors.summary ? "border-red-500" : ""}`}
          />
          {errors.summary && <p className="text-red-500 text-sm mt-1">{errors.summary}</p>}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </div>
            <Button type="button" onClick={addExperience} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Experience
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.experience.map((exp, expIndex) => (
            <div key={expIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Experience #{expIndex + 1}</h4>
                {formData.experience.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeExperience(expIndex)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`title-${expIndex}`}>Job Title <span className="text-red-500">*</span></Label>
                  <Input
                    id={`title-${expIndex}`}
                    value={exp.title}
                    onChange={(e) => handleExperienceChange(expIndex, 'title', e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor={`company-${expIndex}`}>Company <span className="text-red-500">*</span></Label>
                  <Input
                    id={`company-${expIndex}`}
                    value={exp.company}
                    onChange={(e) => handleExperienceChange(expIndex, 'company', e.target.value)}
                    placeholder="Tech Corp"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`years-${expIndex}`}>Duration <span className="text-red-500">*</span></Label>
                  <Input
                    id={`years-${expIndex}`}
                    value={exp.years}
                    onChange={(e) => handleExperienceChange(expIndex, 'years', e.target.value)}
                    placeholder="2020 - 2023"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`description-${expIndex}`}>Role Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    id={`description-${expIndex}`}
                    value={exp.description}
                    onChange={(e) => handleExperienceChange(expIndex, 'description', e.target.value)}
                    placeholder="Brief description of your role and responsibilities..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Key Achievements <span className="text-red-500">*</span></Label>
                  <Button
                    type="button"
                    onClick={() => addAchievement(expIndex)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Achievement
                  </Button>
                </div>
                <div className="space-y-2">
                  {exp.achievements.map((achievement, achIndex) => (
                    <div key={achIndex} className="flex gap-2">
                      <Input
                        value={achievement}
                        onChange={(e) => handleAchievementChange(expIndex, achIndex, e.target.value)}
                        placeholder="Increased team productivity by 25% through implementation of agile methodologies"
                        className="flex-1"
                      />
                      {exp.achievements.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeAchievement(expIndex, achIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {expIndex < formData.experience.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Skills (Optional)
            </div>
            <Button type="button" onClick={() => addArrayItem('skills')} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Skill
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(formData.skills && formData.skills.length > 0 ? formData.skills : [""]).map((skill, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={skill}
                onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                placeholder="JavaScript, React, Node.js, etc."
                className="flex-1"
              />
              {(formData.skills && formData.skills.length > 0 ? formData.skills.length : 1) > 1 && (
                <Button
                  type="button"
                  onClick={() => removeArrayItem('skills', index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="education">Educational Background</Label>
          <Textarea
            id="education"
            value={formData.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
            placeholder="Bachelor of Science in Computer Science, University of Technology (2018-2022)"
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Projects (Optional)
            </div>
            <Button type="button" onClick={addProject} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Project
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(formData.projects && formData.projects.length > 0 ? formData.projects : [{name: "", description: "", technologies: [""], link: ""}]).map((project, projectIndex) => (
            <div key={projectIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Project #{projectIndex + 1}</h4>
                {(formData.projects && formData.projects.length > 0 ? formData.projects.length : 1) > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeProject(projectIndex)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`project-name-${projectIndex}`}>Project Name</Label>
                  <Input
                    id={`project-name-${projectIndex}`}
                    value={project.name}
                    onChange={(e) => handleProjectChange(projectIndex, 'name', e.target.value)}
                    placeholder="E-commerce Website"
                  />
                </div>

                <div>
                  <Label htmlFor={`project-link-${projectIndex}`}>Project Link (Optional)</Label>
                  <Input
                    id={`project-link-${projectIndex}`}
                    value={project.link || ""}
                    onChange={(e) => handleProjectChange(projectIndex, 'link', e.target.value)}
                    placeholder="https://github.com/username/project"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`project-description-${projectIndex}`}>Project Description</Label>
                  <Textarea
                    id={`project-description-${projectIndex}`}
                    value={project.description}
                    onChange={(e) => handleProjectChange(projectIndex, 'description', e.target.value)}
                    placeholder="Brief description of the project and your role..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Technologies */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Technologies Used</Label>
                  <Button
                    type="button"
                    onClick={() => addProjectTech(projectIndex)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Technology
                  </Button>
                </div>
                <div className="space-y-2">
                  {project.technologies.map((tech, techIndex) => (
                    <div key={techIndex} className="flex gap-2">
                      <Input
                        value={tech}
                        onChange={(e) => handleProjectTechChange(projectIndex, techIndex, e.target.value)}
                        placeholder="React, Node.js, MongoDB, etc."
                        className="flex-1"
                      />
                      {project.technologies.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeProjectTech(projectIndex, techIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {projectIndex < (formData.projects && formData.projects.length > 0 ? formData.projects.length : 1) - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications (Optional)
            </div>
            <Button type="button" onClick={() => addArrayItem('certifications')} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Certification
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(formData.certifications && formData.certifications.length > 0 ? formData.certifications : [""]).map((cert, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={cert}
                onChange={(e) => handleArrayChange('certifications', index, e.target.value)}
                placeholder="AWS Certified Solutions Architect, Google Cloud Professional, etc."
                className="flex-1"
              />
              {(formData.certifications && formData.certifications.length > 0 ? formData.certifications.length : 1) > 1 && (
                <Button
                  type="button"
                  onClick={() => removeArrayItem('certifications', index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Create Resume
          </Button>
        </div>
      </div>

      {/* Display validation errors */}
      {Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
            <ul className="text-red-600 text-sm space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
