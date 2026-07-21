import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Accordion } from '@/components/ui/Accordion'
import { FAQ_ITEMS } from '@/data/faq'

export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <Container className="mx-auto flex max-w-3xl flex-col gap-12">
        <SectionHeading
          eyebrow="Questions & Answers"
          title="Frequently asked questions"
          description="Can’t find what you’re looking for? Reach out and we’ll get back to you within one business day."
        />
        <Accordion items={FAQ_ITEMS} />
      </Container>
    </section>
  )
}
