"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import Papa, { ParseResult } from "papaparse"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploaderProps {
  setData: (data: any[]) => void
  setColumns: (columns: any[]) => void
  setFileName: (name: string) => void
}

export function FileUploader({ setData, setColumns, setFileName }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Helper function to format date to "YYYY-MM-DD HH:MM:SS"
  const formatDate = (dateValue: any): string | null => {
    if (!dateValue) return null

    try {
      // Check if dateValue is already a string in the correct format
      if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateValue)) {
        return dateValue
      }

      let date: Date

      // Handle Excel date serial number (e.g., 45787.19525462963)
      if (typeof dateValue === "number" || (typeof dateValue === "string" && !isNaN(Number(dateValue)))) {
        const excelDateValue = typeof dateValue === "number" ? dateValue : Number(dateValue)

        // Check if it's likely an Excel date (reasonable range for modern dates)
        if (excelDateValue > 0 && excelDateValue < 50000) {
          // Excel dates: days since 1900-01-01 (or 1904-01-01 on Mac)
          // For simplicity, we'll assume the 1900 date system

          // Get the integer part (days) and decimal part (time)
          const days = Math.floor(excelDateValue)
          const timeFraction = excelDateValue - days

          // Excel has a leap year bug where it thinks 1900 was a leap year
          // So we need to adjust for dates after February 28, 1900
          const adjustedDays = days > 60 ? days - 1 : days

          // Create a base date (January 1, 1900)
          date = new Date(1900, 0, 1)

          // Add the days
          date.setDate(date.getDate() + adjustedDays - 1) // -1 because Excel day 1 is Jan 1, 1900

          // Add the time
          // Convert fraction of day to milliseconds
          const millisInDay = 24 * 60 * 60 * 1000
          const timeMs = Math.round(timeFraction * millisInDay)

          // Set the time components
          const hours = Math.floor(timeMs / (60 * 60 * 1000))
          const minutes = Math.floor((timeMs % (60 * 60 * 1000)) / (60 * 1000))
          const seconds = Math.floor((timeMs % (60 * 1000)) / 1000)

          date.setHours(hours, minutes, seconds, 0)
        } else {
          // Not an Excel date, try standard parsing
          date = new Date(excelDateValue)
        }
      } else if (typeof dateValue === "string") {
        // Handle common date formats like "10/5/2025 13:23:55"
        const dateTimeParts = dateValue.split(/[\s]+/)
        if (dateTimeParts.length >= 1) {
          const datePart = dateTimeParts[0]
          const timePart = dateTimeParts.length > 1 ? dateTimeParts[1] : "00:00:00"

          // Parse date part (handles both MM/DD/YYYY and DD/MM/YYYY)
          const dateParts = datePart.split(/[/\-.]+/)
          if (dateParts.length === 3) {
            // Determine if it's MM/DD/YYYY or DD/MM/YYYY
            // For simplicity, we'll assume if the first number is > 12, it's DD/MM/YYYY
            let month: number, day: number, year: number

            if (Number.parseInt(dateParts[0]) > 12) {
              // DD/MM/YYYY format
              day = Number.parseInt(dateParts[0])
              month = Number.parseInt(dateParts[1]) - 1 // JS months are 0-indexed
              year = Number.parseInt(dateParts[2])
            } else {
              // MM/DD/YYYY format (default assumption)
              month = Number.parseInt(dateParts[0]) - 1 // JS months are 0-indexed
              day = Number.parseInt(dateParts[1])
              year = Number.parseInt(dateParts[2])
            }

            // Parse time part
            const timeParts = timePart.split(":")
            const hours = timeParts.length > 0 ? Number.parseInt(timeParts[0]) : 0
            const minutes = timeParts.length > 1 ? Number.parseInt(timeParts[1]) : 0
            const seconds = timeParts.length > 2 ? Number.parseInt(timeParts[2]) : 0

            // Create date object with explicit parts
            date = new Date(year, month, day, hours, minutes, seconds)
          } else {
            // Fallback to standard parsing
            date = new Date(dateValue)
          }
        } else {
          // Fallback to standard parsing
          date = new Date(dateValue)
        }
      } else if (dateValue instanceof Date) {
        date = dateValue
      } else {
        // Try to convert to string and parse
        date = new Date(String(dateValue))
      }

      // Check if date is valid
      if (isNaN(date.getTime())) return dateValue

      // Format to YYYY-MM-DD HH:MM:SS
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      const seconds = String(date.getSeconds()).padStart(2, "0")

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (e) {
      // If parsing fails, return the original value
      return dateValue
    }
  }

  const processFile = useCallback(
    async (file: File) => {
      setIsLoading(true)
      setError(null)
      setFileName(file.name)

      try {
        if (file.name.endsWith(".csv")) {
          // Process CSV file
          Papa.parse(file, {
            header: true, // This treats the first row as headers
            skipEmptyLines: true,
            complete: (results: ParseResult<any>) => {
              const data = results.data as any[]
              if (data.length === 0) {
                setError("The file appears to be empty.")
                setIsLoading(false)
                return
              }

              // Add fixed values to each object and utm_source from Ref column
              // Also format RefDate if it exists
              const enhancedData = data.map((item) => ({
                ...item,
                // Format RefDate if it exists
                ...(item.RefDate !== undefined && { RefDate: formatDate(item.RefDate) }),
                ContactChannelID: 53,
                FollowUpID: 42,
                ContactTypeID: 75,
                utm_source: item.Ref || null, // Add utm_source using Ref value
              }))

              setData(enhancedData)
              setColumns(
                Object.keys(enhancedData[0]).map((key) => ({
                  accessorKey: key,
                  header: key,
                })),
              )
              setIsLoading(false)
            },
            error: (error) => {
              setError(`Error parsing CSV: ${error.message}`)
              setIsLoading(false)
            },
          })
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          // Process Excel file
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const data = e.target?.result
              const workbook = XLSX.read(data, { type: "binary" })
              const sheetName = workbook.SheetNames[0]
              const worksheet = workbook.Sheets[sheetName]

              // Get the raw data with headers
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

              if (jsonData.length <= 1) {
                setError("The file appears to be empty or only contains headers.")
                setIsLoading(false)
                return
              }

              // Extract headers from the first row
              const headers = jsonData[0] as string[]

              // Find index of RefDate column if it exists
              const refDateIndex = headers.findIndex((header) => header === "RefDate")

              // Get the raw data to access the original cell values
              const rawData = XLSX.utils.sheet_to_json(worksheet, { header: headers, raw: true })

              // Create objects using headers as keys for each row
              const formattedData = rawData.slice(1).map((row: any) => {
                const obj: Record<string, any> = { ...row }

                // Format RefDate if it exists
                if (refDateIndex !== -1 && obj.RefDate !== undefined) {
                  obj.RefDate = formatDate(obj.RefDate)
                }

                // Add fixed values
                obj.ContactChannelID = 53
                obj.FollowUpID = 42
                obj.ContactTypeID = 75

                // Add utm_source using Ref value if it exists
                if (obj.Ref !== undefined) {
                  obj.utm_source = obj.Ref
                } else {
                  obj.utm_source = null
                }

                return obj
              })

              setData(formattedData)
              setColumns(
                headers.map((header) => ({
                  accessorKey: header,
                  header,
                })),
              )
              setIsLoading(false)
            } catch (error) {
              setError(`Error parsing Excel file: ${error instanceof Error ? error.message : "Unknown error"}`)
              setIsLoading(false)
            }
          }
          reader.onerror = () => {
            setError("Error reading file")
            setIsLoading(false)
          }
          reader.readAsBinaryString(file)
        } else {
          setError("Unsupported file format. Please upload .xlsx, .xls, or .csv files.")
          setIsLoading(false)
        }
      } catch (error) {
        setError(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`)
        setIsLoading(false)
      }
    },
    [setData, setColumns, setFileName],
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0])
      }
    },
    [processFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  })

  return (
    <div className="w-full max-w-xl">
      <Card
        {...getRootProps()}
        className={`p-8 border-dashed border-2 ${
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
        } rounded-lg cursor-pointer hover:border-primary transition-colors`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <FileSpreadsheet className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">Supports Excel (.xlsx, .xls) and CSV (.csv) files</p>
          <Button type="button" className="flex items-center gap-2" disabled={isLoading}>
            <Upload size={16} />
            {isLoading ? "Processing..." : "Browse files"}
          </Button>
        </div>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
