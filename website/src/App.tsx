import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Layout } from '@/components/layout/Layout'
import Home from '@/pages/Home'

const Pricing = lazy(() => import('@/pages/Pricing'))
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))
const Blog = lazy(() => import('@/pages/Blog'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))

function PageFallback() {
  return <div className="min-h-[60vh]" aria-hidden="true" />
}

function App() {
  return (
    // reducedMotion="user" makes every motion.* element in the app respect
    // the OS-level prefers-reduced-motion setting automatically — no need
    // to hand-check useReducedMotion() in each of the ~15 section components.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path="pricing"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Pricing />
                </Suspense>
              }
            />
            <Route
              path="about"
              element={
                <Suspense fallback={<PageFallback />}>
                  <About />
                </Suspense>
              }
            />
            <Route
              path="contact"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Contact />
                </Suspense>
              }
            />
            <Route
              path="blog"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Blog />
                </Suspense>
              }
            />
            <Route
              path="privacy"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Privacy />
                </Suspense>
              }
            />
            <Route
              path="terms"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Terms />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
