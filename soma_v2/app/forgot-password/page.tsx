"use client"

import { Suspense } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import Link from "next/link"

function ForgotPasswordContent() {
  const { isLoaded, signIn } = useSignIn()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setIsLoading(true)
    setError("")

    try {
      // Start the password reset flow with Clerk
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })
      setIsSubmitted(true)
    } catch (err: any) {
      console.error("Password reset error:", err)
      // Don't reveal if the email exists or not for security
      setIsSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground">Soma AI</span>
                <span className="text-xs text-muted-foreground/80 font-medium tracking-wider">GEO PLATFORM</span>
              </div>
            </Link>
          </div>

          <Card className="border-border shadow-none">
            <CardHeader className="px-0 pt-0">
              <Link href="/signin" className="flex items-center text-muted-foreground hover:text-foreground mb-4 text-sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </Link>
              <CardTitle className="text-2xl font-bold">
                {isSubmitted ? "Check your email" : "Forgot your password?"}
              </CardTitle>
              <CardDescription className="text-base">
                {isSubmitted
                  ? "We've sent a password reset code to your email address."
                  : "Enter your email address and we'll send you a code to reset your password."}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      disabled={isLoading}
                      className="h-14 border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-base"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-base font-medium"
                    disabled={isLoading || !isLoaded}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      If an account with <strong>{email}</strong> exists, we've sent you a password reset code.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check your email and use the code to reset your password.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button asChild className="w-full h-14 text-base font-medium">
                      <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
                        Enter Reset Code
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full h-14 text-base font-medium bg-transparent">
                      <Link href="/signin">Back to Sign In</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column - Branding */}
      <div className="hidden lg:flex flex-1 bg-gray-50 text-black relative overflow-hidden border-l border-gray-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>

        <div className="flex flex-col justify-center px-16 xl:px-24 w-full relative z-10">
          <div className="space-y-6">
            <div className="w-12 h-1 bg-black"></div>
            
            <h2 className="text-4xl xl:text-5xl font-light tracking-tight leading-tight text-black">
              Secure access to
              <span className="block font-bold mt-2">your insights</span>
            </h2>
            
            <p className="text-lg text-gray-600 font-light leading-relaxed max-w-md">
              We'll help you get back into your account quickly and securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
