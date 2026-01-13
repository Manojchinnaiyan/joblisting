'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Trash2, Columns, Rows, ChevronRight, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CoverLetterEditor } from '@/components/cover-letter-builder/cover-letter-editor'
import { CoverLetterSettingsPanel } from '@/components/cover-letter-builder/cover-letter-settings-panel'
import { CoverLetterPreview } from '@/components/cover-letter-builder/cover-letter-preview'
import { ResizablePanel } from '@/components/ui/resizable-panel'
import { useAuthStore } from '@/store/auth-store'
import type { CoverLetterData, CoverLetterSettings } from '@/types/cover-letter'
import { DEFAULT_COVER_LETTER_DATA, DEFAULT_COVER_LETTER_SETTINGS } from '@/types/cover-letter'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

const STORAGE_KEY = 'cover-letter-builder-data'
const SETTINGS_KEY = 'cover-letter-builder-settings'
const LAYOUT_KEY = 'cover-letter-builder-layout'

export default function CoverLetterBuilderPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<CoverLetterData>(DEFAULT_COVER_LETTER_DATA)
  const [previewData, setPreviewData] = useState<CoverLetterData>(DEFAULT_COVER_LETTER_DATA)
  const [settings, setSettings] = useState<CoverLetterSettings>(DEFAULT_COVER_LETTER_SETTINGS)
  const [previewSettings, setPreviewSettings] = useState<CoverLetterSettings>(DEFAULT_COVER_LETTER_SETTINGS)
  const [activeTab, setActiveTab] = useState('edit')
  const [isHydrated, setIsHydrated] = useState(false)
  const [useSideBySide, setUseSideBySide] = useState(false)
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Track last synced version
  const lastSyncedDataRef = useRef<string>(JSON.stringify(data))
  const lastSyncedSettingsRef = useRef<string>(JSON.stringify(settings))

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    const savedLayout = localStorage.getItem(LAYOUT_KEY)

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setData(parsed)
        setPreviewData(parsed)
      } catch {
        console.error('Failed to parse saved cover letter data')
      }
    }

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        setPreviewSettings(parsedSettings)
      } catch {
        console.error('Failed to parse saved cover letter settings')
      }
    }

    if (savedLayout) {
      setUseSideBySide(savedLayout === 'side-by-side')
    }

    setIsHydrated(true)
  }, [])

  // Pre-fill user info if available and data is empty
  useEffect(() => {
    if (isHydrated && user && !data.senderName) {
      const newData = {
        ...data,
        senderName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        senderEmail: user.email || '',
      }
      setData(newData)
      setPreviewData(newData)
    }
  }, [isHydrated, user, data.senderName])

  // Auto-save to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    }
  }, [settings, isHydrated])

  // Track when editor data changes (mark as unsynced)
  useEffect(() => {
    if (isHydrated) {
      const currentData = JSON.stringify(data)
      const currentSettings = JSON.stringify(settings)

      if (currentData !== lastSyncedDataRef.current || currentSettings !== lastSyncedSettingsRef.current) {
        setHasUnsyncedChanges(true)
      }
    }
  }, [data, settings, isHydrated])

  // Sync preview with editor data
  const syncPreview = () => {
    setPreviewData({ ...data })
    setPreviewSettings({ ...settings })
    lastSyncedDataRef.current = JSON.stringify(data)
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
      setPreviewData({ ...data })
      setPreviewSettings({ ...settings })
      lastSyncedDataRef.current = JSON.stringify(data)
      lastSyncedSettingsRef.current = JSON.stringify(settings)
      setHasUnsyncedChanges(false)
    }
  }

  // Check if cover letter has any meaningful data
  const hasCoverLetterData = data.senderName !== '' ||
                              data.companyName !== '' ||
                              data.openingParagraph !== ''

  // Handle clear button click
  const handleClearClick = () => {
    if (hasCoverLetterData) {
      setShowClearConfirm(true)
    } else {
      clearCoverLetterData()
    }
  }

  // Clear all cover letter data
  const clearCoverLetterData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SETTINGS_KEY)
    const emptyData = {
      ...DEFAULT_COVER_LETTER_DATA,
      senderName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
      senderEmail: user?.email || '',
    }
    setData(emptyData)
    setPreviewData(emptyData)
    setSettings(DEFAULT_COVER_LETTER_SETTINGS)
    setPreviewSettings(DEFAULT_COVER_LETTER_SETTINGS)
    setHasUnsyncedChanges(false)
    setShowClearConfirm(false)
    toast.success('Cover letter cleared!')
  }, [user])

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
          <h1 className="text-2xl sm:text-3xl font-bold">Cover Letter Builder</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Create a professional cover letter
          </p>
        </div>
        {hasCoverLetterData && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleClearClick} variant="outline" size="sm" className="text-destructive hover:text-destructive flex-1 sm:flex-none">
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Clear</span>
              <span className="xs:hidden">Clear</span>
            </Button>
          </div>
        )}
      </div>

      {/* Info Card - show if no data */}
      {!hasCoverLetterData && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Get Started</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Fill in the form below to create your cover letter. Your information will be auto-saved.
              </p>
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
        <div className="hidden lg:block h-[calc(100vh-280px)] min-h-[600px] border rounded-lg overflow-hidden">
          <ResizablePanel
            storageKey="cover-letter-builder-panel-width"
            defaultLeftWidth={55}
            minLeftWidth={35}
            maxLeftWidth={70}
            leftPanel={
              <div className="h-full flex flex-col bg-background">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <CoverLetterSettingsPanel settings={settings} onChange={setSettings} />
                  <CoverLetterEditor data={data} onChange={setData} />
                </div>
                {/* Sync Button at bottom of left panel */}
                {hasUnsyncedChanges && (
                  <div className="shrink-0 border-t p-3 bg-muted/30">
                    <Button
                      onClick={syncPreview}
                      className="w-full"
                      size="sm"
                    >
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Apply Changes to Preview
                    </Button>
                  </div>
                )}
              </div>
            }
            rightPanel={
              <div className="h-full overflow-y-auto bg-muted/30 p-4">
                <CoverLetterPreview data={previewData} settings={previewSettings} />
              </div>
            }
          />
        </div>
      )}

      {/* Tab Layout (Mobile always, Desktop when side-by-side is disabled) */}
      <div className={cn(useSideBySide ? 'lg:hidden' : '')}>
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          // Sync preview data when switching to preview tab
          if (value === 'preview') {
            setPreviewData({ ...data })
            setPreviewSettings({ ...settings })
            lastSyncedDataRef.current = JSON.stringify(data)
            lastSyncedSettingsRef.current = JSON.stringify(settings)
            setHasUnsyncedChanges(false)
          }
        }} className="space-y-6">
          <TabsList>
            <TabsTrigger value="edit">Edit Cover Letter</TabsTrigger>
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
                  <CoverLetterSettingsPanel settings={settings} onChange={setSettings} />
                </div>
              </div>
              {/* Editor - main content */}
              <div className="lg:col-span-2 lg:order-1">
                <CoverLetterEditor data={data} onChange={setData} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <CoverLetterPreview data={previewData} settings={previewSettings} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear cover letter?"
        description="This will clear all your current cover letter data and reset the form. This action cannot be undone."
        confirmText="Clear"
        onConfirm={clearCoverLetterData}
      />
    </div>
  )
}
