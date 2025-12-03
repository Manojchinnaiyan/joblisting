'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBulkImportJobs } from '@/hooks/employer/use-employer-jobs'
import { cn } from '@/lib/utils'

interface ImportResult {
  success: boolean
  title: string
  error?: string
}

export default function JobsImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkImport = useBulkImportJobs()
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const result = await bulkImport.mutateAsync(file)
      setResults(result.results || [])
    } catch (error) {
      setResults([{ success: false, title: 'Import failed', error: 'An error occurred during import' }])
    } finally {
      setIsProcessing(false)
    }
  }

  const successCount = results?.filter((r) => r.success).length || 0
  const failCount = results?.filter((r) => !r.success).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/employer-jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Jobs</h1>
          <p className="text-muted-foreground">
            Bulk import jobs from a CSV file
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Import</CardTitle>
          <CardDescription>
            Follow these steps to import multiple jobs at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold">Download Template</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Download our CSV template with the correct column headers
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold">Fill in Job Data</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Add your job listings to the template, one row per job
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold mb-3">
                3
              </div>
              <h4 className="font-semibold">Upload & Import</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your completed file and we&apos;ll create all your jobs
              </p>
            </div>
          </div>

          <Button variant="outline" asChild>
            <a href="/templates/jobs-import-template.csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Required Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Required Fields</CardTitle>
          <CardDescription>
            Your CSV file must include these columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column Name</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">title</TableCell>
                <TableCell><Badge>Required</Badge></TableCell>
                <TableCell>Job title</TableCell>
                <TableCell className="text-muted-foreground">Senior Software Engineer</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">description</TableCell>
                <TableCell><Badge>Required</Badge></TableCell>
                <TableCell>Full job description (min 100 chars)</TableCell>
                <TableCell className="text-muted-foreground">We are looking for...</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">job_type</TableCell>
                <TableCell><Badge>Required</Badge></TableCell>
                <TableCell>full_time, part_time, contract, internship, freelance</TableCell>
                <TableCell className="text-muted-foreground">full_time</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">experience_level</TableCell>
                <TableCell><Badge>Required</Badge></TableCell>
                <TableCell>entry, mid, senior, lead, executive</TableCell>
                <TableCell className="text-muted-foreground">senior</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">remote_type</TableCell>
                <TableCell><Badge>Required</Badge></TableCell>
                <TableCell>onsite, remote, hybrid</TableCell>
                <TableCell className="text-muted-foreground">hybrid</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">location</TableCell>
                <TableCell><Badge variant="secondary">Optional</Badge></TableCell>
                <TableCell>Job location</TableCell>
                <TableCell className="text-muted-foreground">San Francisco, CA</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">salary_min</TableCell>
                <TableCell><Badge variant="secondary">Optional</Badge></TableCell>
                <TableCell>Minimum salary (number)</TableCell>
                <TableCell className="text-muted-foreground">80000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">salary_max</TableCell>
                <TableCell><Badge variant="secondary">Optional</Badge></TableCell>
                <TableCell>Maximum salary (number)</TableCell>
                <TableCell className="text-muted-foreground">120000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">skills</TableCell>
                <TableCell><Badge variant="secondary">Optional</Badge></TableCell>
                <TableCell>Comma-separated skills</TableCell>
                <TableCell className="text-muted-foreground">React, TypeScript, Node.js</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Select your CSV file to import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-muted/50',
              file && 'border-primary bg-primary/5'
            )}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">CSV files only</p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Jobs
                </>
              )}
            </Button>
            {file && (
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setResults(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>
              {successCount} job{successCount !== 1 ? 's' : ''} imported successfully
              {failCount > 0 && `, ${failCount} failed`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3',
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                      {result.title}
                    </span>
                  </div>
                  {result.error && (
                    <span className="text-sm text-red-600">{result.error}</span>
                  )}
                </div>
              ))}
            </div>

            {successCount > 0 && (
              <div className="mt-4">
                <Button asChild>
                  <Link href="/employer-jobs">View All Jobs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
