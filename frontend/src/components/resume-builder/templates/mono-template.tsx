import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Mono template - Monospace font, terminal/code style
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 35,
      fontSize: 9,
      fontFamily: 'Courier',
      color: '#1f2937',
      backgroundColor: '#fafafa',
    },
    header: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: '#1f2937',
    },
    headerComment: {
      fontSize: 8,
      color: '#6b7280',
      marginBottom: 4,
    },
    name: {
      fontSize: 16,
      fontFamily: 'Courier-Bold',
      color: accentColor,
    },
    headline: {
      fontSize: 10,
      color: '#9ca3af',
      marginTop: 4,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
      marginTop: 10,
    },
    contactItem: {
      fontSize: 8,
      color: '#d1d5db',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 6,
    },
    link: {
      fontSize: 8,
      color: accentColor,
    },
    section: {
      marginBottom: 15,
    },
    sectionComment: {
      fontSize: 8,
      color: '#6b7280',
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Courier-Bold',
      color: accentColor,
      marginBottom: 8,
    },
    codeBlock: {
      backgroundColor: '#ffffff',
      padding: 10,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    itemContainer: {
      marginBottom: 12,
      backgroundColor: '#ffffff',
      padding: 10,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Courier-Bold',
      color: '#111827',
    },
    itemSubtitle: {
      fontSize: 9,
      color: accentColor,
      marginTop: 2,
    },
    itemDates: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 2,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 2,
    },
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      fontSize: 8,
      color: '#ffffff',
      backgroundColor: '#374151',
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    languageItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    languageName: {
      fontSize: 9,
      color: '#111827',
      width: 100,
    },
    languageLevel: {
      fontSize: 9,
      color: '#6b7280',
    },
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Courier-Bold',
      color: '#111827',
    },
    certDetails: {
      fontSize: 8,
      color: '#6b7280',
    },
    projectItem: {
      marginBottom: 12,
      backgroundColor: '#ffffff',
      padding: 10,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Courier-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    techRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
    },
    techTag: {
      fontSize: 7,
      color: accentColor,
      backgroundColor: '#f3f4f6',
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
    },
  })

interface MonoTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function MonoTemplate({ data, settings }: MonoTemplateProps) {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerComment}>{'// Personal Information'}</Text>
          <Text style={styles.name}>
            {personalInfo.firstName}_{personalInfo.lastName}
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
              {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>[LinkedIn]</Link>}
              {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>[GitHub]</Link>}
              {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>[Portfolio]</Link>}
            </View>
          )}
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionComment}>{'// About'}</Text>
            <View style={styles.codeBlock}>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionComment}>{'// Work Experience'}</Text>
            <Text style={styles.sectionTitle}>experience[]</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{exp.title}</Text>
                <Text style={styles.itemSubtitle}>@ {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}</Text>
                <Text style={styles.itemDates}>
                  {formatDate(exp.startDate)} → {exp.isCurrent ? 'present' : formatDate(exp.endDate || '')}
                </Text>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.bulletItem}>- {achievement}</Text>
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
            <Text style={styles.sectionComment}>{'// Education'}</Text>
            <Text style={styles.sectionTitle}>education[]</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                <Text style={styles.itemSubtitle}>@ {edu.institution}</Text>
                <Text style={styles.itemDates}>
                  {formatDate(edu.startDate)} → {edu.isCurrent ? 'present' : formatDate(edu.endDate || '')}
                </Text>
                {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionComment}>{'// Technical Skills'}</Text>
            <Text style={styles.sectionTitle}>skills[]</Text>
            <View style={styles.skillsRow}>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillTag}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionComment}>{'// Languages'}</Text>
            <Text style={styles.sectionTitle}>languages[]</Text>
            {languages.map((lang) => (
              <View key={lang.id} style={styles.languageItem}>
                <Text style={styles.languageName}>{lang.name}</Text>
                {lang.proficiency && (
                  <Text style={styles.languageLevel}>
                    {'// '}{lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionComment}>{'// Certifications'}</Text>
            <Text style={styles.sectionTitle}>certs[]</Text>
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
            <Text style={styles.sectionComment}>{'// Projects'}</Text>
            <Text style={styles.sectionTitle}>projects[]</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.techRow}>
                    {project.technologies.map((tech, idx) => (
                      <Text key={idx} style={styles.techTag}>{tech}</Text>
                    ))}
                  </View>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>[demo]</Link>}
                    {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>[source]</Link>}
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
