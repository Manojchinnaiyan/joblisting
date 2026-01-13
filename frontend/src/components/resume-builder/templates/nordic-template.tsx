import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Nordic template - Scandinavian minimal design
// Extreme whitespace, airy layout, hygge-inspired warmth with simplicity
// Clean sans-serif typography, minimal accent color usage
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 60,
      paddingBottom: 60,
      paddingHorizontal: 55,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#2d2d2d',
      backgroundColor: '#fafafa',
    },
    // Header - extremely clean and airy
    header: {
      marginBottom: 45,
      textAlign: 'center',
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica',
      fontWeight: 300,
      color: '#1a1a1a',
      letterSpacing: 4,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    headline: {
      fontSize: 10,
      color: '#666666',
      letterSpacing: 2,
      marginTop: 6,
    },
    // Contact info - subtle and minimal
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 25,
      marginTop: 20,
    },
    contactItem: {
      fontSize: 8,
      color: '#888888',
      letterSpacing: 0.5,
    },
    contactDivider: {
      fontSize: 8,
      color: '#cccccc',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginTop: 10,
    },
    link: {
      fontSize: 8,
      color: accentColor,
      letterSpacing: 0.5,
    },
    // Section styling - generous whitespace
    section: {
      marginBottom: 35,
    },
    sectionHeader: {
      marginBottom: 18,
      borderBottomWidth: 0.5,
      borderBottomColor: '#e0e0e0',
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: '#999999',
      textTransform: 'uppercase',
      letterSpacing: 3,
    },
    // Summary - warm and inviting
    summaryText: {
      fontSize: 10,
      lineHeight: 1.8,
      color: '#444444',
      textAlign: 'center',
      paddingHorizontal: 30,
    },
    // Experience items - clean and spacious
    itemContainer: {
      marginBottom: 22,
    },
    itemHeader: {
      marginBottom: 6,
    },
    itemTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 3,
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      flex: 1,
    },
    itemDates: {
      fontSize: 8,
      color: '#999999',
      letterSpacing: 0.5,
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#666666',
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.7,
      color: '#555555',
      marginTop: 8,
    },
    // Achievements - simple bullet styling
    bulletList: {
      marginTop: 10,
      marginLeft: 2,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    bulletPoint: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: accentColor,
      marginRight: 10,
      marginTop: 4,
    },
    bulletText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#555555',
      flex: 1,
    },
    // Education styling
    educationItem: {
      marginBottom: 16,
    },
    degreeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    degree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    institution: {
      fontSize: 9,
      color: '#666666',
    },
    grade: {
      fontSize: 8,
      color: '#888888',
      marginTop: 3,
    },
    // Skills - flowing, natural layout
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      fontSize: 8,
      color: '#555555',
      backgroundColor: '#f0f0f0',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 2,
    },
    // Languages - clean rows
    languageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 0.25,
      borderBottomColor: '#e8e8e8',
    },
    languageName: {
      fontSize: 9,
      color: '#333333',
    },
    languageLevel: {
      fontSize: 8,
      color: '#888888',
      letterSpacing: 0.5,
    },
    // Certifications - minimal elegance
    certItem: {
      marginBottom: 14,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 2,
    },
    certDetails: {
      fontSize: 8,
      color: '#888888',
    },
    // Projects - clean cards feel
    projectItem: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 0.25,
      borderBottomColor: '#e8e8e8',
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 6,
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#555555',
    },
    techContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    techItem: {
      fontSize: 7,
      color: accentColor,
      letterSpacing: 0.5,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 10,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      letterSpacing: 0.5,
    },
    // Accent line - subtle warmth
    accentLine: {
      width: 30,
      height: 1,
      backgroundColor: accentColor,
      marginBottom: 20,
      alignSelf: 'center',
      opacity: 0.6,
    },
  })

interface NordicTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function NordicTemplate({ data, settings }: NordicTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatProficiency = (proficiency: string) => {
    return proficiency.charAt(0) + proficiency.slice(1).toLowerCase()
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - centered, clean, airy */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
          </View>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
              {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        {/* Summary with accent line */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.accentLine} />
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemDates}>
                      {formatDate(exp.startDate)} — {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtitle}>
                    {exp.companyName}{exp.location ? ` · ${exp.location}` : ''}
                  </Text>
                </View>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.bulletText}>{achievement}</Text>
                      </View>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <View style={styles.degreeRow}>
                  <Text style={styles.degree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(edu.endDate || edu.startDate)}
                  </Text>
                </View>
                <Text style={styles.institution}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.grade}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillTag}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            {languages.map((lang, idx) => (
              <View
                key={lang.id}
                style={[
                  styles.languageRow,
                  idx === languages.length - 1 ? { borderBottomWidth: 0 } : {}
                ]}
              >
                <Text style={styles.languageName}>{lang.name}</Text>
                {lang.proficiency && (
                  <Text style={styles.languageLevel}>{formatProficiency(lang.proficiency)}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Certifications</Text>
            </View>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization} · {formatDate(cert.issueDate)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>
            {projects.map((project, idx) => (
              <View
                key={project.id}
                style={[
                  styles.projectItem,
                  idx === projects.length - 1 ? { borderBottomWidth: 0 } : {}
                ]}
              >
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.techContainer}>
                    {project.technologies.map((tech, techIdx) => (
                      <Text key={techIdx} style={styles.techItem}>{tech}</Text>
                    ))}
                  </View>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>View Project</Link>}
                    {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>}
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
