import posthog from 'posthog-js'

// Common event tracking functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties)
  }
}

// User identification
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties)
  }
}

// Reset user on logout
export const resetUser = () => {
  if (typeof window !== 'undefined') {
    posthog.reset()
  }
}

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.setPersonProperties(properties)
  }
}

// Common events
export const trackJobView = (jobId: string, jobTitle: string) => {
  trackEvent('job_viewed', { job_id: jobId, job_title: jobTitle })
}

export const trackJobApplication = (jobId: string, jobTitle: string) => {
  trackEvent('job_application_submitted', { job_id: jobId, job_title: jobTitle })
}

export const trackCompanyView = (companyId: string, companyName: string) => {
  trackEvent('company_viewed', { company_id: companyId, company_name: companyName })
}

export const trackSearch = (searchQuery: string, filters?: Record<string, any>) => {
  trackEvent('search_performed', { query: searchQuery, ...filters })
}

export const trackProfileUpdate = (section: string) => {
  trackEvent('profile_updated', { section })
}

export const trackSignUp = (method: string) => {
  trackEvent('user_signed_up', { method })
}

export const trackSignIn = (method: string) => {
  trackEvent('user_signed_in', { method })
}
