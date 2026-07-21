import { useState } from 'react'
import type { FormEvent } from 'react'
import { HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi2'
import { Button } from '@/components/ui/Button'
import { WEB3FORMS_ACCESS_KEY, WEB3FORMS_ENDPOINT } from '@/config/links'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const REASONS = ['Book a Demo', 'Sales Inquiry', 'General Question', 'Support'] as const

export function ContactForm() {
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const isConfigured = Boolean(WEB3FORMS_ACCESS_KEY)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isConfigured) {
      setState('error')
      setErrorMessage('This form isn’t connected yet — add a Web3Forms access key to activate it.')
      return
    }

    setState('submitting')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)
    formData.append('access_key', WEB3FORMS_ACCESS_KEY)

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (result.success) {
        setState('success')
        event.currentTarget.reset()
      } else {
        setState('error')
        setErrorMessage(result.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setState('error')
      setErrorMessage('Network error — please check your connection and try again.')
    }
  }

  if (state === 'success') {
    return (
      <div className="shadow-soft flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-10 text-center">
        <HiOutlineCheckCircle className="text-success h-12 w-12" aria-hidden="true" />
        <h3 className="font-heading text-dark text-lg font-bold">Message sent</h3>
        <p className="text-gray text-sm">Thanks for reaching out — our team will get back to you within one business day.</p>
        <Button variant="outline" size="sm" type="button" onClick={() => setState('idle')}>
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="shadow-soft flex flex-col gap-5 rounded-2xl border border-black/5 bg-white p-8">
      {!isConfigured && (
        <p className="bg-warning/10 text-warning rounded-lg px-4 py-3 text-xs font-medium">
          This form is running in demo mode — submissions won’t be delivered until a Web3Forms access key is
          configured.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-dark text-sm font-semibold">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="focus:border-primary rounded-lg border border-black/10 px-3.5 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-dark text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="focus:border-primary rounded-lg border border-black/10 px-3.5 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="institution" className="text-dark text-sm font-semibold">
            Institution name
          </label>
          <input
            id="institution"
            name="institution"
            type="text"
            className="focus:border-primary rounded-lg border border-black/10 px-3.5 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="text-dark text-sm font-semibold">
            I&apos;m reaching out about
          </label>
          <select
            id="reason"
            name="reason"
            defaultValue={REASONS[0]}
            className="focus:border-primary rounded-lg border border-black/10 px-3.5 py-2.5 text-sm outline-none"
          >
            {REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-dark text-sm font-semibold">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="focus:border-primary resize-none rounded-lg border border-black/10 px-3.5 py-2.5 text-sm outline-none"
        />
      </div>

      {state === 'error' && (
        <p className="text-error flex items-center gap-2 text-sm font-medium">
          <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={state === 'submitting'} className="w-full sm:w-fit">
        {state === 'submitting' ? 'Sending…' : 'Send Message'}
      </Button>
    </form>
  )
}
