import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-600 shadow-soft',
  secondary: 'bg-dark text-secondary-300 hover:bg-primary-900',
  outline: 'border border-black/10 text-dark hover:border-primary/40 hover:bg-primary-50',
  ghost: 'text-dark hover:bg-black/5',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

interface SharedProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
  children: ReactNode
}

type ButtonAsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type ButtonAsLink = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink

const baseClasses =
  'inline-flex items-center justify-center rounded-full font-heading font-semibold ' +
  'transition-[background-color,transform] duration-200 cursor-pointer whitespace-nowrap ' +
  'hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', icon, iconPosition = 'right', className, children } = props
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className)

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
    </>
  )

  if ('href' in props && props.href) {
    const { href, variant: _v, size: _s, icon: _i, iconPosition: _ip, className: _c, children: _ch, ...anchorProps } =
      props as ButtonAsLink
    const isExternal = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

    if (isExternal) {
      return (
        <a href={href} className={classes} {...anchorProps}>
          {content}
        </a>
      )
    }

    return (
      <Link to={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    )
  }

  const { variant: _v2, size: _s2, icon: _i2, iconPosition: _ip2, href: _h, ...buttonProps } =
    props as ButtonAsButton

  return (
    <button type="button" className={classes} {...buttonProps}>
      {content}
    </button>
  )
}
