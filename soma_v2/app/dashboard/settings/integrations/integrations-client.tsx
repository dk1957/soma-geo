"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useToast } from "@/components/layout/notification-toast"
import { useSearchParams } from 'next/navigation'

export default function IntegrationsClient() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const { addToast, ToastContainer } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      addToast({
        type: 'success',
        title: 'Successfully connected to Google Search Console!',
        message: 'You can now import your sitemaps.'
      })
    }
    if (error) {
       addToast({
        type: 'error',
        title: 'Connection failed',
        message: 'Could not connect to Google Search Console. Please try again.'
      })
    }
  }, [searchParams, addToast])

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/integrations/gsc/status')
        const data = await response.json()
        setIsConnected(data.connected)
      } catch (error) {
        console.error("Failed to fetch GSC status", error)
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [])

  return (
    <div className="space-y-6">
      <ToastContainer />
      <Card>
        <CardHeader>
          <CardTitle>Google Search Console</CardTitle>
          <CardDescription>
            Connect your Google Search Console account to import your sitemaps and get keyword insights directly from the source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-10 flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : isConnected ? (
            <div className="flex items-center space-x-2 text-green-600 font-medium p-2 border border-green-200 bg-green-50 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span>Connected to Google Search Console</span>
            </div>
          ) : (
            <Link href="/api/integrations/gsc/connect" passHref>
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect to Google Search Console
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
