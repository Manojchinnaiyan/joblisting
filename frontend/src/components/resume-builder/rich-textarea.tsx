'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface RichTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

// Convert markdown to HTML for editor display
function markdownToHtml(text: string): string {
  if (!text) return ''

  // First, handle bullet points (lines starting with • or -)
  const lines = text.split('\n')
  let inList = false
  let result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      if (!inList) {
        result.push('<ul>')
        inList = true
      }
      const content = trimmed.substring(2)
      result.push(`<li>${content}</li>`)
    } else {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      if (trimmed) {
        result.push(`<p>${trimmed}</p>`)
      }
    }
  }

  if (inList) {
    result.push('</ul>')
  }

  let html = result.join('')

  // Then handle bold and italic
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

  return html || '<p></p>'
}

// Convert HTML back to markdown for storage
function htmlToMarkdown(html: string): string {
  if (!html) return ''

  let result = html
    // Handle bold and italic first
    .replace(/<strong>(.+?)<\/strong>/g, '**$1**')
    .replace(/<b>(.+?)<\/b>/g, '**$1**')
    .replace(/<em>(.+?)<\/em>/g, '*$1*')
    .replace(/<i>(.+?)<\/i>/g, '*$1*')
    // Handle list items - convert to bullet points (with or without nested p tags)
    .replace(/<li><p>(.+?)<\/p><\/li>/g, '• $1\n')
    .replace(/<li>(.+?)<\/li>/g, '• $1\n')
    // Remove ul tags (with or without class attributes)
    .replace(/<ul[^>]*>/g, '')
    .replace(/<\/ul>/g, '')
    // Handle paragraphs and breaks
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p><\/p>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    // Handle entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  // Clean up multiple newlines
  result = result.replace(/\n{3,}/g, '\n\n').trim()

  return result
}

export function RichTextarea({ value, onChange, placeholder, rows = 3, className }: RichTextareaProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        heading: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        // Enable bullet lists
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-4',
          },
        },
      }),
    ],
    content: markdownToHtml(value),
    immediatelyRender: false, // Fix SSR hydration issue
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'prose prose-sm max-w-none',
          '[&_strong]:font-bold [&_em]:italic',
          className
        ),
        style: `min-height: ${rows * 24}px`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onChange(markdown)
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== htmlToMarkdown(editor.getHTML())) {
      editor.commands.setContent(markdownToHtml(value))
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div className="space-y-2">
        <div className="flex gap-1 border rounded-md p-1 w-fit bg-muted/30">
          <div className="h-7 w-7" />
          <div className="h-7 w-7" />
          <div className="w-px bg-border mx-1" />
          <div className="h-7 w-7" />
        </div>
        <div
          className={cn(
            "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm animate-pulse",
            className
          )}
          style={{ minHeight: `${rows * 24}px` }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex gap-1 border rounded-md p-1 w-fit bg-muted/30">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <p className="text-xs text-muted-foreground">
        Use toolbar for formatting. Click bullet icon to create lists.
      </p>
    </div>
  )
}
