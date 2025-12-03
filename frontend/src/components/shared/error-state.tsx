import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">{message}</p>
      {retry && (
        <Button onClick={retry} variant="outline" className="mt-6">
          Try Again
        </Button>
      )}
    </div>
  )
}
