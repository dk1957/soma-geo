// Shared Header Component - Unified across all marketing pages
"use client"

import { useState } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function SiteHeader() {
  const { user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: "Solutions", href: "/solutions" },
    { name: "Contact Us", href: "/contact" },
    { name: "Blog", href: "/blog" },
    { name: "About", href: "/about" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-6 h-20 flex items-center">
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-black rounded text-white flex items-center justify-center text-lg font-bold">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground">Soma AI</span>
            <span className="text-xs text-muted-foreground/80 font-medium tracking-wider">AEO PLATFORM</span>
          </div>
        </Link>
        
        <nav className="hidden lg:flex items-center justify-center flex-1 space-x-10">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 text-base font-medium tracking-wide border-b-2 border-transparent hover:border-primary/30 pb-1"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="hidden lg:flex items-center space-x-4">
          {!user ? (
            <Button 
              asChild
              size="default" 
              className="bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300"
            >
              <Link href="/free-audit">Get A Free Brand Audit</Link>
            </Button>
          ) : (
            <Button 
              asChild
              size="default" 
              className="bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300"
            >
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
        
        {/* Mobile */}
        <div className="lg:hidden ml-auto flex items-center space-x-3">
          {!user ? (
            <Button 
              asChild
              className="bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300"
            >
              <Link href="/free-audit">Free Audit</Link>
            </Button>
          ) : (
            <Button 
              asChild
              className="bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/20 bg-background/95 backdrop-blur-xl py-4 px-6">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-border/20 mt-4 pt-4 space-y-2">
            {!user ? (
              <Link href="/free-audit" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300">
                  Get A Free Brand Audit
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}