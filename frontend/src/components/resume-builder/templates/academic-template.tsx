import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Academic CV Template
// Formal CV-style layout for educators, researchers, and academics
// Features: Prominent name with title, education before experience, publications/research section
const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  // Header - Name prominently displayed with academic title
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 15,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    color: '#1e3a8a',
    letterSpacing: 1,
    marginBottom: 4,
  },
  academicTitle: {
    fontSize: 12,
    fontFamily: 'Times-Italic',
    color: '#4b5563',
    marginBottom: 8,
  },
  // Contact info in a single row below name
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 8,
  },
  contactItem: {
    fontSize: 9,
    color: '#374151',
  },
  contactLink: {
    fontSize: 9,
    color: '#1e3a8a',
    textDecoration: 'underline',
  },
  // Sections - formal academic styling
  section: {
    marginBottom: 14,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    color: '#1e3a8a',
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Summary/Research Interests
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1a1a',
    textAlign: 'justify',
    width: '100%',
  },
  // Education - more prominent styling
  educationItem: {
    marginBottom: 10,
    width: '100%',
    paddingLeft: 0,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  educationDegree: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#1a1a1a',
    flex: 1,
    paddingRight: 10,
  },
  educationDates: {
    fontSize: 9,
    color: '#4b5563',
    fontFamily: 'Times-Italic',
    flexShrink: 0,
  },
  educationInstitution: {
    fontSize: 10,
    fontFamily: 'Times-Italic',
    color: '#374151',
    marginTop: 2,
  },
  educationDetails: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 3,
  },
  educationDescription: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#1a1a1a',
    marginTop: 4,
    textAlign: 'justify',
    width: '100%',
  },
  // Experience
  experienceItem: {
    marginBottom: 10,
    width: '100%',
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  experienceTitle: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#1a1a1a',
    flex: 1,
    paddingRight: 10,
  },
  experienceDates: {
    fontSize: 9,
    color: '#4b5563',
    fontFamily: 'Times-Italic',
    flexShrink: 0,
  },
  experienceOrg: {
    fontSize: 10,
    fontFamily: 'Times-Italic',
    color: '#374151',
    marginTop: 1,
  },
  experienceDescription: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#1a1a1a',
    marginTop: 4,
    textAlign: 'justify',
    width: '100%',
  },
  bulletList: {
    marginTop: 4,
    marginLeft: 15,
    width: '100%',
  },
  bulletItem: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#1a1a1a',
    marginBottom: 2,
    width: '100%',
  },
  // Publications/Research (using projects section)
  publicationItem: {
    marginBottom: 8,
    width: '100%',
    paddingLeft: 15,
  },
  publicationTitle: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#1a1a1a',
    width: '100%',
  },
  publicationDescription: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#1a1a1a',
    marginTop: 3,
    textAlign: 'justify',
    width: '100%',
  },
  publicationMeta: {
    fontSize: 8,
    color: '#4b5563',
    fontFamily: 'Times-Italic',
    marginTop: 2,
    width: '100%',
  },
  publicationLinks: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 3,
  },
  publicationLink: {
    fontSize: 8,
    color: '#1e3a8a',
    textDecoration: 'underline',
  },
  // Skills/Languages - inline academic style
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    width: '100%',
  },
  skillCategory: {
    width: '100%',
    marginBottom: 4,
  },
  skillLabel: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#374151',
  },
  skillText: {
    fontSize: 9,
    color: '#1a1a1a',
    lineHeight: 1.4,
  },
  // Certifications/Awards
  certItem: {
    marginBottom: 5,
    width: '100%',
  },
  certName: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#1a1a1a',
  },
  certDetails: {
    fontSize: 9,
    color: '#4b5563',
    fontFamily: 'Times-Italic',
  },
  // References placeholder
  referencesPlaceholder: {
    fontSize: 9,
    fontFamily: 'Times-Italic',
    color: '#6b7280',
    textAlign: 'center',
    paddingTop: 5,
    paddingBottom: 5,
  },
  // Languages section
  languageItem: {
    fontSize: 9,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  languageName: {
    fontFamily: 'Times-Bold',
  },
  languageLevel: {
    fontFamily: 'Times-Italic',
    color: '#4b5563',
  },
})

interface AcademicTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function AcademicTemplate({ data }: AcademicTemplateProps) {
  const { personalInfo, experience, education, skills, certifications, projects } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatProficiency = (proficiency?: string) => {
    switch (proficiency) {
      case 'NATIVE':
        return 'Native'
      case 'FLUENT':
        return 'Fluent'
      case 'PROFESSIONAL':
        return 'Professional'
      case 'CONVERSATIONAL':
        return 'Conversational'
      case 'BASIC':
        return 'Basic'
      default:
        return ''
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Name with Academic Title */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.academicTitle}>{personalInfo.headline}</Text>
          )}
          {/* Contact info in single row */}
          <View style={styles.contactRow}>
            {personalInfo.email && (
              <Text style={styles.contactItem}>{personalInfo.email}</Text>
            )}
            {personalInfo.phone && (
              <Text style={styles.contactItem}>{personalInfo.phone}</Text>
            )}
            {personalInfo.location && (
              <Text style={styles.contactItem}>{personalInfo.location}</Text>
            )}
            {personalInfo.linkedinUrl && (
              <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                LinkedIn
              </Link>
            )}
            {personalInfo.portfolioUrl && (
              <Link src={personalInfo.portfolioUrl} style={styles.contactLink}>
                Portfolio
              </Link>
            )}
            {personalInfo.githubUrl && (
              <Link src={personalInfo.githubUrl} style={styles.contactLink}>
                GitHub
              </Link>
            )}
          </View>
        </View>

        {/* Research Interests / Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Research Interests</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Education - More Prominent (before experience) */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <Text style={styles.educationDegree}>
                    {edu.degree} in {edu.fieldOfStudy}
                  </Text>
                  <Text style={styles.educationDates}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.educationInstitution}>{edu.institution}</Text>
                {edu.grade && (
                  <Text style={styles.educationDetails}>GPA: {edu.grade}</Text>
                )}
                {edu.description && (
                  <RichTextRenderer text={edu.description} style={styles.educationDescription} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Publications / Research (using projects section) */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publications & Research</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.publicationItem}>
                <Text style={styles.publicationTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.publicationDescription} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.publicationMeta}>
                    Keywords: {project.technologies.join(', ')}
                  </Text>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.publicationLinks}>
                    {project.projectUrl && (
                      <Link src={project.projectUrl} style={styles.publicationLink}>
                        View Publication
                      </Link>
                    )}
                    {project.sourceCodeUrl && (
                      <Link src={project.sourceCodeUrl} style={styles.publicationLink}>
                        Source / Data
                      </Link>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Academic / Professional Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic & Professional Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>{exp.title}</Text>
                  <Text style={styles.experienceDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.experienceOrg}>
                  {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                </Text>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.experienceDescription} />
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

        {/* Skills / Areas of Expertise */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas of Expertise</Text>
            <View style={styles.skillCategory}>
              <Text style={styles.skillText}>
                {skills.map((skill) => skill.name).join(' • ')}
              </Text>
            </View>
          </View>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            {data.languages.map((lang) => (
              <Text key={lang.id} style={styles.languageItem}>
                <Text style={styles.languageName}>{lang.name}</Text>
                {lang.proficiency && (
                  <Text style={styles.languageLevel}> - {formatProficiency(lang.proficiency)}</Text>
                )}
              </Text>
            ))}
          </View>
        )}

        {/* Certifications / Honors & Awards */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Honors & Awards</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization}, {formatDate(cert.issueDate)}
                  {cert.credentialId ? ` (${cert.credentialId})` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* References Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>References</Text>
          <Text style={styles.referencesPlaceholder}>
            Available upon request
          </Text>
        </View>
      </Page>
    </Document>
  )
}
