import { SEO } from '@/components/seo/SEO'
import { Container } from '@/components/ui/Container'

export default function Terms() {
  return (
    <>
      <SEO title="Terms of Service" description="The terms governing use of CodeVariant School ERP." />
      <Container className="max-w-3xl py-24">
        <h1 className="font-display mb-6 text-3xl font-bold">Terms of Service</h1>
        <p className="text-gray leading-relaxed">
          This is placeholder legal content. Replace this page with real terms of service — reviewed by
          counsel — before taking this site live.
        </p>
      </Container>
    </>
  )
}
