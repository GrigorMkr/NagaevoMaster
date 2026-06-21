import { Helmet } from 'react-helmet-async';
import { APP_NAME, APP_TITLE, SITE_URL } from '@/utils/constants';

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface PageMetaProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    canonical?: string;
    ogType?: string;
}
function PageMeta({ title, description, keywords, image = DEFAULT_OG_IMAGE, canonical, ogType = 'website', }: PageMetaProps) {
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_TITLE;
    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
    const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;
    return (<Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description}/>}
      {keywords && <meta name="keywords" content={keywords}/>}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl}/>}
      <link rel="icon" href={`${SITE_URL}/favicon.svg`} type="image/svg+xml" />
      <link rel="icon" href={`${SITE_URL}/favicon-32.png`} type="image/png" sizes="32x32" />
      <link rel="apple-touch-icon" href={`${SITE_URL}/apple-touch-icon.png`} sizes="180x180" />
      <meta property="og:title" content={fullTitle}/>
      {description && <meta property="og:description" content={description}/>}
      <meta property="og:image" content={ogImage}/>
      <meta name="twitter:card" content="summary"/>
      <meta name="twitter:image" content={ogImage}/>
      <meta property="og:type" content={ogType}/>
      {canonicalUrl && <meta property="og:url" content={canonicalUrl}/>}
    </Helmet>);
}

export {
  PageMeta,
}
