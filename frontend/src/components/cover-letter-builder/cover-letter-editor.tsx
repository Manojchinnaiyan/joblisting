'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { ChevronDown, Plus, Trash2, User, Building, FileText } from 'lucide-react'
import { useState } from 'react'
import type { CoverLetterData } from '@/types/cover-letter'
import { SALUTATION_OPTIONS, CLOSING_OPTIONS } from '@/types/cover-letter'

interface CoverLetterEditorProps {
  data: CoverLetterData
  onChange: (data: CoverLetterData) => void
}

export function CoverLetterEditor({ data, onChange }: CoverLetterEditorProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sender: true,
    recipient: true,
    content: true,
  })

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const updateField = <K extends keyof CoverLetterData>(
    field: K,
    value: CoverLetterData[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  const updateBodyParagraph = (index: number, value: string) => {
    const newParagraphs = [...data.bodyParagraphs]
    newParagraphs[index] = value
    updateField('bodyParagraphs', newParagraphs)
  }

  const addBodyParagraph = () => {
    updateField('bodyParagraphs', [...data.bodyParagraphs, ''])
  }

  const removeBodyParagraph = (index: number) => {
    if (data.bodyParagraphs.length > 1) {
      const newParagraphs = data.bodyParagraphs.filter((_, i) => i !== index)
      updateField('bodyParagraphs', newParagraphs)
    }
  }

  return (
    <div className="space-y-4">
      {/* Your Information */}
      <Collapsible open={openSections.sender} onOpenChange={() => toggleSection('sender')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">Your Information</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${openSections.sender ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 rounded-lg border bg-card p-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Full Name *</Label>
                <Input
                  id="senderName"
                  value={data.senderName}
                  onChange={(e) => updateField('senderName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">Email *</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  value={data.senderEmail}
                  onChange={(e) => updateField('senderEmail', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderPhone">Phone</Label>
                <Input
                  id="senderPhone"
                  value={data.senderPhone || ''}
                  onChange={(e) => updateField('senderPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderCity">City / Location</Label>
                <Input
                  id="senderCity"
                  value={data.senderCity || ''}
                  onChange={(e) => updateField('senderCity', e.target.value)}
                  placeholder="New York, NY"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderAddress">Street Address</Label>
              <Input
                id="senderAddress"
                value={data.senderAddress || ''}
                onChange={(e) => updateField('senderAddress', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  value={data.linkedinUrl || ''}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                <Input
                  id="portfolioUrl"
                  value={data.portfolioUrl || ''}
                  onChange={(e) => updateField('portfolioUrl', e.target.value)}
                  placeholder="https://johndoe.com"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Recipient Information */}
      <Collapsible open={openSections.recipient} onOpenChange={() => toggleSection('recipient')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <span className="font-medium">Recipient / Company</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${openSections.recipient ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 rounded-lg border bg-card p-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={data.recipientName || ''}
                  onChange={(e) => updateField('recipientName', e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientTitle">Recipient Title</Label>
                <Input
                  id="recipientTitle"
                  value={data.recipientTitle || ''}
                  onChange={(e) => updateField('recipientTitle', e.target.value)}
                  placeholder="Hiring Manager"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={data.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input
                id="companyAddress"
                value={data.companyAddress || ''}
                onChange={(e) => updateField('companyAddress', e.target.value)}
                placeholder="456 Business Ave, Suite 100"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Letter Content */}
      <Collapsible open={openSections.content} onOpenChange={() => toggleSection('content')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium">Letter Content</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${openSections.content ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 rounded-lg border bg-card p-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={data.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject / Position</Label>
                <Input
                  id="subject"
                  value={data.subject || ''}
                  onChange={(e) => updateField('subject', e.target.value)}
                  placeholder="Application for Software Engineer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salutation">Salutation</Label>
                <Select
                  value={data.salutation}
                  onValueChange={(value) => updateField('salutation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALUTATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing">Closing</Label>
                <Select
                  value={data.closing}
                  onValueChange={(value) => updateField('closing', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLOSING_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening">Opening Paragraph</Label>
              <Textarea
                id="opening"
                value={data.openingParagraph}
                onChange={(e) => updateField('openingParagraph', e.target.value)}
                placeholder="I am writing to express my interest in the [Position] role at [Company]..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Introduce yourself and state the position you&apos;re applying for
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Body Paragraphs</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBodyParagraph}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Paragraph
                </Button>
              </div>
              {data.bodyParagraphs.map((paragraph, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={paragraph}
                    onChange={(e) => updateBodyParagraph(index, e.target.value)}
                    placeholder={`Body paragraph ${index + 1} - Highlight your relevant experience and skills...`}
                    rows={3}
                    className="flex-1"
                  />
                  {data.bodyParagraphs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBodyParagraph(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Explain why you&apos;re a good fit for the role
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingParagraph">Closing Paragraph</Label>
              <Textarea
                id="closingParagraph"
                value={data.closingParagraph}
                onChange={(e) => updateField('closingParagraph', e.target.value)}
                placeholder="Thank you for considering my application. I look forward to..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Thank the reader and include a call to action
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
