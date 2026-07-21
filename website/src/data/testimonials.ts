import type { Testimonial } from '@/types/content'

/**
 * ============================================================
 * SAMPLE / PLACEHOLDER CONTENT
 * These are fictional quotes attributed to fictional people at
 * fictional institutions (see logos.ts). isSample: true marks
 * every entry so it can be filtered/flagged programmatically.
 * REPLACE WITH REAL CUSTOMERS BEFORE PRODUCTION LAUNCH.
 * ============================================================
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    isSample: true,
    quote:
      'We went from three spreadsheets and a WhatsApp group to one dashboard. Fee follow-ups that used to take a full day now take twenty minutes.',
    name: 'Anjali Rao',
    role: 'Principal',
    institution: 'Greenwood Academy',
    rating: 5,
  },
  {
    id: 't2',
    isSample: true,
    quote:
      'The admission workflow alone paid for the switch. Parents apply online, we approve in a click, and nothing falls through the cracks anymore.',
    name: 'Vikram Nair',
    role: 'Admissions Head',
    institution: 'Silver Oak College',
    rating: 5,
  },
  {
    id: 't3',
    isSample: true,
    quote:
      'Our teachers were skeptical about another new tool. Two weeks in, they were the ones asking why we hadn’t done this sooner.',
    name: 'Sunita Iyer',
    role: 'Vice Principal',
    institution: 'Riverside Public School',
    rating: 5,
  },
  {
    id: 't4',
    isSample: true,
    quote:
      'Running three campuses used to mean three sets of records. Now it’s one system with a clean view per branch, and one for the whole group.',
    name: 'Rajesh Kulkarni',
    role: 'Director of Operations',
    institution: 'Northfield Institute',
    rating: 4,
  },
  {
    id: 't5',
    isSample: true,
    quote:
      'The AI assistant genuinely saves time — I ask which classes are behind on fees and get a straight answer instead of digging through reports.',
    name: 'Meera Joshi',
    role: 'Finance Manager',
    institution: 'Sunstone School',
    rating: 5,
  },
  {
    id: 't6',
    isSample: true,
    quote:
      'Support actually responds. When we had a data-migration question during setup, we had an answer within the hour, not a ticket number.',
    name: 'Arvind Menon',
    role: 'IT Coordinator',
    institution: 'Crestview Education',
    rating: 5,
  },
]
