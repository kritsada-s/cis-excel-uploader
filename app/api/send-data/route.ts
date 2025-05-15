import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const response = await fetch('https://api.assetwise.co.th/cis/api/Customer/SaveOtherSource', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic YXN3X2Npc19jdXN0b21lcjphc3dfY2lzX2N1c3RvbWVyQDIwMjMh'
      },
      body: JSON.stringify(data)
    })

    const result = await response.text()
    
    if (!response.ok) {
      return NextResponse.json({ error: result }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 