import { Metadata } from 'next'
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@/lib/constants'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

export function generateMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
}: SEOProps = {}): Metadata {
  const metaTitle = title ? `${title} | ${APP_NAME}` : APP_NAME
  const metaDescription = description || APP_DESCRIPTION
  const metaImage = image || `${APP_URL}/og-image.png`
  const metaUrl = url || APP_URL

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      type: type as 'website',
      title: metaTitle,
      description: metaDescription,
      url: metaUrl,
      siteName: APP_NAME,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
    },
  }
}
