'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Plus, MapPin, Edit, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  useCompanyLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/hooks/employer/use-locations'
import { CompanyLocation } from '@/lib/api/employer/locations'

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  address: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(1, 'Country is required').max(100),
  postal_code: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  is_headquarters: z.boolean().default(false),
  is_hiring: z.boolean().default(true),
})

type LocationFormValues = z.infer<typeof locationSchema>

export default function CompanyLocationsPage() {
  const { data: locations, isLoading } = useCompanyLocations()
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const deleteLocation = useDeleteLocation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<CompanyLocation | null>(null)

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      phone: '',
      email: '',
      is_headquarters: false,
      is_hiring: true,
    },
  })

  const openCreateDialog = () => {
    setEditingLocation(null)
    form.reset({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      phone: '',
      email: '',
      is_headquarters: locations?.length === 0,
      is_hiring: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (location: CompanyLocation) => {
    setEditingLocation(location)
    form.reset({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      country: location.country || '',
      postal_code: location.postal_code || '',
      phone: location.phone || '',
      email: location.email || '',
      is_headquarters: location.is_headquarters,
      is_hiring: location.is_hiring,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: LocationFormValues) => {
    if (editingLocation) {
      await updateLocation.mutateAsync({
        id: editingLocation.id,
        data: {
          ...data,
          email: data.email || undefined,
        },
      })
    } else {
      await createLocation.mutateAsync({
        ...data,
        email: data.email || undefined,
      })
    }
    setIsDialogOpen(false)
    setEditingLocation(null)
  }

  const handleDelete = async () => {
    if (deletingLocation) {
      await deleteLocation.mutateAsync(deletingLocation.id)
      setDeletingLocation(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
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
            <h1 className="text-2xl font-bold">Company Locations</h1>
            <p className="text-muted-foreground">Manage your office locations</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} disabled={(locations?.length ?? 0) >= 10}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {locations?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No locations added</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Add your first office location to show candidates where you operate.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {locations?.length} of 10 locations used
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {locations?.map((location) => (
              <Card key={location.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      {location.is_headquarters && (
                        <Badge variant="secondary">
                          <Building2 className="mr-1 h-3 w-3" />
                          HQ
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(location)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingLocation(location)}
                        disabled={location.is_headquarters && locations.length > 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {location.address && <p>{location.address}</p>}
                      <p>
                        {[location.city, location.state, location.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {location.postal_code && (
                        <p className="text-muted-foreground">{location.postal_code}</p>
                      )}
                    </div>
                  </div>
                  {(location.phone || location.email) && (
                    <div className="pt-2 border-t text-sm text-muted-foreground">
                      {location.phone && <p>{location.phone}</p>}
                      {location.email && <p>{location.email}</p>}
                    </div>
                  )}
                  <div className="pt-2">
                    {location.is_hiring ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Hiring at this location
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not hiring
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Update the location details.'
                : 'Add a new office location for your company.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Headquarters, NYC Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 grid-cols-2">
                <FormField
                  control={form.control}
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
                  control={form.control}
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

              <div className="grid gap-4 grid-cols-2">
                <FormField
                  control={form.control}
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
                  control={form.control}
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

              <div className="grid gap-4 grid-cols-2">
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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="office@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_headquarters"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Headquarters</FormLabel>
                      <FormDescription>
                        Mark this as your main office location
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_hiring"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Hiring at this location</FormLabel>
                      <FormDescription>
                        Show this location in job postings
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
                  disabled={createLocation.isPending || updateLocation.isPending}
                >
                  {createLocation.isPending || updateLocation.isPending
                    ? 'Saving...'
                    : editingLocation
                    ? 'Update Location'
                    : 'Add Location'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingLocation}
        onOpenChange={() => setDeletingLocation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingLocation?.name}&quot;? This action
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
