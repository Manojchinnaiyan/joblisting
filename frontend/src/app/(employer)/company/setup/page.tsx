'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Globe, MapPin, ImageIcon, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useCreateCompany, useUploadLogo, useMyCompany } from '@/hooks/employer/use-company'
import { useCreateLocation } from '@/hooks/employer/use-locations'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Media',
  'Real Estate',
  'Transportation',
  'Hospitality',
  'Other',
]

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001-5000', label: '1001-5000 employees' },
  { value: '5000+', label: '5000+ employees' },
]

const step1Schema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(255),
  industry: z.string().min(1, 'Please select an industry'),
  company_size: z.string().min(1, 'Please select company size'),
  description: z.string().max(2000).optional(),
})

const step2Schema = z.object({
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
})

const step3Schema = z.object({
  logo: z.any().optional(),
})

const step4Schema = z.object({
  location_name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().optional(),
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>
type Step4Values = z.infer<typeof step4Schema>

const steps = [
  { id: 1, name: 'Basic Info', icon: Building2 },
  { id: 2, name: 'Contact', icon: Globe },
  { id: 3, name: 'Branding', icon: ImageIcon },
  { id: 4, name: 'Location', icon: MapPin },
]

export default function CompanySetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [companyData, setCompanyData] = useState<Partial<Step1Values & Step2Values>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // All hooks must be called at the top, before any conditional returns
  const { data: existingCompany, isLoading: isLoadingCompany, isFetched } = useMyCompany()
  const createCompany = useCreateCompany()
  const uploadLogo = useUploadLogo()
  const createLocation = useCreateLocation()

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      industry: '',
      company_size: '',
      description: '',
    },
  })

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      website: '',
      email: '',
      phone: '',
    },
  })

  const step4Form = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      location_name: 'Headquarters',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
    },
  })

  // Redirect to employer dashboard if company already exists
  useEffect(() => {
    if (isFetched && existingCompany) {
      router.replace('/employer')
    }
  }, [existingCompany, isFetched, router])

  const handleStep1Submit = (data: Step1Values) => {
    setCompanyData({ ...companyData, ...data })
    setCurrentStep(2)
  }

  const handleStep2Submit = (data: Step2Values) => {
    setCompanyData({ ...companyData, ...data })
    setCurrentStep(3)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStep3Submit = () => {
    setCurrentStep(4)
  }

  const handleFinalSubmit = async (locationData: Step4Values) => {
    try {
      // Create company
      const company = await createCompany.mutateAsync({
        name: companyData.name!,
        industry: companyData.industry,
        company_size: companyData.company_size,
        description: companyData.description,
        website: companyData.website || undefined,
        email: companyData.email || undefined,
        phone: companyData.phone || undefined,
      })

      // Upload logo if provided
      if (logoFile) {
        await uploadLogo.mutateAsync(logoFile)
      }

      // Create headquarters location
      await createLocation.mutateAsync({
        name: locationData.location_name,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        postal_code: locationData.postal_code,
        is_headquarters: true,
        is_hiring: true,
      })

      router.push('/employer')
    } catch (error) {
      // Errors are handled by the mutations
    }
  }

  const isLoading = createCompany.isPending || uploadLogo.isPending || createLocation.isPending

  // Show loading while checking for existing company
  if (isLoadingCompany || !isFetched) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If company exists, don't render the form (will redirect)
  if (existingCompany) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Progress Steps */}
      <nav className="mb-8">
        <ol className="flex items-center justify-center gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isCompleted = currentStep > step.id
            const isCurrent = currentStep === step.id

            return (
              <li key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary/10 text-primary border border-primary',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-2 h-px w-8 bg-border" />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Let&apos;s set up your company</CardTitle>
            <CardDescription>
              Tell us about your company. This information will be visible to job seekers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="company_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell job seekers about your company..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of what your company does.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Contact */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              How can candidates and partners reach your company?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
                <FormField
                  control={step2Form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Branding */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Branding</CardTitle>
            <CardDescription>
              Add your company logo to make your profile stand out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-32 w-32 rounded-lg object-cover border"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="text-center">
                <label htmlFor="logo-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleLogoChange}
                      />
                    </span>
                  </Button>
                </label>
                <p className="mt-2 text-sm text-muted-foreground">
                  Recommended: 400x400px, PNG or JPG
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleStep3Submit}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Location */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Headquarters Location</CardTitle>
            <CardDescription>
              Add your company&apos;s main office location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step4Form}>
              <form onSubmit={step4Form.handleSubmit(handleFinalSubmit)} className="space-y-6">
                <FormField
                  control={step4Form.control}
                  name="location_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Headquarters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step4Form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={step4Form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step4Form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="California" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={step4Form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step4Form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="94102" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Complete Setup'}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
