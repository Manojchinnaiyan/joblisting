import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { CoverLetterData, CoverLetterSettings } from '@/types/cover-letter'

const createStyles = (accentColor: string, fontSize: number) =>
  StyleSheet.create({
    page: {
      paddingTop: 60,
      paddingBottom: 60,
      paddingHorizontal: 70,
      fontSize: fontSize,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      lineHeight: 1.7,
    },
    // Simple centered header
    header: {
      textAlign: 'center',
      marginBottom: 40,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    senderName: {
      fontSize: fontSize + 4,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 6,
      letterSpacing: 1,
    },
    contactLine: {
      fontSize: fontSize - 1,
      color: '#6b7280',
      marginBottom: 2,
    },
    linksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginTop: 6,
    },
    link: {
      fontSize: fontSize - 1,
      color: accentColor,
      textDecoration: 'none',
    },
    // Date - right aligned
    date: {
      textAlign: 'right',
      marginBottom: 30,
      fontSize: fontSize,
      color: '#6b7280',
    },
    // Recipient - left aligned, minimal
    recipient: {
      marginBottom: 30,
    },
    recipientLine: {
      fontSize: fontSize,
      color: '#374151',
      marginBottom: 1,
    },
    // Subject - subtle
    subject: {
      marginBottom: 25,
      fontFamily: 'Helvetica-Bold',
      fontSize: fontSize,
      color: '#374151',
    },
    // Salutation
    salutation: {
      marginBottom: 20,
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    // Body paragraphs
    paragraph: {
      marginBottom: 16,
      fontSize: fontSize,
      color: '#374151',
    },
    // Closing
    closingSection: {
      marginTop: 30,
    },
    closing: {
      marginBottom: 35,
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    signature: {
      fontSize: fontSize,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
  })

interface MinimalCoverLetterProps {
  data: CoverLetterData
  settings: CoverLetterSettings
}

export function MinimalCoverLetter({ data, settings }: MinimalCoverLetterProps) {
  const fontSizeMap = { small: 10, medium: 11, large: 12 }
  const fontSize = fontSizeMap[settings.fontSize]
  const styles = createStyles(settings.primaryColor, fontSize)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Combine contact info
  const contactParts = []
  if (data.senderEmail) contactParts.push(data.senderEmail)
  if (data.senderPhone) contactParts.push(data.senderPhone)
  if (data.senderCity) contactParts.push(data.senderCity)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <Text style={styles.senderName}>{data.senderName}</Text>
          {contactParts.length > 0 && (
            <Text style={styles.contactLine}>{contactParts.join(' | ')}</Text>
          )}
          {(data.linkedinUrl || data.portfolioUrl) && (
            <View style={styles.linksRow}>
              {data.linkedinUrl && <Link src={data.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {data.portfolioUrl && <Link src={data.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        {/* Date */}
        <Text style={styles.date}>{formatDate(data.date)}</Text>

        {/* Recipient */}
        <View style={styles.recipient}>
          {data.recipientName && <Text style={styles.recipientLine}>{data.recipientName}</Text>}
          <Text style={styles.recipientLine}>{data.companyName}</Text>
        </View>

        {/* Subject */}
        {data.subject && <Text style={styles.subject}>Re: {data.subject}</Text>}

        {/* Salutation */}
        <Text style={styles.salutation}>{data.salutation}</Text>

        {/* Opening */}
        {data.openingParagraph && (
          <Text style={styles.paragraph}>{data.openingParagraph}</Text>
        )}

        {/* Body */}
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
          <Text style={styles.signature}>{data.senderName}</Text>
        </View>
      </Page>
    </Document>
  )
}
