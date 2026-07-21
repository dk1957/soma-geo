// Shared Footer Component - Unified minimal style
import Link from "next/link"
import { SOCIAL_LINKS, ORG_CONTACT } from '@/lib/constants/contact'

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-12 px-6 bg-black border-t border-white/10 relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[size:20px_20px] opacity-50"></div>
      
      <div className="container mx-auto max-w-7xl flex flex-col gap-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
              <div className="h-8 w-8 bg-white rounded text-black flex items-center justify-center text-sm font-bold">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">Soma AI</span>
                <span className="text-xs text-gray-400 font-medium tracking-wider">AEO PLATFORM</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 tracking-wide font-medium">&copy; {currentYear} Soma AI. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1">Crafted for the future of marketing</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="font-medium text-gray-300">Connect:</span>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">X</a>
            <span className="text-gray-600">/</span>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
            {SOCIAL_LINKS.github && (
              <>
                <span className="text-gray-600">/</span>
                <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 border-t border-white/10 pt-6">
          <a href={`mailto:${ORG_CONTACT.email}`} className="hover:text-gray-300 transition-colors">{ORG_CONTACT.email}</a>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}