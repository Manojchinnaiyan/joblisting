import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Traditional template - Conservative design with full-width sections
// Features: Name left-aligned, contact right-aligned, dotted underlines, dense text
const styles = StyleSheet.create({
  page: {
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 30,
    fontSize: 9,
    fontFamily: 'Times-Roman',
    color: '#1a1a1a',
    lineHeight: 1.2,
  },
  // Header - name left, contact right
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#666666',
    borderBottomStyle: 'solid',
  },
  nameContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 2,
  },
  headline: {
    fontSize: 10,
    fontFamily: 'Times-Italic',
    color: '#333333',
  },
  contactContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  contactLine: {
    fontSize: 8,
    color: '#333333',
    marginBottom: 1,
    textAlign: 'right',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  link: {
    fontSize: 8,
    color: '#0055aa',
    textDecoration: 'underline',
  },
  // Sections with gray borders
  section: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    borderBottomStyle: 'solid',
    width: '100%',
  },
  sectionLast: {
    marginBottom: 6,
    paddingBottom: 0,
    borderBottomWidth: 0,
    width: '100%',
  },
  // Section title - ALL CAPS with dotted underline
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#888888',
    borderBottomStyle: 'dotted',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Summary - dense justified text
  summaryText: {
    fontSize: 9,
    lineHeight: 1.25,
    color: '#1a1a1a',
    textAlign: 'justify',
    width: '100%',
  },
  // Experience & Education items - tight spacing
  itemContainer: {
    marginBottom: 4,
    width: '100%',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  itemTitle: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#000000',
    flex: 1,
    flexWrap: 'wrap',
    paddingRight: 6,
  },
  itemDates: {
    fontSize: 8,
    fontFamily: 'Times-Italic',
    color: '#333333',
    flexShrink: 0,
    textAlign: 'right',
  },
  itemSubtitle: {
    fontSize: 8,
    fontFamily: 'Times-Italic',
    color: '#444444',
    marginTop: 0,
    marginBottom: 1,
    width: '100%',
  },
  itemDescription: {
    fontSize: 8,
    lineHeight: 1.25,
    color: '#1a1a1a',
    textAlign: 'justify',
    width: '100%',
  },
  bulletList: {
    marginTop: 1,
    marginLeft: 8,
    width: '100%',
  },
  bulletItem: {
    fontSize: 8,
    lineHeight: 1.2,
    color: '#1a1a1a',
    marginBottom: 0,
    width: '100%',
  },
  // Skills - dense inline format
  skillsText: {
    fontSize: 8,
    color: '#1a1a1a',
    lineHeight: 1.3,
    textAlign: 'justify',
    width: '100%',
  },
  // Certifications
  certItem: {
    marginBottom: 2,
    width: '100%',
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  certName: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#000000',
    flex: 1,
  },
  certDate: {
    fontSize: 8,
    fontFamily: 'Times-Italic',
    color: '#333333',
    flexShrink: 0,
  },
  certDetails: {
    fontSize: 8,
    color: '#444444',
    width: '100%',
  },
  // Projects
  projectItem: {
    marginBottom: 3,
    width: '100%',
  },
  projectTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#000000',
    width: '100%',
  },
  projectDesc: {
    fontSize: 8,
    lineHeight: 1.25,
    color: '#1a1a1a',
    textAlign: 'justify',
    marginTop: 1,
    width: '100%',
  },
  techLine: {
    fontSize: 7,
    fontFamily: 'Times-Italic',
    color: '#444444',
    marginTop: 1,
    width: '100%',
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 1,
  },
  projectLink: {
    fontSize: 7,
    color: '#0055aa',
    textDecoration: 'underline',
  },
})

interface TraditionalTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function TraditionalTemplate({ data }: TraditionalTemplateProps) {
  const { personalInfo, experience, education, skills, certifications, projects } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Determine which sections have content for border logic
  const hasSummary = Boolean(personalInfo.summary)
  const hasExperience = experience.length > 0
  const hasEducation = education.length > 0
  const hasSkills = skills.length > 0
  const hasLanguages = data.languages && data.languages.length > 0
  const hasCertifications = certifications.length > 0
  const hasProjects = projects.length > 0

  // Get array of active sections to determine last one
  const activeSections = [
    hasSummary && 'summary',
    hasExperience && 'experience',
    hasEducation && 'education',
    hasSkills && 'skills',
    hasLanguages && 'languages',
    hasCertifications && 'certifications',
    hasProjects && 'projects',
  ].filter(Boolean)
  const lastSection = activeSections[activeSections.length - 1]

  const getSectionStyle = (sectionName: string) => {
    return sectionName === lastSection ? styles.sectionLast : styles.section
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Name left, Contact right */}
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
          </View>
          <View style={styles.contactContainer}>
            {personalInfo.email && (
              <Text style={styles.contactLine}>{personalInfo.email}</Text>
            )}
            {personalInfo.phone && (
              <Text style={styles.contactLine}>{personalInfo.phone}</Text>
            )}
            {personalInfo.location && (
              <Text style={styles.contactLine}>{personalInfo.location}</Text>
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
        </View>

        {/* Summary */}
        {hasSummary && (
          <View style={getSectionStyle('summary')}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <RichTextRenderer text={personalInfo.summary!} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {hasExperience && (
          <View style={getSectionStyle('experience')}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
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
                      <Text key={idx} style={styles.bulletItem}>- {achievement}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {hasEducation && (
          <View style={getSectionStyle('education')}>
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
        {hasSkills && (
          <View style={getSectionStyle('skills')}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <Text style={styles.skillsText}>
              {skills.map((skill) => skill.name).join(', ')}
            </Text>
          </View>
        )}

        {/* Languages */}
        {hasLanguages && (
          <View style={getSectionStyle('languages')}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.skillsText}>
              {data.languages.map((lang) => lang.name).join(', ')}
            </Text>
          </View>
        )}

        {/* Certifications */}
        {hasCertifications && (
          <View style={getSectionStyle('certifications')}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <View style={styles.certHeader}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                </View>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization}
                  {cert.credentialId ? ` | Credential ID: ${cert.credentialId}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {hasProjects && (
          <View style={getSectionStyle('projects')}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.techLine}>
                    Technologies: {project.technologies.join(', ')}
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
