'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Briefcase } from 'lucide-react'

interface CompanyLogoProps {
  src: string | null | undefined
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackLetter?: string
  className?: string
}

const sizeConfig = {
  sm: {
    wrapper: 'h-9 w-9 sm:h-10 sm:w-10',
    icon: 'h-4 w-4 sm:h-5 sm:w-5',
    image: { width: 40, height: 40, className: 'rounded-lg object-contain w-9 h-9 sm:w-10 sm:h-10' },
    letterSize: 'text-sm',
  },
  md: {
    wrapper: 'h-10 w-10 sm:h-12 sm:w-12',
    icon: 'h-5 w-5 sm:h-6 sm:w-6',
    image: { width: 48, height: 48, className: 'rounded-lg object-contain w-10 h-10 sm:w-12 sm:h-12' },
    letterSize: 'text-lg',
  },
  lg: {
    wrapper: 'h-16 w-16',
    icon: 'h-8 w-8',
    image: { width: 64, height: 64, className: 'rounded-xl object-contain w-16 h-16' },
    letterSize: 'text-xl',
  },
  xl: {
    wrapper: 'h-16 w-16 sm:h-20 sm:w-20',
    icon: 'h-8 w-8 sm:h-10 sm:w-10',
    image: { width: 80, height: 80, className: 'rounded-lg object-contain w-16 h-16 sm:w-20 sm:h-20' },
    letterSize: 'text-2xl',
  },
}

export function CompanyLogo({
  src,
  alt,
  size = 'md',
  fallbackLetter,
  className = '',
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false)
  const config = sizeConfig[size]

  if (!src || hasError) {
    // If fallbackLetter is provided, show letter; otherwise show icon
    if (fallbackLetter) {
      return (
        <div
          className={`${config.wrapper} rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${className}`}
        >
          <span className={`${config.letterSize} font-bold text-primary`}>
            {fallbackLetter.charAt(0).toUpperCase()}
          </span>
        </div>
      )
    }
    return (
      <div
        className={`${config.wrapper} rounded-lg bg-primary flex items-center justify-center shrink-0 ${className}`}
      >
        <Briefcase className={`${config.icon} text-primary-foreground`} />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={config.image.width}
      height={config.image.height}
      className={`${config.image.className} ${className}`}
      onError={() => setHasError(true)}
    />
  )
}
