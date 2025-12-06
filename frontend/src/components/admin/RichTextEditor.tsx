'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Youtube from '@tiptap/extension-youtube'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Minus,
  Youtube as YoutubeIcon,
  Type,
  Table as TableIcon,
  Columns2,
  Columns3,
  LayoutGrid,
  Plus,
  Trash2,
  RowsIcon,
  MergeIcon,
  SplitIcon,
  ListTodo,
  Maximize2,
  Minimize2,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Indent,
  Outdent,
  Keyboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useRef, useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white',
        isActive && 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />
}

const TEXT_COLORS = [
  { name: 'Default', color: null },
  { name: 'Black', color: '#000000' },
  { name: 'Gray', color: '#6B7280' },
  { name: 'Red', color: '#DC2626' },
  { name: 'Orange', color: '#EA580C' },
  { name: 'Yellow', color: '#CA8A04' },
  { name: 'Green', color: '#16A34A' },
  { name: 'Blue', color: '#2563EB' },
  { name: 'Purple', color: '#9333EA' },
  { name: 'Pink', color: '#DB2777' },
]

const HIGHLIGHT_COLORS = [
  { name: 'None', color: null },
  { name: 'Yellow', color: '#FEF08A' },
  { name: 'Green', color: '#BBF7D0' },
  { name: 'Blue', color: '#BFDBFE' },
  { name: 'Purple', color: '#E9D5FF' },
  { name: 'Pink', color: '#FBCFE8' },
  { name: 'Orange', color: '#FED7AA' },
]

const GRID_LAYOUTS = [
  { name: '2 Columns', cols: 2, icon: Columns2 },
  { name: '3 Columns', cols: 3, icon: Columns3 },
  { name: '4 Columns', cols: 4, icon: LayoutGrid },
]

const CALLOUT_TYPES = [
  { name: 'Info', type: 'info', icon: Info, color: 'blue' },
  { name: 'Warning', type: 'warning', icon: AlertTriangle, color: 'yellow' },
  { name: 'Success', type: 'success', icon: CheckCircle, color: 'green' },
  { name: 'Error', type: 'error', icon: XCircle, color: 'red' },
]

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl + B', action: 'Bold' },
  { keys: 'Ctrl + I', action: 'Italic' },
  { keys: 'Ctrl + U', action: 'Underline' },
  { keys: 'Ctrl + Z', action: 'Undo' },
  { keys: 'Ctrl + Y', action: 'Redo' },
  { keys: 'Ctrl + K', action: 'Add Link' },
  { keys: 'Tab', action: 'Indent' },
  { keys: 'Shift + Tab', action: 'Outdent' },
]

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing your blog post...',
}: RichTextEditorProps) {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [showCalloutMenu, setShowCalloutMenu] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-slate-100 dark:bg-slate-800 font-semibold text-left p-2 border border-slate-300 dark:border-slate-600',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 dark:border-slate-600 p-2 align-top',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      CharacterCount.configure({
        limit: null,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-lg prose-slate max-w-none min-h-[400px] p-4 focus:outline-none bg-white text-slate-900',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Handle fullscreen escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return

    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        editor.chain().focus().setImage({ src: result }).run()
      }
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [editor])

  const addImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const addYoutubeVideo = useCallback(() => {
    if (!editor) return

    const url = window.prompt('Enter YouTube URL:')

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 360,
      })
    }
  }, [editor])

  const insertTable = useCallback((rows: number, cols: number) => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setShowTableMenu(false)
  }, [editor])

  const insertGridLayout = useCallback((cols: number) => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 1, cols, withHeaderRow: false }).run()
    setShowLayoutMenu(false)
  }, [editor])

  const insertCallout = useCallback((type: string) => {
    if (!editor) return
    const calloutHtml = `<div class="callout callout-${type}"><p></p></div>`
    editor.chain().focus().insertContent(calloutHtml).run()
    setShowCalloutMenu(false)
  }, [editor])

  const closeAllMenus = useCallback(() => {
    setShowTextColorPicker(false)
    setShowHighlightPicker(false)
    setShowTableMenu(false)
    setShowLayoutMenu(false)
    setShowCalloutMenu(false)
    setShowShortcuts(false)
  }, [])

  if (!editor) {
    return (
      <div className="border rounded-lg">
        <div className="bg-slate-100 dark:bg-slate-800 border-b p-2 h-12" />
        <div className="min-h-[400px] p-4 animate-pulse bg-slate-50" />
      </div>
    )
  }

  const isInTable = editor.isActive('table')
  const characterCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()

  return (
    <div
      ref={editorContainerRef}
      className={cn(
        'border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-[100] rounded-none border-0 flex flex-col bg-white dark:bg-slate-900'
      )}
    >
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Main Toolbar */}
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-1 items-center">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Color */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              closeAllMenus()
              setShowTextColorPicker(!showTextColorPicker)
            }}
            title="Text Color"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
          {showTextColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 flex gap-1 flex-wrap w-[140px]">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    if (c.color) {
                      editor.chain().focus().setColor(c.color).run()
                    } else {
                      editor.chain().focus().unsetColor().run()
                    }
                    setShowTextColorPicker(false)
                  }}
                  className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.color || 'transparent' }}
                  title={c.name}
                >
                  {!c.color && <span className="text-xs text-slate-500">A</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              closeAllMenus()
              setShowHighlightPicker(!showHighlightPicker)
            }}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 flex gap-1 flex-wrap w-[120px]">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    if (c.color) {
                      editor.chain().focus().toggleHighlight({ color: c.color }).run()
                    } else {
                      editor.chain().focus().unsetHighlight().run()
                    }
                    setShowHighlightPicker(false)
                  }}
                  className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.color || 'transparent' }}
                  title={c.name}
                >
                  {!c.color && <span className="text-xs text-red-500">x</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="Task List / Checklist"
        >
          <ListTodo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Indent/Outdent */}
        <ToolbarButton
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          disabled={!editor.can().sinkListItem('listItem')}
          title="Indent"
        >
          <Indent className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          disabled={!editor.can().liftListItem('listItem')}
          title="Outdent"
        >
          <Outdent className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Quote & Code */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Block Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Subscript & Superscript */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive('subscript')}
          title="Subscript"
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive('superscript')}
          title="Superscript"
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Table */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              closeAllMenus()
              setShowTableMenu(!showTableMenu)
            }}
            isActive={isInTable}
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          {showTableMenu && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[180px]">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-2">Insert Table</p>
              <div className="grid grid-cols-4 gap-1 p-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                {[1, 2, 3, 4].map((row) =>
                  [1, 2, 3, 4].map((col) => (
                    <button
                      key={`${row}-${col}`}
                      type="button"
                      onClick={() => insertTable(row, col)}
                      className="w-6 h-6 border border-slate-300 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                      title={`${row} x ${col} table`}
                    />
                  ))
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Click to select size
              </p>
            </div>
          )}
        </div>

        {/* Grid Layout */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              closeAllMenus()
              setShowLayoutMenu(!showLayoutMenu)
            }}
            title="Grid Layout"
          >
            <LayoutGrid className="h-4 w-4" />
          </ToolbarButton>
          {showLayoutMenu && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[160px]">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-2">Grid Layout</p>
              {GRID_LAYOUTS.map((layout) => (
                <button
                  key={layout.cols}
                  type="button"
                  onClick={() => insertGridLayout(layout.cols)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <layout.icon className="h-4 w-4" />
                  {layout.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Callout/Alert Boxes */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              closeAllMenus()
              setShowCalloutMenu(!showCalloutMenu)
            }}
            title="Callout Box"
          >
            <Info className="h-4 w-4" />
          </ToolbarButton>
          {showCalloutMenu && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[160px]">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-2">Callout Box</p>
              {CALLOUT_TYPES.map((callout) => (
                <button
                  key={callout.type}
                  type="button"
                  onClick={() => insertCallout(callout.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <callout.icon className={cn('h-4 w-4', {
                    'text-blue-500': callout.color === 'blue',
                    'text-yellow-500': callout.color === 'yellow',
                    'text-green-500': callout.color === 'green',
                    'text-red-500': callout.color === 'red',
                  })} />
                  {callout.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Links & Media */}
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        {editor.isActive('link') && (
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
        )}

        <ToolbarButton onClick={addImage} title="Upload Image">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={addYoutubeVideo} title="Embed YouTube Video">
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Clear Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Keyboard Shortcuts */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              closeAllMenus()
              setShowShortcuts(!showShortcuts)
            }}
            title="Keyboard Shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </ToolbarButton>
          {showShortcuts && (
            <div className="absolute top-full right-0 mt-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[200px]">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Keyboard Shortcuts</p>
              <div className="space-y-1">
                {KEYBOARD_SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.keys} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{shortcut.action}</span>
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-mono">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <ToolbarButton
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </ToolbarButton>
      </div>

      {/* Table Controls - Show when cursor is in table */}
      {isInTable && (
        <div className="bg-blue-50 dark:bg-blue-950 border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-1 items-center">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mr-2">Table:</span>

          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="Add Column Before"
          >
            <div className="flex items-center gap-0.5">
              <Plus className="h-3 w-3" />
              <Columns2 className="h-4 w-4" />
            </div>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add Column After"
          >
            <div className="flex items-center gap-0.5">
              <Columns2 className="h-4 w-4" />
              <Plus className="h-3 w-3" />
            </div>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete Column"
          >
            <div className="flex items-center gap-0.5 text-red-500">
              <Columns2 className="h-4 w-4" />
              <Trash2 className="h-3 w-3" />
            </div>
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="Add Row Before"
          >
            <div className="flex items-center gap-0.5">
              <Plus className="h-3 w-3" />
              <RowsIcon className="h-4 w-4" />
            </div>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add Row After"
          >
            <div className="flex items-center gap-0.5">
              <RowsIcon className="h-4 w-4" />
              <Plus className="h-3 w-3" />
            </div>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete Row"
          >
            <div className="flex items-center gap-0.5 text-red-500">
              <RowsIcon className="h-4 w-4" />
              <Trash2 className="h-3 w-3" />
            </div>
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().mergeCells().run()}
            title="Merge Cells"
          >
            <MergeIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().splitCell().run()}
            title="Split Cell"
          >
            <SplitIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            title="Toggle Header Row"
          >
            <span className="text-xs font-bold">H</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete Table"
          >
            <div className="flex items-center gap-0.5 text-red-500">
              <TableIcon className="h-4 w-4" />
              <Trash2 className="h-3 w-3" />
            </div>
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <div className={cn(isFullscreen && 'flex-1 overflow-auto')}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer with Character/Word Count */}
      <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
        <div className="flex gap-4">
          <span>{characterCount.toLocaleString()} characters</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className="flex gap-2">
          {isFullscreen && (
            <span className="text-slate-400">Press Esc to exit fullscreen</span>
          )}
        </div>
      </div>

      {/* Click outside to close all menus */}
      {(showTextColorPicker || showHighlightPicker || showTableMenu || showLayoutMenu || showCalloutMenu || showShortcuts) && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeAllMenus}
        />
      )}

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
        }

        .ProseMirror td,
        .ProseMirror th {
          min-width: 1em;
          border: 1px solid #cbd5e1;
          padding: 0.5rem;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }

        .ProseMirror th {
          font-weight: 600;
          background-color: #f1f5f9;
        }

        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(59, 130, 246, 0.2);
          pointer-events: none;
        }

        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #3b82f6;
          pointer-events: none;
        }

        .ProseMirror.resize-cursor {
          cursor: col-resize;
        }

        /* Dark mode table styles */
        .dark .ProseMirror td,
        .dark .ProseMirror th {
          border-color: #475569;
        }

        .dark .ProseMirror th {
          background-color: #1e293b;
        }

        /* Task List Styles */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-top: 0.25rem;
          user-select: none;
        }

        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
          cursor: pointer;
          width: 1rem;
          height: 1rem;
          accent-color: #3b82f6;
        }

        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #94a3b8;
        }

        /* Callout Styles */
        .ProseMirror .callout {
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
          border-left: 4px solid;
        }

        .ProseMirror .callout-info {
          background-color: #eff6ff;
          border-left-color: #3b82f6;
        }

        .ProseMirror .callout-warning {
          background-color: #fffbeb;
          border-left-color: #f59e0b;
        }

        .ProseMirror .callout-success {
          background-color: #f0fdf4;
          border-left-color: #22c55e;
        }

        .ProseMirror .callout-error {
          background-color: #fef2f2;
          border-left-color: #ef4444;
        }

        .dark .ProseMirror .callout-info {
          background-color: rgba(59, 130, 246, 0.1);
        }

        .dark .ProseMirror .callout-warning {
          background-color: rgba(245, 158, 11, 0.1);
        }

        .dark .ProseMirror .callout-success {
          background-color: rgba(34, 197, 94, 0.1);
        }

        .dark .ProseMirror .callout-error {
          background-color: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  )
}
