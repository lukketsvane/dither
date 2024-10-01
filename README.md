# Dither - Apply Amazing Dithering Effects

Dither is a powerful and user-friendly image processing tool designed specifically for creatives. It allows you to apply stunning dithering effects to any image, with a wide range of customization options.

## Features

- Multiple dithering algorithms: Floyd-Steinberg, Jarvis-Judice-Ninke, Bayer, Atkinson, and Noise
- Adjustable parameters:
  - Pixelation Scale
  - Detail Enhancement
  - Brightness
  - Midtones
  - Noise
  - Glow
- Real-time preview of effects
- Zoom and pan functionality for detailed editing
- Easy image upload and download
- Randomize feature for quick experimentation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dither.git
   cd dither
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Upload an image by clicking on the main area or dragging and dropping a file.
2. Choose a dithering algorithm from the dropdown menu.
3. Adjust the parameters using the sliders on the right side of the interface.
4. Use the zoom and pan controls to inspect details of your image.
5. Click the "Download" button to save your processed image.
6. Use the "Random" button to quickly try different parameter combinations.


# FILETREE
  ├─].next/ (ignored)
  ├─].vercel/ (ignored)
  ├─]node_modules/ (ignored)
  ├─ public/
  │  └─ kryssord.png
  ├─ src/
  │  ├─ app/
  │  │  ├─ fonts/
  │  │  │  ├─ GeistMonoVF.woff
  │  │  │  └─ GeistVF.woff
  │  │  ├─ favicon.ico
  │  │  ├─ globals.css
  │  │  ├─ layout.tsx
  │  │  └─ page.tsx
  │  ├─ components/
  │  │  ├─ ui/
  │  │  │  ├─ button.tsx
  │  │  │  ├─ input.tsx
  │  │  │  ├─ select.tsx
  │  │  │  └─ slider.tsx
  │  │  └─ dither-plugin.tsx
  │  └─ lib/
  │     └─ utils.ts
  ├─ .eslintrc.json
  ├─ .gitignore
  ├─ components.json
  ├─]next-env.d.ts (ignored)
  ├─ next.config.mjs
  ├─ package-lock.json
  ├─ package.json
  ├─ postcss.config.mjs
  ├─ README.md
  ├─ tailwind.config.ts
  └─ tsconfig.json
