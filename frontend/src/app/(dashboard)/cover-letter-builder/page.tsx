'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { FileText, Settings, Eye, Trash2, Download, PanelLeftClose, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'
import { CoverLetterEditor } from '@/components/cover-letter-builder/cover-letter-editor'
import { CoverLetterSettingsPanel } from '@/components/cover-letter-builder/cover-letter-settings-panel'
import { CoverLetterPreview } from '@/components/cover-letter-builder/cover-letter-preview'
import { useAuthStore } from '@/store/auth-store'
import type { CoverLetterData, CoverLetterSettings } from '@/types/cover-letter'
import { DEFAULT_COVER_LETTER_DATA, DEFAULT_COVER_LETTER_SETTINGS } from '@/types/cover-letter'

const STORAGE_KEY = 'cover-letter-builder-data'
const SETTINGS_KEY = 'cover-letter-builder-settings'

export default function CoverLetterBuilderPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<CoverLetterData>(DEFAULT_COVER_LETTER_DATA)
  const [settings, setSettings] = useState<CoverLetterSettings>(DEFAULT_COVER_LETTER_SETTINGS)
  const [showPreview, setShowPreview] = useState(true)
  const [activeTab, setActiveTab] = useState('edit')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    const savedSettings = localStorage.getItem(SETTINGS_KEY)

    if (savedData) {
      try {
        setData(JSON.parse(savedData))
      } catch {
        console.error('Failed to parse saved cover letter data')
      }
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch {
        console.error('Failed to parse saved cover letter settings')
      }
    }

    setIsLoaded(true)
  }, [])

  // Pre-fill user info if available and data is empty
  useEffect(() => {
    if (isLoaded && user && !data.senderName) {
      setData((prev) => ({
        ...prev,
        senderName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        senderEmail: user.email || '',
      }))
    }
  }, [isLoaded, user, data.senderName])

  // Auto-save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  const handleClearData = useCallback(() => {
    setData({
      ...DEFAULT_COVER_LETTER_DATA,
      senderName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
      senderEmail: user?.email || '',
    })
    localStorage.removeItem(STORAGE_KEY)
    toast.success('Cover letter cleared')
  }, [user])

  if (!isLoaded) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Cover Letter Builder</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Create a professional cover letter
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Settings Sheet (Mobile) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <CoverLetterSettingsPanel settings={settings} onChange={setSettings} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Toggle Preview (Desktop) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden lg:flex"
          >
            {showPreview ? (
              <>
                <PanelLeftClose className="mr-2 h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <PanelLeft className="mr-2 h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>

          {/* Clear Data */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear cover letter?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all content from your cover letter. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile View - Tabs */}
        <div className="flex-1 lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
              <TabsTrigger value="edit">
                <FileText className="mr-2 h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="flex-1 overflow-auto p-4">
              <CoverLetterEditor data={data} onChange={setData} />
              <div className="mt-6 rounded-lg border bg-card p-4">
                <h3 className="font-medium mb-4">Settings</h3>
                <CoverLetterSettingsPanel settings={settings} onChange={setSettings} />
              </div>
            </TabsContent>
            <TabsContent value="preview" className="flex-1 overflow-hidden">
              <CoverLetterPreview data={data} settings={settings} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop View - Side by Side */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          {/* Editor Panel */}
          <div className="flex flex-col w-1/2 border-r overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
              <CoverLetterEditor data={data} onChange={setData} />
            </div>
          </div>

          {/* Settings + Preview Panel */}
          {showPreview && (
            <div className="flex flex-col w-1/2 overflow-hidden">
              {/* Settings Bar */}
              <div className="border-b p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Settings</span>
                </div>
                <CoverLetterSettingsPanel settings={settings} onChange={setSettings} />
              </div>
              {/* Preview */}
              <div className="flex-1 overflow-hidden">
                <CoverLetterPreview data={data} settings={settings} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
