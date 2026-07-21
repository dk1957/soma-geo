import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 – Lost in the AI Void | Soma AI",
  description: "This page doesn't exist. Even ChatGPT, Gemini, and Claude couldn't find it.",
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating ghost tokens — decorative background */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Scattered "tokens" floating around */}
        <span className="absolute top-[12%] left-[8%] text-gray-100 text-7xl font-black animate-pulse" style={{ animationDelay: "0ms" }}>?</span>
        <span className="absolute top-[20%] right-[12%] text-gray-100 text-5xl font-black animate-pulse" style={{ animationDelay: "400ms" }}>404</span>
        <span className="absolute bottom-[18%] left-[15%] text-gray-100 text-6xl font-black animate-pulse" style={{ animationDelay: "800ms" }}>∅</span>
        <span className="absolute bottom-[25%] right-[10%] text-gray-100 text-4xl font-black animate-pulse" style={{ animationDelay: "200ms" }}>???</span>
        <span className="absolute top-[45%] left-[5%] text-gray-100/60 text-3xl font-black animate-pulse" style={{ animationDelay: "600ms" }}>null</span>
        <span className="absolute top-[35%] right-[6%] text-gray-100/60 text-3xl font-black animate-pulse" style={{ animationDelay: "1000ms" }}>void</span>
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Giant 404 */}
        <div className="relative mb-6">
          <h1 className="text-[160px] sm:text-[200px] font-black leading-none tracking-tighter text-black">
            4
            <span className="relative inline-block">
              <span className="text-[#FF760D]">0</span>
              {/* Magnifying glass effect on the zero */}
              <svg
                className="absolute -top-2 -right-4 w-10 h-10 text-gray-300 rotate-[30deg]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            4
          </h1>
        </div>

        {/* Fun copy */}
        <p className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
          Even AI couldn&apos;t find this page
        </p>
        <p className="text-sm sm:text-base text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
          We asked ChatGPT, Gemini, Claude, and Perplexity. They all hallucinated a different answer.
          <br />
          The truth is — this page simply doesn&apos;t exist.
        </p>

        {/* AI model "responses" — fun fake quotes */}
        <div className="space-y-3 mb-10 text-left max-w-sm mx-auto">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-black flex-shrink-0 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">G</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">ChatGPT</span>
              <p className="text-xs text-gray-600 mt-0.5 italic">&quot;The page you&apos;re looking for is definitely at this URL. Trust me.&quot;</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-[#FF760D] flex-shrink-0 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">G</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Gemini</span>
              <p className="text-xs text-gray-600 mt-0.5 italic">&quot;Based on my analysis, this page exists in 3 parallel universes — just not this one.&quot;</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-[#E3D8C8] flex-shrink-0 flex items-center justify-center">
              <span className="text-gray-800 text-[10px] font-bold">C</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Claude</span>
              <p className="text-xs text-gray-600 mt-0.5 italic">&quot;I&apos;d rather be honest — I have no idea where this page went.&quot;</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-black text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 text-sm font-medium px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            Go to Dashboard
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 text-center">
        <p className="text-xs text-gray-300">
          Soma AI · Be the brand AI recommends
        </p>
      </div>
    </div>
  )
}
