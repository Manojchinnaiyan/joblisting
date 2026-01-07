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
    // Bold header with name highlight
    header: {
      flexDirection: 'row',
      marginBottom: 30,
    },
    accentBar: {
      width: 8,
      backgroundColor: accentColor,
    },
    headerContent: {
      flex: 1,
      backgroundColor: '#f8fafc',
      padding: 30,
      paddingLeft: 25,
    },
    senderName: {
      fontSize: fontSize + 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 10,
      letterSpacing: 2,
    },
    contactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
    },
    contactItem: {
      fontSize: fontSize - 1,
      color: '#64748b',
    },
    linksRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 10,
    },
    link: {
      fontSize: fontSize - 1,
      color: accentColor,
      textDecoration: 'none',
    },
    // Content
    content: {
      paddingHorizontal: 50,
    },
    // Meta info box
    metaBox: {
      flexDirection: 'row',
      marginBottom: 25,
      gap: 30,
    },
    metaItem: {
      flex: 1,
    },
    metaLabel: {
      fontSize: fontSize - 2,
      color: accentColor,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    metaText: {
      fontSize: fontSize - 1,
      color: '#374151',
    },
    // Subject with icon
    subjectBox: {
      marginBottom: 25,
      flexDirection: 'row',
      alignItems: 'center',
    },
    subjectIcon: {
      width: 30,
      height: 30,
      backgroundColor: accentColor,
      borderRadius: 15,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subjectIconText: {
      color: '#ffffff',
      fontSize: fontSize + 2,
      fontFamily: 'Helvetica-Bold',
    },
    subjectText: {
      fontSize: fontSize,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      flex: 1,
    },
    // Salutation
    salutation: {
      marginBottom: 18,
      fontSize: fontSize,
      color: '#1a1a1a',
      fontFamily: 'Helvetica-Bold',
    },
    // Body
    paragraph: {
      marginBottom: 14,
      fontSize: fontSize,
      color: '#374151',
      textAlign: 'justify',
    },
    // Highlighted paragraph (first one)
    highlightParagraph: {
      marginBottom: 14,
      padding: 15,
      backgroundColor: '#f8fafc',
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      fontSize: fontSize,
      color: '#374151',
    },
    // Closing
    closingSection: {
      marginTop: 30,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    closingLeft: {
      flex: 1,
    },
    closing: {
      marginBottom: 25,
      fontSize: fontSize,
      color: '#1a1a1a',
    },
    signature: {
      fontSize: fontSize + 2,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
    },
    signatureUnderline: {
      marginTop: 4,
      width: 100,
      height: 2,
      backgroundColor: accentColor,
    },
  })

interface CreativeCoverLetterProps {
  data: CoverLetterData
  settings: CoverLetterSettings
}

export function CreativeCoverLetter({ data, settings }: CreativeCoverLetterProps) {
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
        {/* Creative Header */}
        <View style={styles.header}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.senderName}>{data.senderName}</Text>
            <View style={styles.contactGrid}>
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
        </View>

        <View style={styles.content}>
          {/* Meta Info */}
          <View style={styles.metaBox}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaText}>{formatDate(data.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>To</Text>
              {data.recipientName && <Text style={styles.metaText}>{data.recipientName}</Text>}
              <Text style={styles.metaText}>{data.companyName}</Text>
            </View>
          </View>

          {/* Subject */}
          {data.subject && (
            <View style={styles.subjectBox}>
              <View style={styles.subjectIcon}>
                <Text style={styles.subjectIconText}>!</Text>
              </View>
              <Text style={styles.subjectText}>{data.subject}</Text>
            </View>
          )}

          {/* Salutation */}
          <Text style={styles.salutation}>{data.salutation}</Text>

          {/* Opening - Highlighted */}
          {data.openingParagraph && (
            <Text style={styles.highlightParagraph}>{data.openingParagraph}</Text>
          )}

          {/* Body */}
          {data.bodyParagraphs.map((paragraph, index) => (
            paragraph && <Text key={index} style={styles.paragraph}>{paragraph}</Text>
          ))}

          {/* Closing Paragraph */}
          {data.closingParagraph && (
            <Text style={styles.paragraph}>{data.closingParagraph}</Text>
          )}

          {/* Closing with signature */}
          <View style={styles.closingSection}>
            <View style={styles.closingLeft}>
              <Text style={styles.closing}>{data.closing}</Text>
              <Text style={styles.signature}>{data.senderName}</Text>
              <View style={styles.signatureUnderline} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
