import { SEO } from '@/components/seo/SEO'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'

export default function About() {
  return (
    <>
      <SEO
        title="About Us"
        description="CodeVariant builds premium school management software for institutions that expect more from their tools."
      />
      <Container className="flex flex-col items-center gap-6 py-24 text-center">
        <Badge>Our Story</Badge>
        <h1 className="font-display max-w-2xl text-4xl font-bold">
          We build software that gets out of an educator&apos;s way
        </h1>
        <p className="text-gray max-w-2xl text-lg leading-relaxed">
          CodeVariant School ERP exists because running a school shouldn&apos;t mean wrestling with a
          dozen disconnected tools. We build one clean, fast, dependable platform that handles
          admissions, fees, attendance, exams, and everything in between — so administrators, teachers,
          and parents can focus on what actually matters.
        </p>
      </Container>
    </>
  )
}
