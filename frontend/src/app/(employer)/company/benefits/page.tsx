'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ArrowLeft,
  Plus,
  Gift,
  Edit,
  Trash2,
  Heart,
  DollarSign,
  Calendar,
  BookOpen,
  Coffee,
  Users,
  Activity,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
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
import {
  useCompanyBenefits,
  useCreateBenefit,
  useUpdateBenefit,
  useDeleteBenefit,
} from '@/hooks/employer/use-benefits'
import { CompanyBenefit, BenefitCategory } from '@/lib/api/employer/benefits'

const BENEFIT_CATEGORIES: { value: BenefitCategory; label: string; icon: any }[] = [
  { value: 'HEALTH', label: 'Health & Wellness', icon: Heart },
  { value: 'FINANCIAL', label: 'Financial', icon: DollarSign },
  { value: 'VACATION', label: 'Time Off', icon: Calendar },
  { value: 'PROFESSIONAL_DEVELOPMENT', label: 'Learning & Development', icon: BookOpen },
  { value: 'OFFICE_PERKS', label: 'Office Perks', icon: Coffee },
  { value: 'FAMILY', label: 'Family', icon: Users },
  { value: 'WELLNESS', label: 'Wellness', icon: Activity },
  { value: 'OTHER', label: 'Other', icon: Gift },
]

const benefitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    'HEALTH',
    'FINANCIAL',
    'VACATION',
    'PROFESSIONAL_DEVELOPMENT',
    'OFFICE_PERKS',
    'FAMILY',
    'WELLNESS',
    'OTHER',
  ]),
})

type BenefitFormValues = z.infer<typeof benefitSchema>

export default function CompanyBenefitsPage() {
  const { data: benefits, isLoading } = useCompanyBenefits()
  const createBenefit = useCreateBenefit()
  const updateBenefit = useUpdateBenefit()
  const deleteBenefit = useDeleteBenefit()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<CompanyBenefit | null>(null)
  const [deletingBenefit, setDeletingBenefit] = useState<CompanyBenefit | null>(null)

  const form = useForm<BenefitFormValues>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'OTHER',
    },
  })

  const openCreateDialog = () => {
    setEditingBenefit(null)
    form.reset({
      title: '',
      description: '',
      category: 'OTHER',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (benefit: CompanyBenefit) => {
    setEditingBenefit(benefit)
    form.reset({
      title: benefit.title,
      description: benefit.description || '',
      category: benefit.category,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: BenefitFormValues) => {
    if (editingBenefit) {
      await updateBenefit.mutateAsync({
        id: editingBenefit.id,
        data,
      })
    } else {
      await createBenefit.mutateAsync(data)
    }
    setIsDialogOpen(false)
    setEditingBenefit(null)
  }

  const handleDelete = async () => {
    if (deletingBenefit) {
      await deleteBenefit.mutateAsync(deletingBenefit.id)
      setDeletingBenefit(null)
    }
  }

  const getCategoryIcon = (category: BenefitCategory) => {
    const cat = BENEFIT_CATEGORIES.find((c) => c.value === category)
    return cat?.icon || Gift
  }

  const getCategoryLabel = (category: BenefitCategory) => {
    const cat = BENEFIT_CATEGORIES.find((c) => c.value === category)
    return cat?.label || 'Other'
  }

  // Group benefits by category
  const groupedBenefits = benefits?.reduce((acc, benefit) => {
    const category = benefit.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(benefit)
    return acc
  }, {} as Record<BenefitCategory, CompanyBenefit[]>)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/company">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Company Benefits</h1>
            <p className="text-muted-foreground">Showcase the perks of working at your company</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} disabled={(benefits?.length ?? 0) >= 20}>
          <Plus className="mr-2 h-4 w-4" />
          Add Benefit
        </Button>
      </div>

      {benefits?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No benefits added</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Add benefits to attract top talent to your company.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Benefit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {benefits?.length} of 20 benefits used
          </p>

          {BENEFIT_CATEGORIES.map(({ value: category, label, icon: Icon }) => {
            const categoryBenefits = groupedBenefits?.[category]
            if (!categoryBenefits?.length) return null

            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryBenefits.map((benefit) => (
                      <div
                        key={benefit.id}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                          <div>
                            <p className="font-medium">{benefit.title}</p>
                            {benefit.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {benefit.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(benefit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingBenefit(benefit)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBenefit ? 'Edit Benefit' : 'Add Benefit'}
            </DialogTitle>
            <DialogDescription>
              {editingBenefit
                ? 'Update the benefit details.'
                : 'Add a new benefit to showcase to candidates.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Health Insurance, 401(k) Match" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BENEFIT_CATEGORIES.map(({ value, label, icon: Icon }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {label}
                            </div>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this benefit in more detail..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBenefit.isPending || updateBenefit.isPending}
                >
                  {createBenefit.isPending || updateBenefit.isPending
                    ? 'Saving...'
                    : editingBenefit
                    ? 'Update Benefit'
                    : 'Add Benefit'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingBenefit}
        onOpenChange={() => setDeletingBenefit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingBenefit?.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
