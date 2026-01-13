'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ResumeSettings, ResumeTemplate, ResumeFont } from '@/types/resume-builder'
import { COLOR_OPTIONS, FONT_OPTIONS } from '@/types/resume-builder'
import { cn } from '@/lib/utils'
import { TemplateSelector } from './template-selector'

interface ResumeSettingsPanelProps {
  settings: ResumeSettings
  onSettingsChange: (settings: ResumeSettings) => void
}

export function ResumeSettingsPanel({ settings, onSettingsChange }: ResumeSettingsPanelProps) {
  const updateSettings = (updates: Partial<ResumeSettings>) => {
    onSettingsChange({ ...settings, ...updates })
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Resume Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Template Selection with Visual Preview */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm">Template</Label>
          <TemplateSelector
            value={settings.template}
            onChange={(template: ResumeTemplate) => updateSettings({ template })}
            primaryColor={settings.primaryColor}
          />
        </div>

        {/* Font Selection */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm">Font Family</Label>
          <Select
            value={settings.fontFamily}
            onValueChange={(value: ResumeFont) => updateSettings({ fontFamily: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{font.label}</span>
                    <span className="text-xs text-muted-foreground">{font.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Selection */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm">Accent Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateSettings({ primaryColor: color.value })}
                className={cn(
                  'h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 transition-transform hover:scale-110',
                  settings.primaryColor === color.value
                    ? 'border-foreground ring-2 ring-offset-2'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-sm">Show Skill Levels</Label>
              <p className="text-xs text-muted-foreground">Display proficiency bars</p>
            </div>
            <Switch
              checked={settings.showSkillLevels}
              onCheckedChange={(checked) => updateSettings({ showSkillLevels: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
