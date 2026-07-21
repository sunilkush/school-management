import { cn } from '@/lib/utils'
import type { ModuleCategory } from '@/types/content'

interface ModuleFilterProps {
  categories: readonly ModuleCategory[]
  active: ModuleCategory | 'All'
  onChange: (category: ModuleCategory | 'All') => void
}

export function ModuleFilter({ categories, active, onChange }: ModuleFilterProps) {
  const options: (ModuleCategory | 'All')[] = ['All', ...categories]

  return (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter modules by category">
      {options.map((option) => {
        const isActive = active === option
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm',
              isActive ? 'bg-primary text-white' : 'text-gray bg-black/5 hover:bg-black/10',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
