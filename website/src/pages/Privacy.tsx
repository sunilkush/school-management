import { SEO } from '@/components/seo/SEO'
import { Container } from '@/components/ui/Container'

export default function Privacy() {
  return (
    <>
      <SEO title="Privacy Policy" description="How CodeVariant School ERP collects, uses, and protects your data." />
      <Container className="max-w-3xl py-24">
        <h1 className="font-display mb-6 text-3xl font-bold">Privacy Policy</h1>
        <p className="text-gray leading-relaxed">
          This is placeholder legal content. Replace this page with a real privacy policy — reviewed by
          counsel and matching your actual data-collection and processing practices — before taking this
          site live.
        </p>
      </Container>
    </>
  )
}
