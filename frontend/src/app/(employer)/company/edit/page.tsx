'use client'

import { useEffect } from 'react'
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
import { ArrowLeft, Save } from 'lucide-react'
import { useMyCompany, useUpdateCompany } from '@/hooks/employer/use-company'
import Link from 'next/link'

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

const COMPANY_TYPES = [
  'Public',
  'Private',
  'Startup',
  'Non-profit',
  'Government',
  'Educational',
  'Other',
]

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(255),
  tagline: z.string().max(255).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  industry: z.string().min(1, 'Industry is required'),
  sub_industry: z.string().max(100).optional().or(z.literal('')),
  company_size: z.string().min(1, 'Company size is required'),
  founded_year: z.coerce.number().min(1800).max(new Date().getFullYear()).optional().or(z.literal('')),
  company_type: z.string().optional().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  linkedin_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  facebook_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  instagram_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  mission: z.string().max(1000).optional().or(z.literal('')),
  vision: z.string().max(1000).optional().or(z.literal('')),
  culture_description: z.string().max(2000).optional().or(z.literal('')),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
})

type CompanyFormValues = z.infer<typeof companySchema>

export default function EditCompanyPage() {
  const router = useRouter()
  const { data: company, isLoading } = useMyCompany()
  const updateCompany = useUpdateCompany()

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      tagline: company?.tagline || '',
      description: company?.description || '',
      industry: company?.industry || '',
      sub_industry: company?.sub_industry || '',
      company_size: company?.company_size || '',
      founded_year: company?.founded_year || '',
      company_type: company?.company_type || '',
      website: company?.website || '',
      email: company?.email || '',
      phone: company?.phone || '',
      linkedin_url: company?.linkedin_url || '',
      twitter_url: company?.twitter_url || '',
      facebook_url: company?.facebook_url || '',
      instagram_url: company?.instagram_url || '',
      mission: company?.mission || '',
      vision: company?.vision || '',
      culture_description: company?.culture_description || '',
      brand_color: company?.brand_color || '',
    },
    values: company ? {
      name: company.name || '',
      tagline: company.tagline || '',
      description: company.description || '',
      industry: company.industry || '',
      sub_industry: company.sub_industry || '',
      company_size: company.company_size || '',
      founded_year: company.founded_year || '',
      company_type: company.company_type || '',
      website: company.website || '',
      email: company.email || '',
      phone: company.phone || '',
      linkedin_url: company.linkedin_url || '',
      twitter_url: company.twitter_url || '',
      facebook_url: company.facebook_url || '',
      instagram_url: company.instagram_url || '',
      mission: company.mission || '',
      vision: company.vision || '',
      culture_description: company.culture_description || '',
      brand_color: company.brand_color || '',
    } : undefined,
  })

  const onSubmit = async (data: CompanyFormValues) => {
    await updateCompany.mutateAsync({
      ...data,
      founded_year: data.founded_year ? Number(data.founded_year) : undefined,
      website: data.website || undefined,
      email: data.email || undefined,
      linkedin_url: data.linkedin_url || undefined,
      twitter_url: data.twitter_url || undefined,
      facebook_url: data.facebook_url || undefined,
      instagram_url: data.instagram_url || undefined,
      brand_color: data.brand_color || undefined,
    })
    router.push('/company')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/company">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Company Profile</h1>
          <p className="text-muted-foreground">Update your company information</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core details about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input placeholder="A short catchy phrase about your company" {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief tagline that appears below your company name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell job seekers about your company..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
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
                  control={form.control}
                  name="sub_industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SaaS, Fintech" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="company_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
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
                  control={form.control}
                  name="founded_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Founded Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2020" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How people can reach your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Your company&apos;s social media presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/company/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter / X</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Culture & Values */}
          <Card>
            <CardHeader>
              <CardTitle>Culture & Values</CardTitle>
              <CardDescription>What makes your company unique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="mission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Statement</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is your company's mission?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vision Statement</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is your company's vision for the future?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="culture_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Culture</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your company culture and work environment..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Color</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" className="h-10 w-20 p-1" {...field} />
                      </FormControl>
                      <Input
                        placeholder="#000000"
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-1"
                      />
                    </div>
                    <FormDescription>
                      Your primary brand color for customizing your company page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/company">Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateCompany.isPending}>
              {updateCompany.isPending ? 'Saving...' : 'Save Changes'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
