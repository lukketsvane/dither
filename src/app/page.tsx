import type { Metadata } from 'next'
import DisplacePlugin from '@/components/dither-plugin'

export const metadata: Metadata = {
  title: 'Dither - Apply Amazing Dithering Effects',
  description: 'A powerful tool for creatives to apply stunning dithering effects to images with customizable parameters.',
  openGraph: {
    title: 'Dither - Apply Amazing Dithering Effects',
    description: 'Transform your images with customizable dithering effects.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Dither App Preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dither - Apply Amazing Dithering Effects',
    description: 'Transform your images with customizable dithering effects.',
    images: ['/og-image.png'],
  },
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-16 lg:p-24 bg-white dark:bg-black">
      <h1 className="sr-only">Dither - Apply Amazing Dithering Effects</h1>
      <div className="w-full max-w-6xl">
        <DisplacePlugin />
      </div>
    </main>
  )
}