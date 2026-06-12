import { Helmet } from 'react-helmet-async'
import { APP_TITLE, SITE_URL } from '@/utils/constants'

interface PageMetaProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  canonical?: string
  ogType?: string
}

export function PageMeta({
  title,
  description,
  keywords,
  image,
  canonical,
  ogType = 'website',
}: PageMetaProps) {
  const fullTitle = title ? `${title} | NagaevoMaster` : APP_TITLE
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
    </Helmet>
  )
}
