import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Centered template - Centered header, elegant typography
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 35,
      paddingBottom: 35,
      paddingHorizontal: 45,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    header: {
      textAlign: 'center',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      letterSpacing: 2,
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: accentColor,
      marginBottom: 10,
    },
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    contactItem: {
      fontSize: 9,
      color: '#4b5563',
    },
    contactDivider: {
      fontSize: 9,
      color: '#d1d5db',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 15,
      marginTop: 8,
    },
    link: {
      fontSize: 9,
      color: accentColor,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 10,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#e5e7eb',
    },
    dividerText: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingHorizontal: 15,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#4b5563',
      textAlign: 'center',
    },
    itemContainer: {
      marginBottom: 12,
    },
    itemHeader: {
      textAlign: 'center',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    itemCompany: {
      fontSize: 9,
      color: accentColor,
      marginTop: 2,
    },
    itemMeta: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 2,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginBottom: 3,
    },
    skillsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      fontSize: 8,
      color: '#374151',
      backgroundColor: '#f3f4f6',
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    languageRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 15,
    },
    languageItem: {
      fontSize: 9,
      color: '#374151',
    },
    certItem: {
      textAlign: 'center',
      marginBottom: 8,
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
      marginBottom: 12,
    },
    projectHeader: {
      textAlign: 'center',
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 4,
    },
    techLine: {
      fontSize: 8,
      color: accentColor,
      textAlign: 'center',
      marginTop: 4,
    },
    projectLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface CenteredTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function CenteredTemplate({ data, settings }: CenteredTemplateProps) {
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
          <Text style={styles.name}>
            {personalInfo.firstName.toUpperCase()} {personalInfo.lastName.toUpperCase()}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && (
              <>
                <Text style={styles.contactDivider}>|</Text>
                <Text style={styles.contactItem}>{personalInfo.phone}</Text>
              </>
            )}
            {personalInfo.location && (
              <>
                <Text style={styles.contactDivider}>|</Text>
                <Text style={styles.contactItem}>{personalInfo.location}</Text>
              </>
            )}
          </View>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
              {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>About</Text>
              <View style={styles.dividerLine} />
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Experience</Text>
              <View style={styles.dividerLine} />
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemCompany}>{exp.companyName}{exp.location ? ` | ${exp.location}` : ''}</Text>
                  <Text style={styles.itemMeta}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                  </Text>
                </View>
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
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Education</Text>
              <View style={styles.dividerLine} />
            </View>
            {education.map((edu) => (
              <View key={edu.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.itemCompany}>{edu.institution}</Text>
                  <Text style={styles.itemMeta}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Skills</Text>
              <View style={styles.dividerLine} />
            </View>
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
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Languages</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.languageRow}>
              {languages.map((lang) => (
                <Text key={lang.id} style={styles.languageItem}>
                  {lang.name}{lang.proficiency ? ` (${lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})` : ''}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Certifications</Text>
              <View style={styles.dividerLine} />
            </View>
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
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Projects</Text>
              <View style={styles.dividerLine} />
            </View>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                </View>
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
