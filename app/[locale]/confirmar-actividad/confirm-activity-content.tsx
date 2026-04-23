'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ConfirmActivityDict {
  loading: string
  fallback: string
  success: { title: string; body: string; close: string }
  error: { title: string; body: string }
}

interface WrapperProps {
  dict: ConfirmActivityDict
  tagline: string
}

function ConfirmActivityContent({ dict }: { dict: ConfirmActivityDict }) {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function confirm() {
      try {
        let res: Response

        if (token) {
          res = await fetch('/api/checkin/confirm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          })
        } else {
          res = await fetch('/api/checkin/confirm', { method: 'POST' })
        }

        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch (err) {
        console.error('Confirmation error:', err)
        setStatus('error')
      }
    }

    confirm()
  }, [token])

  return (
    <>
      {status === 'loading' && (
        <div className="space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-[#C4623A] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[#3a2e24]">{dict.loading}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
          <p className="text-[#3a2e24] font-medium">{dict.success.title}</p>
          <p className="text-sm text-gray-500">{dict.success.body}</p>
          <p className="text-sm text-gray-400">{dict.success.close}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">!</div>
          <p className="text-[#3a2e24]">{dict.error.title}</p>
          <p className="text-sm text-gray-500">{dict.error.body}</p>
        </div>
      )}
    </>
  )
}

export function ConfirmActivityWrapper({ dict, tagline }: WrapperProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F0EBE3] font-serif">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#E0D8CC] text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#C4623A] mb-2">Carry my Words</h1>
          <p className="text-sm text-[#8a6a50] italic">{tagline}</p>
        </div>
        <Suspense fallback={
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-[#C4623A] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-[#3a2e24]">{dict.fallback}</p>
          </div>
        }>
          <ConfirmActivityContent dict={dict} />
        </Suspense>
      </div>
    </div>
  )
}
