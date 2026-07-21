import { Outlet } from 'react-router-dom'
import { SkipLink } from '@/components/ui/SkipLink'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-1 pt-18">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
