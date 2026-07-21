import { SEO } from '@/components/seo/SEO'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'

export default function Blog() {
  return (
    <>
      <SEO
        title="Blog"
        description="Insights on school administration, edtech, and running a modern educational institution."
      />
      <Container className="flex flex-col items-center gap-6 py-24 text-center">
        <Badge>Blog</Badge>
        <h1 className="font-display max-w-2xl text-4xl font-bold">New posts are on the way</h1>
        <p className="text-gray max-w-xl text-lg leading-relaxed">
          We&apos;re working on our first set of articles about school administration, edtech trends, and
          getting the most out of CodeVariant. Check back soon.
        </p>
      </Container>
    </>
  )
}
