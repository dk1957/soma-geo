"use client"

import { Suspense } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

function ResetPasswordContent() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [step, setStep] = useState<"code" | "password" | "success">("code")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setIsLoading(true)
    setError("")

    try {
      // First, initiate the password reset if we have an email but no active signIn
      if (email && signIn.status !== "needs_first_factor") {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email,
        })
      }

      // Attempt to verify the code
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      })

      if (result.status === "needs_new_password") {
        setStep("password")
      }
    } catch (err: any) {
      console.error("Code verification error:", err)
      setError(err.errors?.[0]?.message || "Invalid or expired code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await signIn.resetPassword({
        password,
      })

      if (result.status === "complete") {
        // Set the session as active
        await setActive({ session: result.createdSessionId })
        setStep("success")
      }
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError(err.errors?.[0]?.message || "Failed to reset password. Please try again.")
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
              {step !== "success" && (
                <Link href="/forgot-password" className="flex items-center text-muted-foreground hover:text-foreground mb-4 text-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              )}
              <CardTitle className="text-2xl font-bold">
                {step === "code" && "Enter reset code"}
                {step === "password" && "Create new password"}
                {step === "success" && "Password updated"}
              </CardTitle>
              <CardDescription className="text-base">
                {step === "code" && "Enter the code we sent to your email address."}
                {step === "password" && "Enter your new password below."}
                {step === "success" && "Your password has been successfully updated."}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {step === "code" && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  {!searchParams.get("email") && (
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
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium">Reset Code</Label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      disabled={isLoading}
                      className="h-14 border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-base tracking-widest text-center"
                      maxLength={6}
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
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </form>
              )}

              {step === "password" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                      disabled={isLoading}
                      className="h-14 border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
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
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              )}

              {step === "success" && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can now sign in with your new password.
                  </p>
                  <Button asChild className="w-full h-14 text-base font-medium">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
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
              Secure your
              <span className="block font-bold mt-2">account access</span>
            </h2>
            
            <p className="text-lg text-gray-600 font-light leading-relaxed max-w-md">
              Create a strong password to protect your account and data.
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
