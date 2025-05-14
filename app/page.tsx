"use client"

import { useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { JsonViewer } from "@/components/json-viewer"
import { ApiSender } from "@/components/api-sender"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")

  const handleExport = () => {
    if (data.length === 0) return

    // Create JSON file for download
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${fileName.split(".")[0] || "export"}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col items-center justify-center mb-10">
        <h1 className="text-3xl font-bold mb-6">Excel/CSV to JSON Converter</h1>
        <p className="text-gray-600 text-center max-w-2xl mb-8">
          Upload your Excel (.xlsx) or CSV file to convert it to JSON. The first row will be used as keys for each
          object.
        </p>

        <FileUploader setData={setData} setColumns={setColumns} setFileName={setFileName} />
      </div>

      {data.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">JSON from: {fileName}</h2>
            <div className="flex gap-2">
              <Button onClick={handleExport} className="flex items-center gap-2">
                <Download size={16} />
                Export as JSON
              </Button>
            </div>
          </div>

          <ApiSender data={data} fileName={fileName} />

          <JsonViewer data={data} fileName={fileName} />
        </div>
      )}
    </main>
  )
}
