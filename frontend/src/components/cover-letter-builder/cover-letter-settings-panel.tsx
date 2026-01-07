'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CoverLetterSettings, CoverLetterTemplate } from '@/types/cover-letter'
import { COVER_LETTER_TEMPLATE_OPTIONS, FONT_SIZE_OPTIONS } from '@/types/cover-letter'
import { COLOR_OPTIONS } from '@/types/resume-builder'

interface CoverLetterSettingsPanelProps {
  settings: CoverLetterSettings
  onChange: (settings: CoverLetterSettings) => void
}

export function CoverLetterSettingsPanel({ settings, onChange }: CoverLetterSettingsPanelProps) {
  const updateSetting = <K extends keyof CoverLetterSettings>(
    key: K,
    value: CoverLetterSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Template</Label>
        <RadioGroup
          value={settings.template}
          onValueChange={(value) => updateSetting('template', value as CoverLetterTemplate)}
          className="grid grid-cols-2 gap-2"
        >
          {COVER_LETTER_TEMPLATE_OPTIONS.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`template-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`template-${option.value}`}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {option.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Color Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Accent Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => updateSetting('primaryColor', color.value)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                settings.primaryColor === color.value
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Font Size</Label>
        <Select
          value={settings.fontSize}
          onValueChange={(value) => updateSetting('fontSize', value as 'small' | 'medium' | 'large')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({option.size}pt)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
