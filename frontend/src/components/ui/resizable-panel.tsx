'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface ResizablePanelProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultLeftWidth?: number // percentage
  minLeftWidth?: number // percentage
  maxLeftWidth?: number // percentage
  storageKey?: string
  className?: string
}

export function ResizablePanel({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 65,
  minLeftWidth = 40,
  maxLeftWidth = 80,
  storageKey,
  className,
}: ResizablePanelProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load saved width from localStorage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= minLeftWidth && parsed <= maxLeftWidth) {
          setLeftWidth(parsed)
        }
      }
    }
  }, [storageKey, minLeftWidth, maxLeftWidth])

  // Save width to localStorage when it changes
  useEffect(() => {
    if (storageKey && !isDragging) {
      localStorage.setItem(storageKey, leftWidth.toString())
    }
  }, [leftWidth, storageKey, isDragging])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Clamp the width between min and max
    const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth)
    setLeftWidth(clampedWidth)
  }, [isDragging, minLeftWidth, maxLeftWidth])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-row h-full', className)}
    >
      {/* Left Panel */}
      <div
        className="overflow-auto"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Resizer Handle */}
      <div
        className={cn(
          'relative flex items-center justify-center w-2 cursor-col-resize group shrink-0',
          'hover:bg-primary/10 transition-colors',
          isDragging && 'bg-primary/20'
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Visual handle indicator */}
        <div className={cn(
          'absolute inset-y-0 w-1 bg-border group-hover:bg-primary/50 transition-colors',
          isDragging && 'bg-primary'
        )} />

        {/* Grip icon - shown on hover */}
        <div className={cn(
          'absolute p-1 rounded bg-muted border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity',
          isDragging && 'opacity-100'
        )}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="overflow-auto flex-1"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  )
}
