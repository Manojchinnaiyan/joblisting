import { DollarSign } from 'lucide-react'
import { formatSalary } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Salary } from '@/types/job'

interface SalaryDisplayProps {
  salary?: Salary
  className?: string
}

export function SalaryDisplay({ salary, className }: SalaryDisplayProps) {
  if (!salary || salary.hidden) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
      <span className="truncate">{formatSalary(salary.min, salary.max, salary.currency, salary.period)}</span>
    </div>
  )
}
