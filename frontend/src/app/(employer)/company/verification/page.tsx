'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Building2,
  FileText,
  Upload,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useMyCompany, useRequestVerification } from '@/hooks/employer/use-company'
import { cn } from '@/lib/utils'

const verificationSteps = [
  {
    id: 'business_registration',
    title: 'Business Registration',
    description: 'Upload your business registration certificate or incorporation documents',
    icon: Building2,
  },
  {
    id: 'tax_documents',
    title: 'Tax Documents',
    description: 'Provide tax identification number and related documents',
    icon: FileText,
  },
  {
    id: 'website_verification',
    title: 'Website Verification',
    description: 'Verify ownership of your company website domain',
    icon: Shield,
  },
]

const statusConfig = {
  unverified: {
    label: 'Not Verified',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
  },
  pending: {
    label: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  verified: {
    label: 'Verified',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
}

export default function CompanyVerificationPage() {
  const { data: company, isLoading } = useMyCompany()
  const requestVerification = useRequestVerification()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [businessRegNumber, setBusinessRegNumber] = useState('')
  const [documents, setDocuments] = useState<File[]>([])
  const [additionalNotes, setAdditionalNotes] = useState('')

  const verificationStatus = company?.is_verified ? 'verified' : 'unverified'
  const statusInfo = statusConfig[verificationStatus as keyof typeof statusConfig]
  const StatusIcon = statusInfo?.icon || AlertCircle

  const handleSubmitVerification = async () => {
    await requestVerification.mutateAsync({
      documents,
      business_registration_number: businessRegNumber || undefined,
      additional_info: additionalNotes || undefined,
    })
    setIsDialogOpen(false)
    setBusinessRegNumber('')
    setDocuments([])
    setAdditionalNotes('')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
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
          <h1 className="text-2xl font-bold">Company Verification</h1>
          <p className="text-muted-foreground">
            Verify your company to build trust with candidates
          </p>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full',
                verificationStatus === 'verified' ? 'bg-green-100' : 'bg-muted'
              )}>
                <StatusIcon className={cn(
                  'h-8 w-8',
                  verificationStatus === 'verified' ? 'text-green-600' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Verification Status</h2>
                  <Badge className={statusInfo?.color}>
                    {statusInfo?.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {verificationStatus === 'verified' && 'Your company has been verified.'}
                  {verificationStatus === 'unverified' && 'Complete verification to gain trust with candidates.'}
                </p>
              </div>
            </div>
            {verificationStatus === 'unverified' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Start Verification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Benefits of Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Verification</CardTitle>
          <CardDescription>
            Why you should verify your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h4 className="font-semibold">Build Trust</h4>
              <p className="text-sm text-muted-foreground">
                Verified badge shows candidates you&apos;re a legitimate company
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h4 className="font-semibold">More Applications</h4>
              <p className="text-sm text-muted-foreground">
                Verified companies receive up to 40% more applications
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h4 className="font-semibold">Priority Listing</h4>
              <p className="text-sm text-muted-foreground">
                Your jobs appear higher in search results
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <h4 className="font-semibold">Advanced Features</h4>
              <p className="text-sm text-muted-foreground">
                Access to premium features and analytics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requirements</CardTitle>
          <CardDescription>
            Documents and information needed for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">How long does verification take?</h4>
            <p className="text-sm text-muted-foreground">
              Most verifications are completed within 2-3 business days.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">What documents are accepted?</h4>
            <p className="text-sm text-muted-foreground">
              We accept business registration certificates, incorporation documents, tax documents, and official company correspondence.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Is my information secure?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, all documents are encrypted and only used for verification purposes. They are not shared with third parties.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">What if my verification is rejected?</h4>
            <p className="text-sm text-muted-foreground">
              You can resubmit with additional or corrected documents. We&apos;ll provide specific feedback on what was missing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Verification</DialogTitle>
            <DialogDescription>
              Provide your business information to start the verification process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-reg">Business Registration Number</Label>
              <Input
                id="business-reg"
                placeholder="Enter your business registration number"
                value={businessRegNumber}
                onChange={(e) => setBusinessRegNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documents">Upload Documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                onChange={(e) => setDocuments(Array.from(e.target.files || []))}
              />
              <p className="text-xs text-muted-foreground">Upload business registration, tax documents, etc.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Information (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information that might help with verification..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p>
                By submitting this request, you confirm that all information provided is accurate
                and you are authorized to represent this company.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitVerification}
              disabled={documents.length === 0 || requestVerification.isPending}
            >
              {requestVerification.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
