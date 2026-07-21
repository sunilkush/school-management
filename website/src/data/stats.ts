import type { Stat } from '@/types/content'

// NOTE: representative target figures for a template/demo build, not audited
// customer counts — revisit before using in real marketing claims.
export const HERO_STATS: Stat[] = [
  { id: 'schools', value: 500, suffix: '+', label: 'Institutions' },
  { id: 'students', value: 2, suffix: 'M+', label: 'Students managed' },
  { id: 'uptime', value: 99, suffix: '.9%', label: 'Uptime' },
]

export const TRUST_STATS: Stat[] = [
  { id: 'schools', value: 500, suffix: '+', label: 'Schools & colleges served' },
  { id: 'students', value: 2, suffix: 'M+', label: 'Students managed' },
  { id: 'teachers', value: 80, suffix: 'K+', label: 'Teachers & staff' },
  { id: 'countries', value: 12, suffix: '+', label: 'Countries' },
]
