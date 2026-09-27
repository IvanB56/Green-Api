import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getStateInstance } from '../api/greenApi'
import type { Credentials } from '../types'

const STORAGE_KEY = 'max-chat:auth'

interface LoginInput {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

interface AuthContextValue {
  credentials: Credentials | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<boolean>
  logout: () => void
  isChecking: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredAuth(): Credentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Credentials) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadStoredAuth())
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (credentials) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [credentials])

  const login = useCallback(async ({ apiUrl, idInstance, apiTokenInstance }: LoginInput) => {
    setError(null)
    setIsChecking(true)
    const nextCredentials: Credentials = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    try {
      const state = await getStateInstance(nextCredentials)
      if (state?.stateInstance && state.stateInstance !== 'authorized') {
        throw new Error(
          `Инстанс не авторизован (статус: ${state.stateInstance}). Отсканируйте QR-код в личном кабинете GREEN-API.`,
        )
      }
      setCredentials(nextCredentials)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось проверить учетные данные')
      return false
    } finally {
      setIsChecking(false)
    }
  }, [])

  const logout = useCallback(() => {
    setCredentials(null)
    setError(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ credentials, isAuthenticated: Boolean(credentials), login, logout, isChecking, error }),
    [credentials, login, logout, isChecking, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider')
  return ctx
}
