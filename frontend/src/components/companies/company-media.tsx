'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Star, Play, X } from 'lucide-react'
import type { CompanyMedia as CompanyMediaType } from '@/types/company'

interface CompanyMediaProps {
  media: CompanyMediaType[]
}

export function CompanyMedia({ media }: CompanyMediaProps) {
  const [selectedMedia, setSelectedMedia] = useState<CompanyMediaType | null>(null)

  if (!media || media.length === 0) {
    return null
  }

  // Sort by featured first, then by sort_order
  const sortedMedia = [...media].sort((a, b) => {
    if (a.is_featured !== b.is_featured) {
      return a.is_featured ? -1 : 1
    }
    return a.sort_order - b.sort_order
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Photos & Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedMedia.map((item) => (
              <div
                key={item.id}
                className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setSelectedMedia(item)}
              >
                {item.type === 'VIDEO' ? (
                  <>
                    {item.thumbnail_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.thumbnail_url}
                        alt={item.title || 'Video thumbnail'}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <Play className="h-12 w-12 text-white" fill="white" />
                    </div>
                  </>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.url}
                    alt={item.title || 'Company media'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                {item.is_featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    <Star className="mr-1 h-3 w-3" />
                    Featured
                  </Badge>
                )}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-sm truncate">{item.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedMedia && (
            <div className="relative">
              {selectedMedia.type === 'VIDEO' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh]"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title || 'Company media'}
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
              {(selectedMedia.title || selectedMedia.description) && (
                <div className="p-4 bg-background">
                  {selectedMedia.title && (
                    <h3 className="font-semibold">{selectedMedia.title}</h3>
                  )}
                  {selectedMedia.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedMedia.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
