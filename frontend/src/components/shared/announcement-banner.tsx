'use client'

import Link from 'next/link'

interface AnnouncementBannerProps {
  message?: string
  href?: string
}

export function AnnouncementBanner({
  message = "New jobs added daily! Find your dream job today. Apply now and start your career journey with top companies.",
  href = "/jobs"
}: AnnouncementBannerProps) {
  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <Link href={href} className="block">
        <div className="relative flex overflow-x-hidden py-2">
          <div className="animate-marquee whitespace-nowrap flex">
            <span className="mx-4 text-sm font-medium">{message}</span>
            <span className="mx-4 text-sm font-medium">{message}</span>
            <span className="mx-4 text-sm font-medium">{message}</span>
            <span className="mx-4 text-sm font-medium">{message}</span>
          </div>
          <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex py-2">
            <span className="mx-4 text-sm font-medium">{message}</span>
            <span className="mx-4 text-sm font-medium">{message}</span>
            <span className="mx-4 text-sm font-medium">{message}</span>
            <span className="mx-4 text-sm font-medium">{message}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
