'use client'

import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Target,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Hash,
  BarChart3,
  FileCheck,
} from 'lucide-react'
import { calculateATSScore, type ATSCheck } from '@/lib/resume-parser/ats-scorer'
import type { ResumeData } from '@/types/resume-builder'
import { cn } from '@/lib/utils'

interface ATSScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ResumeData
}

const categoryIcons: Record<string, React.ElementType> = {
  formatting: FileCheck,
  content: FileText,
  keywords: Hash,
  structure: BarChart3,
}

const checkIcons: Record<string, React.ElementType> = {
  'contact-info': Target,
  'professional-summary': FileText,
  'work-experience': Briefcase,
  'education': GraduationCap,
  'skills': Wrench,
  'keywords': Hash,
  'quantifiable': BarChart3,
  'content-length': FileCheck,
}

export function ATSScoreDialog({ open, onOpenChange, data }: ATSScoreDialogProps) {
  const result = useMemo(() => calculateATSScore(data), [data])

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-600 bg-green-100'
      case 'B':
        return 'text-blue-600 bg-blue-100'
      case 'C':
        return 'text-yellow-600 bg-yellow-100'
      case 'D':
        return 'text-orange-600 bg-orange-100'
      case 'F':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            ATS Compatibility Score
          </DialogTitle>
          <DialogDescription>
            See how well your resume performs with Applicant Tracking Systems
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Score Overview */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between p-4 sm:p-6 bg-muted/50 rounded-lg mb-6 gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div
                className={cn(
                  'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold',
                  getGradeColor(result.grade)
                )}
              >
                {result.grade}
              </div>
              <div>
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                  <span className={cn('text-3xl sm:text-4xl font-bold', getScoreColor(result.percentage))}>
                    {result.percentage}%
                  </span>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    ({result.overallScore}/{result.maxScore})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">ATS Compatibility Score</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <p className="text-sm">{result.summary}</p>
          </div>

          {/* Top Issues */}
          {result.topIssues.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Top Issues to Fix
              </h4>
              <div className="space-y-2">
                {result.topIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Detailed Checks */}
          <div>
            <h4 className="font-medium text-sm mb-4">Detailed Analysis</h4>
            <div className="space-y-4">
              {result.checks.map((check) => (
                <CheckItem key={check.id} check={check} />
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function CheckItem({ check }: { check: ATSCheck }) {
  const Icon = checkIcons[check.id] || FileText
  const percentage = Math.round((check.score / check.maxScore) * 100)

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              check.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            )}
          >
            {check.passed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="font-medium text-sm">{check.name}</h5>
              <Badge variant="outline" className="text-xs capitalize">
                {check.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{check.description}</p>
            <p className="text-sm mt-2">{check.feedback}</p>

            {/* Suggestions */}
            {check.suggestions && check.suggestions.length > 0 && (
              <div className="mt-3 space-y-1">
                {check.suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-medium">
            {check.score}/{check.maxScore}
          </span>
          <Progress
            value={percentage}
            className={cn(
              'h-1.5 w-16 mt-1',
              check.passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'
            )}
          />
        </div>
      </div>
    </div>
  )
}
