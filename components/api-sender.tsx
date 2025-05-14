"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Send, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ApiSenderProps {
  data: any[]
  fileName: string
}

export function ApiSender({ data, fileName }: ApiSenderProps) {
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 })
  const [errors, setErrors] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const sendData = async () => {
    if (isSending || data.length === 0) return

    setIsSending(true)
    setProgress(0)
    setResults({ success: 0, failed: 0 })
    setErrors([])
    setShowErrors(false)
    setIsComplete(false)

    const apiUrl = "https://api.assetwise.co.th/cis/api/Customer/SaveOtherSource"
    const authHeader = "Basic YXN3X2Npc19jdXN0b21lcjphc3dfY2lzX2N1c3RvbWVyQDIwMjMh"

    let successCount = 0
    let failedCount = 0
    const newErrors: string[] = []

    for (let i = 0; i < data.length; i++) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(data[i]),
        })

        console.log(data[i])

        if (response.ok) {
          successCount++
        } else {
          failedCount++
          const errorText = await response.text()
          newErrors.push(`Item ${i + 1}: ${errorText || response.statusText}`)
        }
      } catch (error) {
        failedCount++
        newErrors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      // Update progress
      const newProgress = Math.round(((i + 1) / data.length) * 100)
      setProgress(newProgress)
      setResults({ success: successCount, failed: failedCount })
    }

    setErrors(newErrors)
    setIsSending(false)
    setIsComplete(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={sendData} disabled={isSending || data.length === 0} className="flex items-center gap-2">
          <Send size={16} />
          {isSending ? "Sending..." : "Send to API"}
        </Button>

        {isComplete && (
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={16} />
              {results.success} successful
            </span>
            {results.failed > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle size={16} />
                {results.failed} failed
              </span>
            )}
          </div>
        )}
      </div>

      {isSending && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Sending data to API...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {isComplete && results.failed > 0 && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowErrors(!showErrors)} className="mb-2">
            {showErrors ? "Hide Errors" : "Show Errors"}
          </Button>

          {showErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to send {results.failed} items</AlertTitle>
              <AlertDescription>
                <div className="mt-2 max-h-40 overflow-auto text-sm">
                  {errors.map((error, index) => (
                    <div key={index} className="mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {isComplete && results.failed === 0 && results.success > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            All {results.success} items were successfully sent to the API.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
