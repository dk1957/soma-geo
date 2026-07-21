// Web App Manifest Route
// Provides progressive web app configuration for Soma AI

import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: "Soma AI - Generative Engine Optimization Platform",
    short_name: "Soma AI",
    description: "Africa's leading Generative Engine Optimization (GEO) platform helping brands rank higher in AI-driven search engines like ChatGPT, Claude, Gemini, and Perplexity.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
    categories: ["business", "productivity", "marketing"],
    icons: [
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32", 
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Access your AI brand monitoring dashboard",
        url: "/dashboard",
        icons: [{ src: "/favicon-32x32.png", sizes: "32x32" }]
      },
      {
        name: "Contact Us",
        short_name: "Contact", 
        description: "Get in touch with Soma AI",
        url: "/contact",
        icons: [{ src: "/favicon-32x32.png", sizes: "32x32" }]
      },
      {
        name: "Blog",
        short_name: "Blog",
        description: "Read expert insights on GEO and AI optimization",
        url: "/blog",
        icons: [{ src: "/favicon-32x32.png", sizes: "32x32" }]
      }
    ],
    prefer_related_applications: false,
    related_applications: [],
    edge_side_includes: false
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  })
}