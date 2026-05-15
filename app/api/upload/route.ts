import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"

// In-memory image store
const imageStore = new Map<string, string>()

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type || "image/jpeg"
    const dataUrl = `data:${mimeType};base64,${base64}`

    const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    imageStore.set(imageId, dataUrl)

    return NextResponse.json({ imageUrl: dataUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    )
  }
}
