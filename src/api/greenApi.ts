import type {
  Credentials,
  DeleteNotificationResponse,
  GetStateInstanceResponse,
  ReceiveNotificationResponse,
  SendMessageResponse,
} from '../types'

function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '')
}

function buildBaseUrl({ apiUrl, idInstance }: Credentials): string {
  return `${normalizeApiUrl(apiUrl)}/waInstance${idInstance}`
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export class GreenApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, options)
  } catch {
    throw new GreenApiError('Не удалось подключиться к серверу GREEN-API. Проверьте apiUrl и подключение к сети.', 0)
  }
  const data = await parseJsonSafe(response)
  if (!response.ok) {
    const dataObject = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
    const message =
      dataObject?.message ||
      dataObject?.error ||
      (typeof data === 'string' && data) ||
      `Ошибка запроса (HTTP ${response.status})`
    throw new GreenApiError(String(message), response.status)
  }
  return data as T
}

export async function getStateInstance(credentials: Credentials): Promise<GetStateInstanceResponse> {
  const url = `${buildBaseUrl(credentials)}/getStateInstance/${credentials.apiTokenInstance}`
  return request<GetStateInstanceResponse>(url, { method: 'GET' })
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const url = `${buildBaseUrl(credentials)}/sendMessage/${credentials.apiTokenInstance}`
  return request<SendMessageResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 20,
  signal?: AbortSignal,
): Promise<ReceiveNotificationResponse | null> {
  const url = `${buildBaseUrl(credentials)}/receiveNotification/${credentials.apiTokenInstance}?receiveTimeout=${receiveTimeout}`
  return request<ReceiveNotificationResponse | null>(url, { method: 'GET', signal })
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<DeleteNotificationResponse> {
  const url = `${buildBaseUrl(credentials)}/deleteNotification/${credentials.apiTokenInstance}/${receiptId}`
  return request<DeleteNotificationResponse>(url, { method: 'DELETE' })
}

export function phoneToChatId(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@c.us`
}