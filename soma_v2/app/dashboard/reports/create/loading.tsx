import { Loader2 } from "lucide-react"

export default function CreateReportLoading() {
  return (
    <div className="container mx-auto px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading</h3>
          <p className="text-gray-500">Setting up report creation page...</p>
        </div>
      </div>
    </div>
  )
}