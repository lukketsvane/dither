'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const DisplacePlugin = dynamic(() => import('../components/dither-plugin'), { 
  ssr: false,
  loading: () => <p>Loading...</p>
})

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-7xl h-[calc(100vh-2rem)] m-4 bg-white rounded-lg overflow-hidden">
        {isMounted && <DisplacePlugin />}
      </div>
    </main>
  )
}