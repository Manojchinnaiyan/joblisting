import { Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'

interface RichTextRendererProps {
  text: string
  style?: Style | Style[]
  bulletStyle?: Style | Style[]
}

interface TextSegment {
  text: string
  bold?: boolean
  italic?: boolean
}

// Parse markdown-style bold (**text**) and italic (*text*) into segments
function parseInlineFormatting(text: string): TextSegment[] {
  const segments: TextSegment[] = []

  // Regex to match **bold**, *italic*, and plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add plain text before the match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) })
    }

    const matchedText = match[0]
    if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      // Bold text
      segments.push({ text: matchedText.slice(2, -2), bold: true })
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      // Italic text
      segments.push({ text: matchedText.slice(1, -1), italic: true })
    }

    lastIndex = regex.lastIndex
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) })
  }

  // If no segments, return the original text
  if (segments.length === 0) {
    segments.push({ text })
  }

  return segments
}

// Clean HTML tags from text that shouldn't have them
function cleanHtmlTags(text: string): string {
  return text
    // Remove ul tags with any attributes
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '')
    // Convert li tags to bullet points
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    // Remove other common tags
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Handle bold/italic tags - convert to markdown
    .replace(/<strong>(.+?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.+?)<\/b>/gi, '**$1**')
    .replace(/<em>(.+?)<\/em>/gi, '*$1*')
    .replace(/<i>(.+?)<\/i>/gi, '*$1*')
    // Clean up entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Parse text into lines, identifying bullet points (assumes text is already cleaned)
function parseLines(cleanedText: string): Array<{ content: string; isBullet: boolean }> {
  const lines = cleanedText.split('\n').filter((line) => line.trim())

  return lines.map((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      return { content: trimmed.substring(2), isBullet: true }
    }
    return { content: trimmed, isBullet: false }
  })
}

const styles = StyleSheet.create({
  bulletContainer: {
    marginTop: 2,
    marginLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
    width: '100%',
  },
  bulletPoint: {
    width: 12,
    flexShrink: 0,
  },
  bulletContent: {
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  bulletText: {
    flexWrap: 'wrap',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
  boldItalic: {
    fontFamily: 'Helvetica-BoldOblique',
  },
})

// Render a single line with inline formatting
function RenderFormattedText({
  text,
  style,
}: {
  text: string
  style?: Style | Style[]
}) {
  const segments = parseInlineFormatting(text)
  const hasFormatting = segments.some((s) => s.bold || s.italic)

  if (!hasFormatting) {
    return <Text style={style}>{text}</Text>
  }

  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        let textStyle = {}

        if (segment.bold && segment.italic) {
          textStyle = styles.boldItalic
        } else if (segment.bold) {
          textStyle = styles.bold
        } else if (segment.italic) {
          textStyle = styles.italic
        }

        return (
          <Text key={index} style={textStyle}>
            {segment.text}
          </Text>
        )
      })}
    </Text>
  )
}

export function RichTextRenderer({ text, style, bulletStyle }: RichTextRendererProps) {
  if (!text) return null

  // Clean HTML tags first
  const cleanedText = cleanHtmlTags(text)
  const lines = parseLines(cleanedText)
  const hasBullets = lines.some((line) => line.isBullet)

  // If no bullets, render as simple formatted text
  if (!hasBullets) {
    return <RenderFormattedText text={cleanedText} style={style} />
  }

  // Group consecutive bullets together
  const groups: Array<{ type: 'text' | 'bullets'; items: string[] }> = []

  for (const line of lines) {
    if (line.isBullet) {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.type === 'bullets') {
        lastGroup.items.push(line.content)
      } else {
        groups.push({ type: 'bullets', items: [line.content] })
      }
    } else {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.type === 'text') {
        lastGroup.items.push(line.content)
      } else {
        groups.push({ type: 'text', items: [line.content] })
      }
    }
  }

  return (
    <View>
      {groups.map((group, groupIndex) => {
        if (group.type === 'text') {
          return (
            <RenderFormattedText
              key={groupIndex}
              text={group.items.join(' ')}
              style={style}
            />
          )
        }

        // Render bullet list
        const itemStyle = bulletStyle || style
        return (
          <View key={groupIndex} style={styles.bulletContainer}>
            {group.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.bulletItem}>
                <Text style={[itemStyle as Style, styles.bulletPoint]}>•</Text>
                <View style={styles.bulletContent}>
                  <RenderFormattedText text={item} style={itemStyle} />
                </View>
              </View>
            ))}
          </View>
        )
      })}
    </View>
  )
}
