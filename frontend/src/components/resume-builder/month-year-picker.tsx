'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MonthYearPickerProps {
  value: string // Format: "YYYY-MM" or ""
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

// Generate years from 1970 to current year + 5
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1970 + 6 }, (_, i) => (currentYear + 5 - i).toString())

export function MonthYearPicker({ value, onChange, disabled, placeholder = 'Select date' }: MonthYearPickerProps) {
  // Parse "YYYY-MM" format
  const [year, month] = value ? value.split('-') : ['', '']

  const handleMonthChange = (newMonth: string) => {
    if (year) {
      onChange(`${year}-${newMonth}`)
    } else {
      // Default to current year if no year selected
      onChange(`${currentYear}-${newMonth}`)
    }
  }

  const handleYearChange = (newYear: string) => {
    if (month) {
      onChange(`${newYear}-${month}`)
    } else {
      // Default to January if no month selected
      onChange(`${newYear}-01`)
    }
  }

  return (
    <div className="flex gap-2">
      <Select value={month} onValueChange={handleMonthChange} disabled={disabled}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={handleYearChange} disabled={disabled}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
