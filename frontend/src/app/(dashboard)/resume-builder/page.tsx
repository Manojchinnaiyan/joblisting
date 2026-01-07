'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FileText, Trash2, Columns, Rows, ChevronRight, Save, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ResumeEditor } from '@/components/resume-builder/resume-editor'
import { ResumeSettingsPanel } from '@/components/resume-builder/resume-settings-panel'
import { ResumePreview } from '@/components/resume-builder/resume-preview'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { DEFAULT_RESUME_SETTINGS } from '@/types/resume-builder'
import { useProfile } from '@/hooks/use-profile'
import { useExperiences } from '@/hooks/use-experience'
import { useEducation } from '@/hooks/use-education'
import { useSkills } from '@/hooks/use-skills'
import { useCertifications } from '@/hooks/use-certifications'
import { usePortfolio } from '@/hooks/use-portfolio'
import { useUploadResume } from '@/hooks/use-resumes'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

const STORAGE_KEY = 'resume-builder-data'
const SETTINGS_KEY = 'resume-builder-settings'
const LAYOUT_KEY = 'resume-builder-layout'

function getEmptyResumeData(): ResumeData {
  return {
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      headline: '',
      summary: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
    },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
  }
}

export default function ResumeBuilderPage() {
  const [resumeData, setResumeData] = useState<ResumeData>(getEmptyResumeData())
  const [previewData, setPreviewData] = useState<ResumeData>(getEmptyResumeData())
  const [settings, setSettings] = useState<ResumeSettings>(DEFAULT_RESUME_SETTINGS)
  const [previewSettings, setPreviewSettings] = useState<ResumeSettings>(DEFAULT_RESUME_SETTINGS)
  const [activeTab, setActiveTab] = useState('edit')
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasAutoImported, setHasAutoImported] = useState(false)
  const [useSideBySide, setUseSideBySide] = useState(false)
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const autoImportAttempted = useRef(false)

  // Resume upload mutation
  const uploadResume = useUploadResume()

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: experiences = [], isLoading: expLoading } = useExperiences()
  const { data: educationList = [], isLoading: eduLoading } = useEducation()
  const { data: skills = [], isLoading: skillsLoading } = useSkills()
  const { data: certifications = [], isLoading: certLoading } = useCertifications()
  const { data: projects = [], isLoading: projLoading } = usePortfolio()

  const isLoading = profileLoading || expLoading || eduLoading || skillsLoading || certLoading || projLoading
  const allDataLoaded = !isLoading && profile

  // Build resume data from profile
  const buildResumeDataFromProfile = useCallback(() => {
    if (!profile) return null

    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')

    return {
      personalInfo: {
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: location,
        headline: profile.headline || '',
        summary: profile.bio || '',
        linkedinUrl: profile.linkedin_url || '',
        githubUrl: profile.github_url || '',
        portfolioUrl: profile.portfolio_url || '',
      },
      experience: experiences.map((exp: any) => ({
        id: exp.id,
        companyName: exp.company_name || '',
        title: exp.title || '',
        location: exp.location || '',
        startDate: exp.start_date ? exp.start_date.substring(0, 7) : '',
        endDate: exp.end_date ? exp.end_date.substring(0, 7) : '',
        isCurrent: exp.is_current || false,
        description: exp.description || '',
        achievements: exp.achievements || [],
      })),
      education: educationList.map((edu: any) => ({
        id: edu.id,
        institution: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.field_of_study || '',
        startDate: edu.start_date ? edu.start_date.substring(0, 7) : '',
        endDate: edu.end_date ? edu.end_date.substring(0, 7) : '',
        isCurrent: edu.is_current || false,
        grade: edu.grade || '',
        description: edu.description || '',
      })),
      skills: skills.map((skill: any) => ({
        id: skill.id,
        name: skill.name || '',
        level: skill.level || 'INTERMEDIATE',
      })),
      languages: [],
      certifications: certifications.map((cert: any) => ({
        id: cert.id,
        name: cert.name || '',
        issuingOrganization: cert.issuing_organization || '',
        issueDate: cert.issue_date ? cert.issue_date.substring(0, 7) : '',
        expiryDate: cert.expiry_date ? cert.expiry_date.substring(0, 7) : '',
        credentialId: cert.credential_id || '',
        credentialUrl: cert.credential_url || '',
      })),
      projects: projects.map((proj: any) => ({
        id: proj.id,
        title: proj.title || '',
        description: proj.description || '',
        technologies: proj.technologies || [],
        projectUrl: proj.project_url || '',
        sourceCodeUrl: proj.source_code_url || '',
      })),
    } as ResumeData
  }, [profile, experiences, educationList, skills, certifications, projects])

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    const savedLayout = localStorage.getItem(LAYOUT_KEY)

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        // Only use saved data if it has actual content
        if (parsed.personalInfo?.firstName || parsed.experience?.length > 0) {
          setResumeData(parsed)
          setPreviewData(parsed) // Sync preview data on load
          setHasAutoImported(true) // Don't auto-import if we have saved data
        }
      } catch (e) {
        console.error('Failed to parse saved resume data')
      }
    }

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        setPreviewSettings(parsedSettings) // Sync preview settings on load
      } catch (e) {
        console.error('Failed to parse saved settings')
      }
    }

    if (savedLayout) {
      setUseSideBySide(savedLayout === 'side-by-side')
    }

    setIsHydrated(true)
  }, [])

  // Auto-import from profile when data loads (only if no saved data exists)
  useEffect(() => {
    if (
      isHydrated &&
      allDataLoaded &&
      !hasAutoImported &&
      !autoImportAttempted.current
    ) {
      autoImportAttempted.current = true

      // Check if profile has meaningful data
      const hasProfileData = profile?.first_name ||
                            experiences.length > 0 ||
                            educationList.length > 0 ||
                            skills.length > 0

      if (hasProfileData) {
        const newData = buildResumeDataFromProfile()
        if (newData) {
          setResumeData(newData)
          setPreviewData(newData) // Sync preview data
          setHasAutoImported(true)
        }
      }
    }
  }, [isHydrated, allDataLoaded, hasAutoImported, profile, experiences, educationList, skills, buildResumeDataFromProfile])

  // Track when editor data changes (mark as unsynced)
  // Use refs to track last synced version
  const lastSyncedDataRef = useRef<string>(JSON.stringify(resumeData))
  const lastSyncedSettingsRef = useRef<string>(JSON.stringify(settings))

  useEffect(() => {
    if (isHydrated) {
      const currentData = JSON.stringify(resumeData)
      const currentSettings = JSON.stringify(settings)

      // Only update if different from last synced version
      if (currentData !== lastSyncedDataRef.current || currentSettings !== lastSyncedSettingsRef.current) {
        setHasUnsyncedChanges(true)
      }
    }
  }, [resumeData, settings, isHydrated])

  // Sync preview with editor data
  const syncPreview = () => {
    setPreviewData({ ...resumeData })
    setPreviewSettings({ ...settings })
    // Update refs to track what was synced
    lastSyncedDataRef.current = JSON.stringify(resumeData)
    lastSyncedSettingsRef.current = JSON.stringify(settings)
    setHasUnsyncedChanges(false)
    toast.success('Preview updated!')
  }

  // Toggle layout and save preference
  const toggleLayout = () => {
    const newLayout = !useSideBySide
    setUseSideBySide(newLayout)
    localStorage.setItem(LAYOUT_KEY, newLayout ? 'side-by-side' : 'tabs')
    if (newLayout) {
      // When switching to side-by-side, sync immediately
      setPreviewData({ ...resumeData })
      setPreviewSettings({ ...settings })
      lastSyncedDataRef.current = JSON.stringify(resumeData)
      lastSyncedSettingsRef.current = JSON.stringify(settings)
      setHasUnsyncedChanges(false)
    }
  }

  // Auto-save to localStorage when data changes
  useEffect(() => {
    if (isHydrated && hasAutoImported) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData))
    }
  }, [resumeData, isHydrated, hasAutoImported])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    }
  }, [settings, isHydrated])

  // Check if resume has any meaningful data
  const hasResumeData = resumeData.personalInfo.firstName !== '' ||
                        resumeData.experience.length > 0 ||
                        resumeData.education.length > 0

  // Handle clear button click - show confirmation if data exists
  const handleClearClick = () => {
    if (hasResumeData) {
      setShowClearConfirm(true)
    } else {
      clearResumeData()
    }
  }

  // Clear all resume data and start fresh
  const clearResumeData = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SETTINGS_KEY)
    const emptyData = getEmptyResumeData()
    setResumeData(emptyData)
    setPreviewData(emptyData)
    setSettings(DEFAULT_RESUME_SETTINGS)
    setPreviewSettings(DEFAULT_RESUME_SETTINGS)
    setHasAutoImported(false)
    setHasUnsyncedChanges(false)
    setShowClearConfirm(false)
    autoImportAttempted.current = false
    toast.success('Resume data cleared!')
  }

  // Save resume to database (My Resumes)
  const saveToMyResumes = async () => {
    // Validate that we have minimum data
    if (!resumeData.personalInfo.firstName && !resumeData.personalInfo.lastName) {
      toast.error('Please add at least your name before saving')
      return
    }

    setIsSaving(true)
    try {
      // Dynamically import pdf and ResumeDocument to generate PDF blob
      const { pdf } = await import('@react-pdf/renderer')
      const { ResumeDocument } = await import('@/components/resume-builder/templates')

      // Generate PDF blob
      const blob = await pdf(<ResumeDocument data={resumeData} settings={settings} />).toBlob()

      // Create a File from the blob
      const fileName = `${resumeData.personalInfo.firstName || 'My'}_${resumeData.personalInfo.lastName || 'Resume'}_Resume.pdf`
      const file = new File([blob], fileName, { type: 'application/pdf' })

      // Upload using the existing resume upload API
      const title = `${resumeData.personalInfo.firstName || ''} ${resumeData.personalInfo.lastName || ''} Resume`.trim() || 'My Resume'
      await uploadResume.mutateAsync({ file, title })

      toast.success('Resume saved to My Resumes! You can find it in the Resumes section.')
    } catch (error) {
      console.error('Failed to save resume:', error)
      toast.error('Failed to save resume. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isHydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Resume Builder</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Create a professional resume using your profile data
          </p>
        </div>
        {hasResumeData && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveToMyResumes}
              disabled={isSaving}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              <span className="hidden xs:inline">Save to My Resumes</span>
              <span className="xs:hidden">Save</span>
            </Button>
            <Button onClick={handleClearClick} variant="outline" size="sm" className="text-destructive hover:text-destructive flex-1 sm:flex-none">
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Clear</span>
              <span className="xs:hidden">Clear</span>
            </Button>
          </div>
        )}
      </div>

      {/* Info Card - only show if no data and still loading */}
      {!hasResumeData && isLoading && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 animate-spin" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Loading your profile...</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We&apos;re fetching your profile data to pre-fill your resume.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card - show if no data after loading */}
      {!hasResumeData && !isLoading && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Get Started</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Complete your profile to auto-fill your resume, or start fresh by filling in the form below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ATS Tips */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-green-900 dark:text-green-100 text-sm sm:text-base">ATS-Optimized Templates</p>
            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
              Our templates are designed for Applicant Tracking Systems. For best results:
            </p>
            <ul className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-2 list-disc list-inside space-y-1">
              <li>Use Professional or Minimal template for ATS compatibility</li>
              <li>Add bullet points with metrics (e.g., &quot;Increased sales by 25%&quot;)</li>
              <li>Include keywords from the job description</li>
              <li>Keep formatting simple</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Saved Resumes Link */}
      {hasResumeData && (
        <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Save className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-purple-900 dark:text-purple-100 text-sm sm:text-base">Save Your Resume</p>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 mt-1">
                Click &quot;Save to My Resumes&quot; to store this resume for later. You can access saved resumes when applying for jobs.
              </p>
              <Link
                href="/resumes"
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:underline mt-2"
              >
                View My Resumes
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Layout Toggle - visible on lg+ screens */}
      <div className="hidden lg:flex justify-end items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLayout}
                className="h-8 w-8"
              >
                {useSideBySide ? (
                  <Rows className="h-4 w-4" />
                ) : (
                  <Columns className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {useSideBySide ? 'Switch to tab view' : 'Switch to side-by-side view'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Side-by-Side Layout (Desktop only when enabled) */}
      {useSideBySide && (
        <div className="hidden lg:grid lg:grid-cols-[1fr,auto,1fr] xl:grid-cols-[55%,auto,45%] gap-2 h-[calc(100vh-280px)] min-h-[600px]">
          {/* Left Panel - Editor & Settings */}
          <div className="flex flex-col min-w-0 overflow-hidden bg-background rounded-lg border">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <ResumeSettingsPanel settings={settings} onSettingsChange={setSettings} />
              <ResumeEditor data={resumeData} onDataChange={setResumeData} />
            </div>
          </div>

          {/* Center - Sync Button */}
          <div className="flex flex-col items-center justify-center px-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasUnsyncedChanges ? 'default' : 'outline'}
                    size="icon"
                    onClick={syncPreview}
                    className={cn(
                      'h-10 w-10 rounded-full transition-all',
                      hasUnsyncedChanges && 'animate-pulse shadow-lg'
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {hasUnsyncedChanges ? 'Apply changes to preview' : 'Preview is up to date'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {hasUnsyncedChanges && (
              <p className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                Sync
              </p>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <ResumePreview data={previewData} settings={previewSettings} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Layout (Mobile always, Desktop when side-by-side is disabled) */}
      <div className={cn(useSideBySide ? 'lg:hidden' : '')}>
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          // Sync preview data when switching to preview tab
          if (value === 'preview') {
            setPreviewData({ ...resumeData })
            setPreviewSettings({ ...settings })
            lastSyncedDataRef.current = JSON.stringify(resumeData)
            lastSyncedSettingsRef.current = JSON.stringify(settings)
            setHasUnsyncedChanges(false)
          }
        }} className="space-y-6">
          <TabsList>
            <TabsTrigger value="edit">Edit Resume</TabsTrigger>
            <TabsTrigger value="preview" className="relative">
              Preview & Download
              {hasUnsyncedChanges && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Settings Panel - show first on mobile for easy access */}
              <div className="lg:col-span-1 lg:order-2">
                <div className="lg:sticky lg:top-6">
                  <ResumeSettingsPanel settings={settings} onSettingsChange={setSettings} />
                </div>
              </div>
              {/* Editor - main content */}
              <div className="lg:col-span-2 lg:order-1">
                <ResumeEditor data={resumeData} onDataChange={setResumeData} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <ResumePreview data={previewData} settings={previewSettings} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear all resume data?"
        description="This will clear all your current resume data and reset the form. This action cannot be undone."
        confirmText="Clear Data"
        onConfirm={clearResumeData}
      />
    </div>
  )
}
