"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
        })

        if (!response.ok) {
          setIsAuthenticated(false)
          return
        }

        const data = await response.json()
        setIsAuthenticated(Boolean(data.authenticated))
      } catch (error) {
        console.error("Erro ao validar sessão do admin:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    void loadSession()
  }, [])

  const login = async (password: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        setIsAuthenticated(false)
        return false
      }

      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error("Erro ao fazer login no admin:", error)
      setIsAuthenticated(false)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Erro ao encerrar sessão do admin:", error)
    }

    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
