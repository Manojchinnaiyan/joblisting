import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { CoverLetterData, CoverLetterSettings } from '@/types/cover-letter'

const createStyles = (accentColor: string, fontSize: number) =>
  StyleSheet.create({
    page: {
      paddingTop: 50,
      paddingBottom: 50,
      paddingHorizontal: 60,
      fontSize: fontSize,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      lineHeight: 1.6,
    },
    // Header - Sender Info
    header: {
      marginBottom: 30,
    },
    senderName: {
      fontSize: fontSize + 6,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 4,
    },
    senderContact: {
      fontSize: fontSize - 1,
      color: '#444444',
      marginBottom: 2,
    },
    linksRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 4,
    },
    link: {
      fontSize: fontSize - 1,
      color: accentColor,
      textDecoration: 'none',
    },
    // Date
    date: {
      marginBottom: 25,
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    // Recipient Info
    recipient: {
      marginBottom: 25,
    },
    recipientLine: {
      fontSize: fontSize,
      color: '#1a1a1a',
      marginBottom: 2,
    },
    // Subject Line
    subject: {
      marginBottom: 20,
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
      color: '#1a1a1a',
      textAlign: 'justify',
    },
    // Closing
    closing: {
      marginTop: 25,
      marginBottom: 40,
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    signature: {
      fontSize: fontSize + 2,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
  })

interface ProfessionalCoverLetterProps {
  data: CoverLetterData
  settings: CoverLetterSettings
}

export function ProfessionalCoverLetter({ data, settings }: ProfessionalCoverLetterProps) {
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
        {/* Sender Header */}
        <View style={styles.header}>
          <Text style={styles.senderName}>{data.senderName}</Text>
          {data.senderEmail && <Text style={styles.senderContact}>{data.senderEmail}</Text>}
          {data.senderPhone && <Text style={styles.senderContact}>{data.senderPhone}</Text>}
          {data.senderAddress && <Text style={styles.senderContact}>{data.senderAddress}</Text>}
          {data.senderCity && <Text style={styles.senderContact}>{data.senderCity}</Text>}
          {(data.linkedinUrl || data.portfolioUrl) && (
            <View style={styles.linksRow}>
              {data.linkedinUrl && (
                <Link src={data.linkedinUrl} style={styles.link}>LinkedIn</Link>
              )}
              {data.portfolioUrl && (
                <Link src={data.portfolioUrl} style={styles.link}>Portfolio</Link>
              )}
            </View>
          )}
        </View>

        {/* Date */}
        <Text style={styles.date}>{formatDate(data.date)}</Text>

        {/* Recipient */}
        <View style={styles.recipient}>
          {data.recipientName && <Text style={styles.recipientLine}>{data.recipientName}</Text>}
          {data.recipientTitle && <Text style={styles.recipientLine}>{data.recipientTitle}</Text>}
          <Text style={styles.recipientLine}>{data.companyName}</Text>
          {data.companyAddress && <Text style={styles.recipientLine}>{data.companyAddress}</Text>}
        </View>

        {/* Subject Line */}
        {data.subject && <Text style={styles.subject}>Re: {data.subject}</Text>}

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
        <Text style={styles.closing}>{data.closing}</Text>

        {/* Signature */}
        <Text style={styles.signature}>{data.senderName}</Text>
      </Page>
    </Document>
  )
}
