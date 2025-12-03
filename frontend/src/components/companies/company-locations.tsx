import { MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CompanyLocation } from '@/types/company'

interface CompanyLocationsProps {
  locations: CompanyLocation[]
}

export function CompanyLocations({ locations }: CompanyLocationsProps) {
  if (!locations || locations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex items-start gap-3 p-4 rounded-lg border"
            >
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{location.name}</h4>
                  {location.is_headquarters && (
                    <Badge variant="secondary" className="text-xs">
                      HQ
                    </Badge>
                  )}
                  {location.is_hiring && (
                    <Badge className="text-xs">Hiring</Badge>
                  )}
                </div>
                {location.address && (
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {location.city}
                  {location.state && `, ${location.state}`}, {location.country}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
