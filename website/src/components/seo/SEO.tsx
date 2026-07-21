interface SEOProps {
  title: string
  description: string
}

/**
 * React 19 hoists <title>/<meta> rendered anywhere in the tree into <head>
 * automatically — no provider or library needed. This only helps
 * JS-executing crawlers (Google/Bing); social-link unfurlers get their
 * defaults from the static tags in index.html instead (see Phase 20).
 */
export function SEO({ title, description }: SEOProps) {
  return (
    <>
      <title>{`${title} | CodeVariant School ERP`}</title>
      <meta name="description" content={description} />
    </>
  )
}
