import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Metro template - Windows Metro/flat design inspired
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 25,
      paddingBottom: 25,
      paddingHorizontal: 30,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      backgroundColor: '#ffffff',
    },
    header: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    nameTile: {
      backgroundColor: accentColor,
      padding: 15,
      flex: 1,
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
    },
    headline: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 3,
    },
    contactTile: {
      backgroundColor: '#374151',
      padding: 15,
      width: 180,
    },
    contactItem: {
      fontSize: 8,
      color: '#ffffff',
      marginBottom: 3,
    },
    linkRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 6,
    },
    link: {
      fontSize: 8,
      color: accentColor,
    },
    tilesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 15,
    },
    summaryTile: {
      backgroundColor: '#f3f4f6',
      padding: 12,
      width: '100%',
      marginBottom: 8,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    section: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    itemContainer: {
      marginBottom: 10,
      paddingLeft: 10,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 1,
    },
    itemDates: {
      fontSize: 8,
      color: accentColor,
      marginTop: 2,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 2,
    },
    skillsTile: {
      backgroundColor: accentColor,
      padding: 10,
      width: '48%',
      marginBottom: 8,
    },
    skillsTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 6,
    },
    skillTag: {
      fontSize: 8,
      color: '#ffffff',
      marginBottom: 2,
    },
    languageTile: {
      backgroundColor: '#374151',
      padding: 10,
      width: '48%',
      marginBottom: 8,
    },
    languageTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 6,
    },
    languageItem: {
      fontSize: 8,
      color: '#ffffff',
      marginBottom: 2,
    },
    certItem: {
      marginBottom: 6,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certDetails: {
      fontSize: 8,
      color: '#6b7280',
    },
    projectItem: {
      marginBottom: 10,
      padding: 10,
      backgroundColor: '#f9fafb',
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 3,
    },
    techLine: {
      fontSize: 8,
      color: accentColor,
      marginTop: 4,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface MetroTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function MetroTemplate({ data, settings }: MetroTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Tiles */}
        <View style={styles.header}>
          <View style={styles.nameTile}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
          </View>
          <View style={styles.contactTile}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
            {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
              <View style={styles.linkRow}>
                {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
                {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
                {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
              </View>
            )}
          </View>
        </View>

        {/* Summary Tile */}
        {personalInfo.summary && (
          <View style={styles.summaryTile}>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Skills & Languages Tiles */}
        <View style={styles.tilesRow}>
          {skills.length > 0 && (
            <View style={styles.skillsTile}>
              <Text style={styles.skillsTitle}>SKILLS</Text>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillTag}>• {skill.name}</Text>
              ))}
            </View>
          )}
          {languages && languages.length > 0 && (
            <View style={styles.languageTile}>
              <Text style={styles.languageTitle}>LANGUAGES</Text>
              {languages.map((lang) => (
                <Text key={lang.id} style={styles.languageItem}>
                  • {lang.name}{lang.proficiency ? ` (${lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})` : ''}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{exp.title}</Text>
                <Text style={styles.itemSubtitle}>
                  {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                </Text>
                <Text style={styles.itemDates}>
                  {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                </Text>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.bulletItem}>• {achievement}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                <Text style={styles.itemDates}>
                  {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                </Text>
                {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization} | {formatDate(cert.issueDate)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.techLine}>{project.technologies.join(' | ')}</Text>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>Demo</Link>}
                    {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Code</Link>}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
