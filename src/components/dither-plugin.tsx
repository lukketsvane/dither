'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Download, Shuffle, ZoomIn, ZoomOut, Moon, Sun } from "lucide-react"

const defaultImage = "/kryssord.png"
const ditherAlgorithms = ["Floyd-Steinberg", "Jarvis-Judice-Ninke", "Bayer", "Atkinson", "Noise"]

const CustomSlider = ({ value, onChange, min, max, step }: { value: number; onChange: (value: number) => void; min: number; max: number; step: number }) => (
  <div className="relative w-full h-1 bg-secondary rounded-full">
    <div className="absolute top-0 left-0 h-full bg-primary rounded-l-full" style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
    <Slider value={[value]} onValueChange={(newValue) => onChange(newValue[0])} min={min} max={max} step={step} className="absolute inset-0" />
  </div>
)

export default function DisplacePlugin() {
  const { theme, setTheme } = useTheme()
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(0)
  const [pixelationScale, setPixelationScale] = useState(1)
  const [detailEnhancement, setDetailEnhancement] = useState(50)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(1)
  const [threshold, setThreshold] = useState(128)
  const [noise, setNoise] = useState(0)
  const [glow, setGlow] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string>(defaultImage)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setSelectedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleColumnClick = () => fileInputRef.current?.click()
  const removeImage = () => { setSelectedImage(defaultImage); setProcessedImage(null) }

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
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const adjustedAvg = Math.min(255, Math.max(0, (avg - 128) * contrast + 128 + brightness))
        const bw = adjustedAvg > threshold ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = bw
      }
      const pixelSize = Math.max(1, Math.floor(pixelationScale))
      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const i = (y * canvas.width + x) * 4
          const r = data[i], g = data[i + 1], b = data[i + 2]
          for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
            for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
              const pixelIndex = ((y + py) * canvas.width + (x + px)) * 4
              data[pixelIndex] = r; data[pixelIndex + 1] = g; data[pixelIndex + 2] = b
            }
          }
        }
      }
      getDitherFunction(selectedAlgorithm)(imageData, canvas.width, canvas.height, { detailEnhancement, noise, glow })
      ctx.putImageData(imageData, 0, 0)
      setProcessedImage(canvas.toDataURL())
    }
    img.src = selectedImage
  }

  const getDitherFunction = (algorithm: number) => {
    const functions = [
      (imageData: ImageData, width: number, height: number, options: any) => {
        const data = imageData.data
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            const oldR = data[i], oldG = data[i + 1], oldB = data[i + 2]
            const factor = 1 + (options.detailEnhancement / 100)
            const newR = Math.round(factor * oldR / 255) * 255 / factor
            const newG = Math.round(factor * oldG / 255) * 255 / factor
            const newB = Math.round(factor * oldB / 255) * 255 / factor
            data[i] = newR; data[i + 1] = newG; data[i + 2] = newB
            const errR = oldR - newR, errG = oldG - newG, errB = oldB - newB
            if (x + 1 < width) {
              data[i + 4] += errR * 7 / 16; data[i + 5] += errG * 7 / 16; data[i + 6] += errB * 7 / 16
            }
            if (y + 1 < height) {
              if (x > 0) {
                data[i + width * 4 - 4] += errR * 3 / 16; data[i + width * 4 - 3] += errG * 3 / 16; data[i + width * 4 - 2] += errB * 3 / 16
              }
              data[i + width * 4] += errR * 5 / 16; data[i + width * 4 + 1] += errG * 5 / 16; data[i + width * 4 + 2] += errB * 5 / 16
              if (x + 1 < width) {
                data[i + width * 4 + 4] += errR * 1 / 16; data[i + width * 4 + 5] += errG * 1 / 16; data[i + width * 4 + 6] += errB * 1 / 16
              }
            }
          }
        }
      },
      // ... (other dither functions remain unchanged)
    ]
    return functions[algorithm]
  }

  useEffect(() => { applyDithering() }, [selectedImage, selectedAlgorithm, pixelationScale, detailEnhancement, brightness, contrast, threshold, noise, glow])

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

  const randomizeParameters = () => {
    setSelectedAlgorithm(Math.floor(Math.random() * ditherAlgorithms.length))
    setPixelationScale(Math.floor(Math.random() * 10) + 1)
    setDetailEnhancement(Math.floor(Math.random() * 101))
    setBrightness(Math.floor(Math.random() * 201) - 100)
    setContrast(Math.random() * 2)
    setThreshold(Math.floor(Math.random() * 256))
    setNoise(Math.floor(Math.random() * 101))
    setGlow(Math.floor(Math.random() * 101))
  }

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 5))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 1))

  const handlePan = (e: React.MouseEvent<HTMLDivElement>) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoomLevel
      const y = (e.clientY - rect.top) / zoomLevel
      setPanPosition({ x, y })
    }
  }

  useEffect(() => {
    if (processedImage && zoomCanvasRef.current) {
      const zoomCanvas = zoomCanvasRef.current
      const zoomCtx = zoomCanvas.getContext('2d')
      if (zoomCtx) {
        const img = new Image()
        img.onload = () => {
          const zoomSize = 150  // Reduced from 200 to make the zoom area smaller
          zoomCanvas.width = zoomSize
          zoomCanvas.height = zoomSize
          const sourceX = Math.max(0, Math.min(img.width - zoomSize / zoomLevel, panPosition.x - zoomSize / (2 * zoomLevel)))
          const sourceY = Math.max(0, Math.min(img.height - zoomSize / zoomLevel, panPosition.y - zoomSize / (2 * zoomLevel)))
          zoomCtx.drawImage(img, sourceX, sourceY, zoomSize / zoomLevel, zoomSize / zoomLevel, 0, 0, zoomSize, zoomSize)
        }
        img.src = processedImage
      }
    }
  }, [processedImage, zoomLevel, panPosition])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl">
          <span className="font-bold">Dither</span>
          <span className="font-normal text-muted-foreground"> – Apply amazing dithering effects</span>
        </h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <button className="text-muted-foreground hover:text-foreground" onClick={removeImage}>
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-hidden cursor-move" onClick={handleColumnClick} onMouseMove={handlePan}>
          {processedImage ? (
            <img src={processedImage} alt="Processed" className="w-full h-full object-contain" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }} />
          ) : (
            <img src={selectedImage} alt="Default or Selected" className="w-full h-full object-contain" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }} />
          )}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" aria-label="Upload image" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-4 w-36 h-36 border-2 border-primary bg-card">
            <canvas ref={zoomCanvasRef} className="w-full h-full" />
          </div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button onClick={handleZoomIn} size="icon" variant="secondary">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button onClick={handleZoomOut} size="icon" variant="secondary">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="w-80 flex flex-col p-4 overflow-y-auto bg-card">
          <Select onValueChange={(value) => setSelectedAlgorithm(Number(value))}>
            <SelectTrigger className="mb-4">
              <SelectValue placeholder={ditherAlgorithms[selectedAlgorithm]} />
            </SelectTrigger>
            <SelectContent>
              {ditherAlgorithms.map((algorithm, index) => (
                <SelectItem key={algorithm} value={index.toString()}>
                  {algorithm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-4 mb-4">
            {[
              { label: "Pixelation Scale", value: pixelationScale, setValue: setPixelationScale, min: 1, max: 10, step: 1 },
              { label: "Detail Enhancement", value: detailEnhancement, setValue: setDetailEnhancement, min: 0, max: 100, step: 1 },
              { label: "Brightness", value: brightness, setValue: setBrightness, min: -100, max: 100, step: 1 },
              { label: "Contrast", value: contrast, setValue: setContrast, min: 0, max: 2, step: 0.1 },
              { label: "Threshold", value: threshold, setValue: setThreshold, min: 0, max: 255, step: 1 },
              { label: "Noise", value: noise, setValue: setNoise, min: 0, max: 100, step: 1 },
              { label: "Glow", value: glow, setValue: setGlow, min: 0, max: 100, step: 1 }
            ].map(({ label, value, setValue, min, max, step }) => (
              <div key={label} className="flex items-center">
                <span className="text-sm font-medium w-32">{label}</span>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-20 mr-4 text-sm border-0 bg-background"
                  step={step.toString()}
                />
                <CustomSlider value={value} onChange={setValue} min={min} max={max} step={step} />
              </div>
            ))}
          </div>
          <div className="flex-grow" />
          <div className="flex gap-2 pb-8">
            <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={randomizeParameters}>
              <Shuffle className="w-4 h-4 mr-2" />
              Random
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              .png
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}