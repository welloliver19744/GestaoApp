import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1117"/>
      <stop offset="100%" stop-color="#1a1d2e"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <rect x="8" y="8" width="496" height="496" rx="72" fill="none" stroke="#22d3ee" stroke-width="4" opacity="0.3"/>
  <g transform="translate(256,270) scale(12)">
    <path d="M0-11c-2.2 0-4 1.8-4 4v2c-1.5.5-3 1.5-3 3.5v5c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h6v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-5c0-2-1.5-3-3-3.5v-2c0-2.2-1.8-4-4-4z" fill="#22d3ee"/>
    <circle cx="4" cy="6" r="1" fill="#0f1117"/>
  </g>
</svg>`

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#0f1117"/>
  <g transform="translate(256,265) scale(10)">
    <path d="M0-11c-2.2 0-4 1.8-4 4v2c-1.5.5-3 1.5-3 3.5v5c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h6v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-5c0-2-1.5-3-3-3.5v-2c0-2.2-1.8-4-4-4z" fill="#22d3ee"/>
    <circle cx="4" cy="6" r="1" fill="#0f1117"/>
  </g>
</svg>`

for (const size of [192, 512]) {
  const name = size === 192 ? 'icon-192x192.png' : 'icon-512x512.png'
  await sharp(Buffer.from(svg)).resize(size, size).toFile(`public/icons/${name}`)
  console.log(`Generated ${name}`)
  if (size === 512) {
    await sharp(Buffer.from(maskableSvg)).resize(size, size).toFile(`public/icons/icon-maskable-${size}x${size}.png`)
    console.log(`Generated icon-maskable-${size}x${size}.png`)
  }
}
