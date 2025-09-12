"use client"
import * as React from 'react'
import { SignedIn, ClerkLoaded, useUser } from '@clerk/nextjs'
import {
  CheckoutProvider,
  useCheckout,
  PaymentElementProvider,
  PaymentElement,
  usePaymentElement,
} from '@clerk/nextjs/experimental'
import { useRouter } from 'next/navigation'

const PLAN_ID = process.env.NEXT_PUBLIC_PLUS_PLAN_ID || 'cplan_xxx'

export default function CheckoutPage() {
  return (
    <CheckoutProvider for="user" planId={PLAN_ID} planPeriod="month">
      <ClerkLoaded>
        <SignedIn>
          <CustomCheckout />
        </SignedIn>
      </ClerkLoaded>
    </CheckoutProvider>
  )
}

function CustomCheckout() {
  const { checkout } = useCheckout()
  const { status } = checkout

  if (status === 'needs_initialization') {
    return <CheckoutInitialization />
  }

  if (status === 'completed') {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2">🎉 Payment Successful!</h2>
          <p>Your Plus subscription is now active. Redirecting to chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <CheckoutSummary />

      <PaymentElementProvider checkout={checkout}>
        <PaymentSection />
      </PaymentElementProvider>
    </div>
  )
}

function CheckoutInitialization() {
  const { checkout } = useCheckout()
  const { start, status, fetchStatus } = checkout

  if (status !== 'needs_initialization') {
    return null
  }

  return (
    <div className="p-6 text-center">
      <button onClick={start} disabled={fetchStatus === 'fetching'} className="px-4 py-2 bg-indigo-600 text-white rounded">
        {fetchStatus === 'fetching' ? 'Initializing...' : 'Start Checkout'}
      </button>
    </div>
  )
}

function PaymentSection() {
  const { checkout } = useCheckout()
  const { isConfirming, confirm, finalize, error } = checkout

  const { isFormReady, submit } = usePaymentElement()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormReady || isProcessing) return
    setIsProcessing(true)

    try {
      const { data, error } = await submit()
      if (error) {
        console.error('Payment element submit error', error)
        return
      }
      await confirm(data)
      // Finalize will redirect; provide fallback
      finalize({ navigate: () => router.push('/dashboard/chat') })
    } catch (err) {
      console.error('Payment failed:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement fallback={<div>Loading payment element...</div>} />

      {error && <div className="text-red-400">{error.message}</div>}

      <div>
        <button type="submit" disabled={!isFormReady || isProcessing || isConfirming} className="px-4 py-2 bg-green-600 text-white rounded">
          {isProcessing || isConfirming ? 'Processing...' : 'Complete Purchase'}
        </button>
      </div>
    </form>
  )
}

function CheckoutSummary() {
  const { checkout } = useCheckout()
  const { plan, totals } = checkout

  if (!plan) return null

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold">Order Summary</h2>
      <div className="mt-2 flex items-center justify-between">
        <span>{plan.name}</span>
        <span>
          {totals.totalDueNow.currencySymbol} {totals.totalDueNow.amountFormatted}
        </span>
      </div>
    </div>
  )
}
