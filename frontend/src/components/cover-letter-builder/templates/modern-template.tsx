import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { CoverLetterData, CoverLetterSettings } from '@/types/cover-letter'

const createStyles = (accentColor: string, fontSize: number) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 40,
      paddingHorizontal: 0,
      fontSize: fontSize,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      lineHeight: 1.6,
    },
    // Header with accent bar
    header: {
      backgroundColor: accentColor,
      paddingVertical: 30,
      paddingHorizontal: 50,
      marginBottom: 30,
    },
    senderName: {
      fontSize: fontSize + 8,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 8,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
    },
    contactItem: {
      fontSize: fontSize - 1,
      color: '#ffffff',
      opacity: 0.9,
    },
    linksRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 8,
    },
    link: {
      fontSize: fontSize - 1,
      color: '#ffffff',
      textDecoration: 'underline',
    },
    // Content
    content: {
      paddingHorizontal: 50,
    },
    // Date and Recipient Row
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 25,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    dateBlock: {
      alignItems: 'flex-start',
    },
    recipientBlock: {
      alignItems: 'flex-end',
    },
    metaLabel: {
      fontSize: fontSize - 2,
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    metaText: {
      fontSize: fontSize - 1,
      color: '#444444',
    },
    // Subject Line
    subject: {
      marginBottom: 20,
      padding: 12,
      backgroundColor: '#f8fafc',
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    subjectText: {
      fontFamily: 'Helvetica-Bold',
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    // Salutation
    salutation: {
      marginBottom: 15,
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    // Body
    paragraph: {
      marginBottom: 12,
      fontSize: fontSize,
      color: '#374151',
      textAlign: 'justify',
    },
    // Closing
    closingSection: {
      marginTop: 25,
    },
    closing: {
      marginBottom: 30,
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    signatureBlock: {
      borderTopWidth: 2,
      borderTopColor: accentColor,
      paddingTop: 10,
      width: 200,
    },
    signature: {
      fontSize: fontSize + 2,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
    },
  })

interface ModernCoverLetterProps {
  data: CoverLetterData
  settings: CoverLetterSettings
}

export function ModernCoverLetter({ data, settings }: ModernCoverLetterProps) {
  const fontSizeMap = { small: 10, medium: 11, large: 12 }
  const fontSize = fontSizeMap[settings.fontSize]
  const styles = createStyles(settings.primaryColor, fontSize)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with accent */}
        <View style={styles.header}>
          <Text style={styles.senderName}>{data.senderName}</Text>
          <View style={styles.contactRow}>
            {data.senderEmail && <Text style={styles.contactItem}>{data.senderEmail}</Text>}
            {data.senderPhone && <Text style={styles.contactItem}>{data.senderPhone}</Text>}
            {data.senderCity && <Text style={styles.contactItem}>{data.senderCity}</Text>}
          </View>
          {(data.linkedinUrl || data.portfolioUrl) && (
            <View style={styles.linksRow}>
              {data.linkedinUrl && <Link src={data.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {data.portfolioUrl && <Link src={data.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Date and Recipient */}
          <View style={styles.metaRow}>
            <View style={styles.dateBlock}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaText}>{formatDate(data.date)}</Text>
            </View>
            <View style={styles.recipientBlock}>
              <Text style={styles.metaLabel}>To</Text>
              {data.recipientName && <Text style={styles.metaText}>{data.recipientName}</Text>}
              <Text style={styles.metaText}>{data.companyName}</Text>
            </View>
          </View>

          {/* Subject Line */}
          {data.subject && (
            <View style={styles.subject}>
              <Text style={styles.subjectText}>RE: {data.subject}</Text>
            </View>
          )}

          {/* Salutation */}
          <Text style={styles.salutation}>{data.salutation}</Text>

          {/* Opening Paragraph */}
          {data.openingParagraph && (
            <Text style={styles.paragraph}>{data.openingParagraph}</Text>
          )}

          {/* Body Paragraphs */}
          {data.bodyParagraphs.map((paragraph, index) => (
            paragraph && <Text key={index} style={styles.paragraph}>{paragraph}</Text>
          ))}

          {/* Closing Paragraph */}
          {data.closingParagraph && (
            <Text style={styles.paragraph}>{data.closingParagraph}</Text>
          )}

          {/* Closing */}
          <View style={styles.closingSection}>
            <Text style={styles.closing}>{data.closing}</Text>
            <View style={styles.signatureBlock}>
              <Text style={styles.signature}>{data.senderName}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
