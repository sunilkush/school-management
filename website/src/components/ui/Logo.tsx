import logo from '../../assets/logo.png'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return <img src={logo} alt="CodeVariant Logo" className={className ?? 'h-9 w-auto'} />
}
