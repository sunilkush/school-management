import { motion } from 'framer-motion'
import { HiStar } from 'react-icons/hi2'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'
import { TESTIMONIALS } from '@/data/testimonials'

function initialsOf(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

export function TestimonialsSection() {
  return (
    <section className="bg-primary-50/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="What Administrators Say"
          title="Loved by the people who run the school"
          description="A few notes from administrators who moved their institution onto CodeVariant."
        />

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.08)}
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.figure
              key={testimonial.id}
              variants={fadeUp}
              className="shadow-soft flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-6"
            >
              <div className="flex gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <HiStar
                    key={i}
                    className={i < testimonial.rating ? 'text-secondary-600 h-4 w-4' : 'h-4 w-4 text-black/10'}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <blockquote className="text-dark flex-1 text-sm leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <figcaption className="flex items-center gap-3 border-t border-black/5 pt-4">
                <span className="bg-primary-100 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {initialsOf(testimonial.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-dark truncate text-sm font-bold">{testimonial.name}</p>
                  <p className="text-gray truncate text-xs">
                    {testimonial.role}, {testimonial.institution}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
