import { HiOutlineClock, HiOutlineEnvelope, HiOutlinePhone } from 'react-icons/hi2'
import { SEO } from '@/components/seo/SEO'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { ContactForm } from '@/components/contact/ContactForm'
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/config/links'

const CONTACT_DETAILS = [
  { icon: HiOutlineEnvelope, label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: HiOutlinePhone, label: 'Phone', value: CONTACT_PHONE, href: `tel:${CONTACT_PHONE.replace(/\s+/g, '')}` },
  { icon: HiOutlineClock, label: 'Response time', value: 'Within 1 business day' },
]

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact Us"
        description="Book a demo or get in touch with the CodeVariant School ERP team."
      />
      <Container className="py-20 sm:py-28">
        <div className="mb-14 flex flex-col items-center gap-4 text-center">
          <Badge>Get in Touch</Badge>
          <h1 className="font-display max-w-xl text-4xl font-bold text-balance">
            Let&apos;s talk about your institution
          </h1>
          <p className="text-gray max-w-lg text-lg leading-relaxed">
            Book a demo, ask a question, or just say hello — our team responds fast.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-4">
            {CONTACT_DETAILS.map((detail) => (
              <div key={detail.label} className="shadow-soft flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-5">
                <span className="bg-primary-50 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <detail.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-gray text-xs font-semibold">{detail.label}</p>
                  {detail.href ? (
                    <a href={detail.href} className="text-dark hover:text-primary text-sm font-semibold">
                      {detail.value}
                    </a>
                  ) : (
                    <p className="text-dark text-sm font-semibold">{detail.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <ContactForm />
        </div>
      </Container>
    </>
  )
}
