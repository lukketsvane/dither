'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { X, Download } from "lucide-react"

const defaultImage = "/kryssord.png"

interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, onChange, min, max, step }) => {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="relative w-full h-1 bg-gray-200 rounded-full">
      <div
        className="absolute top-0 left-0 h-full bg-blue-500 rounded-l-full"
        style={{ width: `${percentage}%` }}
      ></div>
      <Slider
        value={[value]}
        onValueChange={(newValue) => onChange(newValue[0])}
        min={min}
        max={max}
        step={step}
        className="absolute inset-0"
      />
    </div>
  )
}

const ditherAlgorithms = [
  "Floyd-Steinberg",
  "Jarvis-Judice-Ninke",
  "Bayer",
  "Atkinson",
  "Noise"
]

export default function Home() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(0)
  const [pixelationScale, setPixelationScale] = useState(1)
  const [detailEnhancement, setDetailEnhancement] = useState(50)
  const [brightness, setBrightness] = useState(0)
  const [midtones, setMidtones] = useState(1)
  const [noise, setNoise] = useState(0)
  const [glow, setGlow] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string>(defaultImage)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColumnClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setSelectedImage(defaultImage)
    setProcessedImage(null)
  }

  const applyDithering = () => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Apply brightness and midtones adjustments
      for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          let value = data[i + j]
          // Apply brightness
          value += brightness
          // Apply midtones
          value = 255 * Math.pow(value / 255, 1 / midtones)
          data[i + j] = Math.max(0, Math.min(255, value))
        }
      }

      // Apply pixelation
      const pixelSize = Math.max(1, Math.floor(pixelationScale))
      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const i = (y * canvas.width + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
            for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
              const pixelIndex = ((y + py) * canvas.width + (x + px)) * 4
              data[pixelIndex] = r
              data[pixelIndex + 1] = g
              data[pixelIndex + 2] = b
            }
          }
        }
      }

      // Apply dithering
      const ditherFunc = getDitherFunction(selectedAlgorithm)
      ditherFunc(imageData, canvas.width, canvas.height, {
        detailEnhancement,
        noise,
        glow
      })

      ctx.putImageData(imageData, 0, 0)
      setProcessedImage(canvas.toDataURL())
    }
    img.src = selectedImage
  }

  const getDitherFunction = (algorithm: number) => {
    switch (algorithm) {
      case 0: return floydSteinbergDither
      case 1: return jarvisJudiceNinkeDither
      case 2: return bayerDither
      case 3: return atkinsonDither
      case 4: return noiseDither
      default: return floydSteinbergDither
    }
  }

  const floydSteinbergDither = (imageData: ImageData, width: number, height: number, options: any) => {
    const data = imageData.data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const factor = 1 + (options.detailEnhancement / 100)
        const newR = Math.round(factor * oldR / 255) * 255 / factor
        const newG = Math.round(factor * oldG / 255) * 255 / factor
        const newB = Math.round(factor * oldB / 255) * 255 / factor

        data[i] = newR
        data[i + 1] = newG
        data[i + 2] = newB

        const errR = oldR - newR
        const errG = oldG - newG
        const errB = oldB - newB

        if (x + 1 < width) {
          data[i + 4] += errR * 7 / 16
          data[i + 5] += errG * 7 / 16
          data[i + 6] += errB * 7 / 16
        }
        if (y + 1 < height) {
          if (x > 0) {
            data[i + width * 4 - 4] += errR * 3 / 16
            data[i + width * 4 - 3] += errG * 3 / 16
            data[i + width * 4 - 2] += errB * 3 / 16
          }
          data[i + width * 4] += errR * 5 / 16
          data[i + width * 4 + 1] += errG * 5 / 16
          data[i + width * 4 + 2] += errB * 5 / 16
          if (x + 1 < width) {
            data[i + width * 4 + 4] += errR * 1 / 16
            data[i + width * 4 + 5] += errG * 1 / 16
            data[i + width * 4 + 6] += errB * 1 / 16
          }
        }
      }
    }
  }

  const jarvisJudiceNinkeDither = (imageData: ImageData, width: number, height: number, options: any) => {
    const data = imageData.data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const factor = 1 + (options.detailEnhancement / 100)
        const newR = Math.round(factor * oldR / 255) * 255 / factor
        const newG = Math.round(factor * oldG / 255) * 255 / factor
        const newB = Math.round(factor * oldB / 255) * 255 / factor

        data[i] = newR
        data[i + 1] = newG
        data[i + 2] = newB

        const errR = (oldR - newR) / 48
        const errG = (oldG - newG) / 48
        const errB = (oldB - newB) / 48

        const distribute = (x: number, y: number, factor: number) => {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = (y * width + x) * 4
            data[idx] += errR * factor
            data[idx + 1] += errG * factor
            data[idx + 2] += errB * factor
          }
        }

        distribute(x + 1, y, 7)
        distribute(x + 2, y, 5)
        distribute(x - 2, y + 1, 3)
        distribute(x - 1, y + 1, 5)
        distribute(x, y + 1, 7)
        distribute(x + 1, y + 1, 5)
        distribute(x + 2, y + 1, 3)
        distribute(x - 2, y + 2, 1)
        distribute(x - 1, y + 2, 3)
        distribute(x, y + 2, 5)
        distribute(x + 1, y + 2, 3)
        distribute(x + 2, y + 2, 1)
      }
    }
  }

  const bayerDither = (imageData: ImageData, width: number, height: number, options: any) => {
    const data = imageData.data
    const bayerMatrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ]

    const factor = 1 + (options.detailEnhancement / 100)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const threshold = (bayerMatrix[y % 4][x % 4] / 16) * 255

        data[i] = factor * data[i] > threshold ? 255 : 0
        data[i + 1] = factor * data[i + 1] > threshold ? 255 : 0
        data[i + 2] = factor * data[i + 2] > threshold ? 255 : 0
      }
    }
  }

  const atkinsonDither = (imageData: ImageData, width: number, height: number, options: any) => {
    const data = imageData.data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const factor = 1 + (options.detailEnhancement / 100)
        const newR = Math.round(factor * oldR / 255) * 255 / factor
        const newG = Math.round(factor * oldG / 255) * 255 / factor
        const newB = Math.round(factor * oldB / 255) * 255 / factor

        data[i] = newR
        data[i + 1] = newG
        data[i + 2] = newB

        const errR = (oldR - newR) / 8
        const errG = (oldG - newG) / 8
        const errB = (oldB - newB) / 8

        const distribute = (x: number, y: number) => {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = (y * width + x) * 4
            data[idx] += errR
            data[idx + 1] += errG
            data[idx + 2] += errB
          }
        }

        distribute(x + 1, y)
        distribute(x + 2, y)
        distribute(x - 1, y + 1)
        distribute(x, y + 1)
        distribute(x + 1, y + 1)
        distribute(x, y + 2)
      }
    }
  }

  const noiseDither = (imageData: ImageData, width: number, height: number, options: any) => {
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * options.noise * 2
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
    }
  }

  useEffect(() => {
    applyDithering()
  }, [selectedImage, selectedAlgorithm, pixelationScale, detailEnhancement, brightness, midtones, noise, glow])

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a')
      link.href = processedImage
      link.download = 'dithered_image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-7xl h-[calc(100vh-2rem)] m-4 bg-white rounded-lg overflow-hidden">
        <div className="flex flex-col h-full bg-white overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl">
              <span className="font-bold">Dither</span>
              <span className="font-normal text-gray-500"> – Apply amazing dithering effects</span>
            </h1>
            <button className="text-gray-500 hover:text-gray-700" onClick={removeImage}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div 
              className="flex-1 flex items-center justify-center border-r border-gray-200 cursor-pointer overflow-auto bg-white"
              onClick={handleColumnClick}
            >
              {processedImage ? (
                <img src={processedImage} alt="Processed" className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={selectedImage} alt="Default or Selected" className="max-w-full max-h-full object-contain" />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                aria-label="Upload image"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="w-80 flex flex-col p-4 overflow-y-auto">
              <Select
                options={ditherAlgorithms}
                value={selectedAlgorithm}
                onChange={(value) => setSelectedAlgorithm(Number(value))}
                className="mb-4"
              />
              <div className="space-y-4 mb-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium w-32">Pixelation Scale</span>
                  <Input
                    type="number"
                    value={pixelationScale}
                    onChange={(e) => setPixelationScale(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                  />
                  <CustomSlider
                    value={pixelationScale}
                    onChange={setPixelationScale}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-32">Detail Enhancement</span>
                  <Input
                    type="number"
                    value={detailEnhancement}
                    onChange={(e) => setDetailEnhancement(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                  />
                  <CustomSlider
                    value={detailEnhancement}
                    onChange={setDetailEnhancement}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-32">Brightness</span>
                  <Input
                    type="number"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                  />
                  <CustomSlider
                    value={brightness}
                    onChange={setBrightness}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-32">Midtones</span>
                  <Input
                    type="number"
                    value={midtones}
                    onChange={(e) => setMidtones(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                    step="0.01"
                  />
                  <CustomSlider
                    value={midtones}
                    onChange={setMidtones}
                    min={0}
                    max={2}
                    step={0.01}
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-32">Noise</span>
                  <Input
                    type="number"
                    value={noise}
                    onChange={(e) => setNoise(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                  />
                  <CustomSlider
                    value={noise}
                    onChange={setNoise}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-32">Glow</span>
                  <Input
                    type="number"
                    value={glow}
                    onChange={(e) => setGlow(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                  />
                  <CustomSlider
                    value={glow}
                    onChange={setGlow}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
              <div className="flex-grow" />
              <div className="flex gap-2 pb-8">
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}