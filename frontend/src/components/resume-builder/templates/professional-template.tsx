import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// ATS-optimized Professional template
// Tight spacing for maximum content on one page
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 35,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#000000',
  },
  // Header
  header: {
    marginBottom: 8,
    textAlign: 'center',
  },
  name: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 2,
  },
  headline: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 2,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  link: {
    fontSize: 9,
    color: '#0066cc',
    textDecoration: 'underline',
  },
  // Sections
  section: {
    marginBottom: 8,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Summary
  summaryText: {
    fontSize: 9,
    lineHeight: 1.3,
    color: '#000000',
    width: '100%',
  },
  // Experience & Education items
  itemContainer: {
    marginBottom: 6,
    width: '100%',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
    flexWrap: 'wrap',
    paddingRight: 8,
  },
  itemDates: {
    fontSize: 9,
    color: '#000000',
    flexShrink: 0,
  },
  itemSubtitle: {
    fontSize: 9,
    color: '#444444',
    marginTop: 1,
    marginBottom: 2,
    width: '100%',
  },
  itemDescription: {
    fontSize: 9,
    lineHeight: 1.3,
    color: '#000000',
    width: '100%',
  },
  bulletList: {
    marginTop: 2,
    marginLeft: 10,
    width: '100%',
  },
  bulletItem: {
    fontSize: 9,
    lineHeight: 1.3,
    color: '#000000',
    marginBottom: 1,
    width: '100%',
  },
  // Skills
  skillsText: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.4,
    width: '100%',
  },
  // Certifications
  certItem: {
    marginBottom: 3,
    width: '100%',
  },
  certName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    width: '100%',
  },
  certDetails: {
    fontSize: 9,
    color: '#444444',
    width: '100%',
  },
  // Projects
  projectItem: {
    marginBottom: 5,
    width: '100%',
  },
  projectTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    width: '100%',
  },
  projectDesc: {
    fontSize: 9,
    lineHeight: 1.3,
    color: '#000000',
    marginTop: 1,
    width: '100%',
  },
  techLine: {
    fontSize: 8,
    color: '#444444',
    marginTop: 2,
    width: '100%',
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  projectLink: {
    fontSize: 8,
    color: '#0066cc',
    textDecoration: 'underline',
  },
})

interface ProfessionalTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ProfessionalTemplate({ data }: ProfessionalTemplateProps) {
  const { personalInfo, experience, education, skills, certifications, projects } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Build contact line
  const contactParts: string[] = []
  if (personalInfo.email) contactParts.push(personalInfo.email)
  if (personalInfo.phone) contactParts.push(personalInfo.phone)
  if (personalInfo.location) contactParts.push(personalInfo.location)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          {contactParts.length > 0 && (
            <Text style={styles.contactLine}>{contactParts.join(' | ')}</Text>
          )}
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && (
                <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>
              )}
              {personalInfo.githubUrl && (
                <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>
              )}
            </View>
          )}
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>
                  {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
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
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillsText}>
              {skills.map((skill) => skill.name).join(' • ')}
            </Text>
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
                  {cert.credentialId ? ` | ID: ${cert.credentialId}` : ''}
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
                  <Text style={styles.techLine}>
                    Tech: {project.technologies.join(', ')}
                  </Text>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && (
                      <Link src={project.projectUrl} style={styles.projectLink}>View Project</Link>
                    )}
                    {project.sourceCodeUrl && (
                      <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>
                    )}
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
