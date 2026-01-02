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
import type { ResumeSettings, ResumeTemplate } from '@/types/resume-builder'
import { TEMPLATE_OPTIONS, COLOR_OPTIONS } from '@/types/resume-builder'
import { cn } from '@/lib/utils'

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
        {/* Template Selection */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm">Template</Label>
          <Select
            value={settings.template}
            onValueChange={(value: ResumeTemplate) => updateSettings({ template: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_OPTIONS.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  <div>
                    <div className="font-medium text-sm">{template.label}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
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
