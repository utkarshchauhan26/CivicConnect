'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        
        if (response.ok) {
          // User is logged in, redirect to dashboard
          router.push('/dashboard')
        } else {
          // User is not logged in, redirect to login
          router.push('/login')
        }
      } catch (error) {
        // Error checking auth, redirect to login
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6 animate-pulse">
          <span className="text-white font-bold text-3xl">CC</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Loading CivicConnect...</h1>
      </div>
    </div>
  )
}
