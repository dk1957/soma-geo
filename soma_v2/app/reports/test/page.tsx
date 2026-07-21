'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RunReport } from '@/components/reports/run-report'
import { BarChart3, Search } from 'lucide-react'

export default function ReportsTestPage() {
  const [runId, setRunId] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportData, setReportData] = useState(null)

  const handleViewReport = () => {
    if (runId.trim()) {
      setShowReport(true)
    }
  }

  const handleReportLoaded = (data: any) => {
    setReportData(data)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">LLM Run Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive brand intelligence reports from run data
          </p>
        </div>
      </div>

      {!showReport ? (
        <Card>
          <CardHeader>
            <CardTitle>View Run Report</CardTitle>
            <CardDescription>
              Enter a run ID to generate a comprehensive brand intelligence report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter run ID (e.g., moneypoint-run-123)"
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleViewReport()}
              />
              <Button onClick={handleViewReport} disabled={!runId.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">💡 <strong>Try with a sample run:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use any run ID from your completed runs</li>
                <li>Reports include brand visibility, competitor analysis, AI model performance</li>
                <li>Detailed insights and actionable recommendations included</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Report: {runId}</h2>
              {reportData && (
                <p className="text-sm text-muted-foreground">
                  Brand: {(reportData as any).run?.brand_name || 'Unknown'}
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReport(false)
                setRunId('')
                setReportData(null)
              }}
            >
              Back to Search
            </Button>
          </div>
          
          <RunReport 
            runId={runId}
            onReportLoaded={handleReportLoaded}
          />
        </div>
      )}
    </div>
  )
}