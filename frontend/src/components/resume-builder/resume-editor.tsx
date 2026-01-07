'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type {
  ResumeData,
  ResumeExperience,
  ResumeEducation,
  ResumeSkill,
  ResumeLanguage,
  ResumeCertification,
  ResumeProject,
} from '@/types/resume-builder'
import { MonthYearPicker } from './month-year-picker'
import { TagInput } from './tag-input'
import { RichTextarea } from './rich-textarea'
import { SortableList } from './sortable-list'

interface ResumeEditorProps {
  data: ResumeData
  onDataChange: (data: ResumeData) => void
}

export function ResumeEditor({ data, onDataChange }: ResumeEditorProps) {
  const [openSections, setOpenSections] = useState<string[]>(['personal', 'experience'])

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  const updatePersonalInfo = (field: string, value: string) => {
    onDataChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value },
    })
  }

  // Experience handlers
  const addExperience = () => {
    const newExp: ResumeExperience = {
      id: crypto.randomUUID(),
      companyName: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      achievements: [],
    }
    onDataChange({ ...data, experience: [...data.experience, newExp] })
  }

  const updateExperience = (id: string, updates: Partial<ResumeExperience>) => {
    onDataChange({
      ...data,
      experience: data.experience.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
    })
  }

  const removeExperience = (id: string) => {
    onDataChange({
      ...data,
      experience: data.experience.filter((exp) => exp.id !== id),
    })
  }

  const reorderExperience = (items: ResumeExperience[]) => {
    onDataChange({ ...data, experience: items })
  }

  // Education handlers
  const addEducation = () => {
    const newEdu: ResumeEducation = {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      grade: '',
    }
    onDataChange({ ...data, education: [...data.education, newEdu] })
  }

  const updateEducation = (id: string, updates: Partial<ResumeEducation>) => {
    onDataChange({
      ...data,
      education: data.education.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)),
    })
  }

  const removeEducation = (id: string) => {
    onDataChange({
      ...data,
      education: data.education.filter((edu) => edu.id !== id),
    })
  }

  const reorderEducation = (items: ResumeEducation[]) => {
    onDataChange({ ...data, education: items })
  }

  // Skills handlers
  const addSkill = () => {
    const newSkill: ResumeSkill = {
      id: crypto.randomUUID(),
      name: '',
      level: 'INTERMEDIATE',
    }
    onDataChange({ ...data, skills: [...data.skills, newSkill] })
  }

  const updateSkill = (id: string, updates: Partial<ResumeSkill>) => {
    onDataChange({
      ...data,
      skills: data.skills.map((skill) => (skill.id === id ? { ...skill, ...updates } : skill)),
    })
  }

  const removeSkill = (id: string) => {
    onDataChange({
      ...data,
      skills: data.skills.filter((skill) => skill.id !== id),
    })
  }

  const reorderSkills = (items: ResumeSkill[]) => {
    onDataChange({ ...data, skills: items })
  }

  // Language handlers
  const addLanguage = () => {
    const newLanguage: ResumeLanguage = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: 'PROFESSIONAL',
    }
    onDataChange({ ...data, languages: [...(data.languages || []), newLanguage] })
  }

  const updateLanguage = (id: string, updates: Partial<ResumeLanguage>) => {
    onDataChange({
      ...data,
      languages: (data.languages || []).map((lang) => (lang.id === id ? { ...lang, ...updates } : lang)),
    })
  }

  const removeLanguage = (id: string) => {
    onDataChange({
      ...data,
      languages: (data.languages || []).filter((lang) => lang.id !== id),
    })
  }

  const reorderLanguages = (items: ResumeLanguage[]) => {
    onDataChange({ ...data, languages: items })
  }

  // Certification handlers
  const addCertification = () => {
    const newCert: ResumeCertification = {
      id: crypto.randomUUID(),
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
    }
    onDataChange({ ...data, certifications: [...data.certifications, newCert] })
  }

  const updateCertification = (id: string, updates: Partial<ResumeCertification>) => {
    onDataChange({
      ...data,
      certifications: data.certifications.map((cert) =>
        cert.id === id ? { ...cert, ...updates } : cert
      ),
    })
  }

  const removeCertification = (id: string) => {
    onDataChange({
      ...data,
      certifications: data.certifications.filter((cert) => cert.id !== id),
    })
  }

  const reorderCertifications = (items: ResumeCertification[]) => {
    onDataChange({ ...data, certifications: items })
  }

  // Project handlers
  const addProject = () => {
    const newProject: ResumeProject = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      technologies: [],
      projectUrl: '',
    }
    onDataChange({ ...data, projects: [...data.projects, newProject] })
  }

  const updateProject = (id: string, updates: Partial<ResumeProject>) => {
    onDataChange({
      ...data,
      projects: data.projects.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj)),
    })
  }

  const removeProject = (id: string) => {
    onDataChange({
      ...data,
      projects: data.projects.filter((proj) => proj.id !== id),
    })
  }

  const reorderProjects = (items: ResumeProject[]) => {
    onDataChange({ ...data, projects: items })
  }

  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <Collapsible open={openSections.includes('personal')} onOpenChange={() => toggleSection('personal')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg">
                Personal Information
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={data.personalInfo.firstName}
                    onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={data.personalInfo.lastName}
                    onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={data.personalInfo.email}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={data.personalInfo.phone || ''}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={data.personalInfo.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label>Professional Headline</Label>
                <Input
                  value={data.personalInfo.headline || ''}
                  onChange={(e) => updatePersonalInfo('headline', e.target.value)}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Professional Summary</Label>
                <RichTextarea
                  value={data.personalInfo.summary || ''}
                  onChange={(value) => updatePersonalInfo('summary', value)}
                  placeholder="Results-driven Software Engineer with 5+ years of experience in building scalable web applications..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Include years of experience, key skills, and notable achievements. Keep to 2-3 sentences.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={data.personalInfo.linkedinUrl || ''}
                    onChange={(e) => updatePersonalInfo('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GitHub URL</Label>
                  <Input
                    value={data.personalInfo.githubUrl || ''}
                    onChange={(e) => updatePersonalInfo('githubUrl', e.target.value)}
                    placeholder="https://github.com/johndoe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Portfolio URL</Label>
                <Input
                  value={data.personalInfo.portfolioUrl || ''}
                  onChange={(e) => updatePersonalInfo('portfolioUrl', e.target.value)}
                  placeholder="https://johndoe.com"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Experience */}
      <Collapsible open={openSections.includes('experience')} onOpenChange={() => toggleSection('experience')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg">
                Work Experience ({data.experience.length})
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SortableList items={data.experience} onReorder={reorderExperience}>
                {(exp, index) => (
                  <div className="p-4 pl-10 border rounded-lg space-y-4 mb-4 bg-background">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Position {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Job Title</Label>
                        <Input
                          value={exp.title}
                          onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input
                          value={exp.companyName}
                          onChange={(e) => updateExperience(exp.id, { companyName: e.target.value })}
                          placeholder="Google"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={exp.location || ''}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                        placeholder="Mountain View, CA"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <MonthYearPicker
                          value={exp.startDate}
                          onChange={(value) => updateExperience(exp.id, { startDate: value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <MonthYearPicker
                          value={exp.endDate || ''}
                          onChange={(value) => updateExperience(exp.id, { endDate: value })}
                          disabled={exp.isCurrent}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`current-${exp.id}`}
                        checked={exp.isCurrent}
                        onCheckedChange={(checked) =>
                          updateExperience(exp.id, { isCurrent: checked as boolean, endDate: checked ? '' : exp.endDate })
                        }
                      />
                      <Label htmlFor={`current-${exp.id}`} className="text-sm">
                        I currently work here
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Role Description</Label>
                      <RichTextarea
                        value={exp.description || ''}
                        onChange={(value) => updateExperience(exp.id, { description: value })}
                        placeholder="Brief overview of your role and responsibilities..."
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Keep this brief - use bullet points below for specific achievements
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Key Achievements (Bullet Points)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Add 3-5 quantifiable achievements. Use metrics like &quot;Increased X by Y%&quot; or &quot;Reduced Z by N%&quot;
                      </p>
                      <TagInput
                        value={exp.achievements || []}
                        onChange={(value) => updateExperience(exp.id, { achievements: value })}
                        placeholder="e.g., Increased sales by 25%, Led team of 5 engineers"
                      />
                    </div>
                  </div>
                )}
              </SortableList>
              <Button variant="outline" onClick={addExperience} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Experience
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Education */}
      <Collapsible open={openSections.includes('education')} onOpenChange={() => toggleSection('education')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg">
                Education ({data.education.length})
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SortableList items={data.education} onReorder={reorderEducation}>
                {(edu, index) => (
                  <div className="p-4 pl-10 border rounded-lg space-y-4 mb-4 bg-background">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Education {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(edu.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                        placeholder="Stanford University"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                          placeholder="Bachelor of Science"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field of Study</Label>
                        <Input
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEducation(edu.id, { fieldOfStudy: e.target.value })}
                          placeholder="Computer Science"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <MonthYearPicker
                          value={edu.startDate}
                          onChange={(value) => updateEducation(edu.id, { startDate: value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <MonthYearPicker
                          value={edu.endDate || ''}
                          onChange={(value) => updateEducation(edu.id, { endDate: value })}
                          disabled={edu.isCurrent}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`current-edu-${edu.id}`}
                        checked={edu.isCurrent}
                        onCheckedChange={(checked) =>
                          updateEducation(edu.id, { isCurrent: checked as boolean, endDate: checked ? '' : edu.endDate })
                        }
                      />
                      <Label htmlFor={`current-edu-${edu.id}`} className="text-sm">
                        Currently studying here
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Grade / GPA</Label>
                      <Input
                        value={edu.grade || ''}
                        onChange={(e) => updateEducation(edu.id, { grade: e.target.value })}
                        placeholder="3.8 GPA"
                      />
                    </div>
                  </div>
                )}
              </SortableList>
              <Button variant="outline" onClick={addEducation} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Education
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Skills */}
      <Collapsible open={openSections.includes('skills')} onOpenChange={() => toggleSection('skills')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg">
                Skills ({data.skills.length})
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SortableList items={data.skills} onReorder={reorderSkills}>
                {(skill) => (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pl-8 mb-3 sm:mb-2">
                    <Input
                      value={skill.name}
                      onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                      placeholder="JavaScript"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Select
                        value={skill.level}
                        onValueChange={(value) => updateSkill(skill.id, { level: value as ResumeSkill['level'] })}
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="EXPERT">Expert</SelectItem>
                      </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => removeSkill(skill.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </SortableList>
              <Button variant="outline" onClick={addSkill} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Skill
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Languages */}
      <Collapsible open={openSections.includes('languages')} onOpenChange={() => toggleSection('languages')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg">
                Languages ({(data.languages || []).length})
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SortableList items={data.languages || []} onReorder={reorderLanguages}>
                {(language) => (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pl-8 mb-3 sm:mb-2">
                    <Input
                      value={language.name}
                      onChange={(e) => updateLanguage(language.id, { name: e.target.value })}
                      placeholder="English"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Select
                        value={language.proficiency}
                        onValueChange={(value) => updateLanguage(language.id, { proficiency: value as ResumeLanguage['proficiency'] })}
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASIC">Basic</SelectItem>
                          <SelectItem value="CONVERSATIONAL">Conversational</SelectItem>
                          <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                          <SelectItem value="FLUENT">Fluent</SelectItem>
                          <SelectItem value="NATIVE">Native</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => removeLanguage(language.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </SortableList>
              <Button variant="outline" onClick={addLanguage} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Language
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Certifications */}
      <Collapsible open={openSections.includes('certifications')} onOpenChange={() => toggleSection('certifications')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg">
                Certifications ({data.certifications.length})
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SortableList items={data.certifications} onReorder={reorderCertifications}>
                {(cert, index) => (
                  <div className="p-4 pl-10 border rounded-lg space-y-4 mb-4 bg-background">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Certification {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertification(cert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Certification Name</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                        placeholder="AWS Solutions Architect"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuing Organization</Label>
                      <Input
                        value={cert.issuingOrganization}
                        onChange={(e) => updateCertification(cert.id, { issuingOrganization: e.target.value })}
                        placeholder="Amazon Web Services"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <MonthYearPicker
                          value={cert.issueDate}
                          onChange={(value) => updateCertification(cert.id, { issueDate: value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Credential ID (Optional)</Label>
                        <Input
                          value={cert.credentialId || ''}
                          onChange={(e) => updateCertification(cert.id, { credentialId: e.target.value })}
                          placeholder="ABC123XYZ"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </SortableList>
              <Button variant="outline" onClick={addCertification} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Certification
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Projects */}
      <Collapsible open={openSections.includes('projects')} onOpenChange={() => toggleSection('projects')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg">
                Projects ({data.projects.length})
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SortableList items={data.projects} onReorder={reorderProjects}>
                {(project, index) => (
                  <div className="p-4 pl-10 border rounded-lg space-y-4 mb-4 bg-background">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Project {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input
                        value={project.title}
                        onChange={(e) => updateProject(project.id, { title: e.target.value })}
                        placeholder="E-commerce Platform"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <RichTextarea
                        value={project.description}
                        onChange={(value) => updateProject(project.id, { description: value })}
                        placeholder="Built a scalable e-commerce platform handling 10K+ daily transactions..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Highlight the impact and scale of the project with specific metrics
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Technologies Used</Label>
                      <TagInput
                        value={project.technologies || []}
                        onChange={(value) => updateProject(project.id, { technologies: value })}
                        placeholder="React, Node.js, PostgreSQL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project URL (Optional)</Label>
                      <Input
                        value={project.projectUrl || ''}
                        onChange={(e) => updateProject(project.id, { projectUrl: e.target.value })}
                        placeholder="https://myproject.com"
                      />
                    </div>
                  </div>
                )}
              </SortableList>
              <Button variant="outline" onClick={addProject} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
