import { NextResponse } from "next/server"
import {
  getAdminSessionCookie,
  isAdminPasswordValid,
} from "@/lib/admin-auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const password =
      typeof body?.password === "string" ? body.password.trim() : ""

    if (!password || !isAdminPasswordValid(password)) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(getAdminSessionCookie())
    return response
  } catch (error) {
    console.error("Erro ao autenticar admin:", error)
    return NextResponse.json(
      { error: "Erro ao validar acesso" },
      { status: 500 }
    )
  }
}
