"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

interface JsonViewerProps {
  data: any[]
  fileName: string
}

export function JsonViewer({ data, fileName }: JsonViewerProps) {
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  const filteredData = searchTerm
    ? data.filter((item) => JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))
    : data

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const isExpanded = (index: number) => expandedItems[index] || false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search JSON..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy JSON"}
        </Button>
      </div>

      <Card className="p-4 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-[70vh]">
        <div className="font-mono text-sm">
          <div className="mb-2">[</div>
          {filteredData.map((item, index) => (
            <div key={index} className="ml-4 mb-2">
              <div className="flex items-start">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-2" onClick={() => toggleExpand(index)}>
                  {isExpanded(index) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <div>
                  {isExpanded(index) ? (
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(item, null, 2)}</pre>
                  ) : (
                    <div className="truncate max-w-[calc(100vw-200px)]">{JSON.stringify(item)}</div>
                  )}
                </div>
              </div>
              {index < filteredData.length - 1 && <span>,</span>}
            </div>
          ))}
          <div>]</div>
        </div>
      </Card>

      <div className="text-sm text-gray-500">
        Showing {filteredData.length} of {data.length} items from {fileName}
      </div>
    </div>
  )
}
