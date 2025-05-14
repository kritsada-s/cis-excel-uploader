import * as XLSX from "xlsx"
import Papa from "papaparse"

export async function parseExcelFile(file: File): Promise<{ data: any[]; columns: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (jsonData.length === 0) {
          reject(new Error("The file appears to be empty."))
          return
        }

        // Create columns from the first row
        const columns = Object.keys(jsonData[0]).map((key) => ({
          accessorKey: key,
          header: key,
        }))

        resolve({ data: jsonData, columns })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    reader.readAsBinaryString(file)
  })
}

export async function parseCsvFile(file: File): Promise<{ data: any[]; columns: any[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]

        if (data.length === 0) {
          reject(new Error("The file appears to be empty."))
          return
        }

        // Create columns from the first row
        const columns = Object.keys(data[0]).map((key) => ({
          accessorKey: key,
          header: key,
        }))

        resolve({ data, columns })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
