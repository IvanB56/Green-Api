import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  deleteNotification,
  phoneToChatId,
  receiveNotification,
  sendMessage as apiSendMessage,
} from '../api/greenApi'
import { useAuth } from './AuthContext'
import type {
  Chat,
  ChatMessage,
  ChatsMap,
  MessageDirection,
  MessageStatus,
  ReceiveNotificationResponse,
} from '../types'

function storageKey(idInstance: string): string {
  return `max-chat:chats:${idInstance}`
}

function loadChats(idInstance: string): ChatsMap {
  try {
    const raw = localStorage.getItem(storageKey(idInstance))
    return raw ? (JSON.parse(raw) as ChatsMap) : {}
  } catch {
    return {}
  }
}

interface MakeMessageInput {
  text: string
  direction: MessageDirection
  status?: MessageStatus
  idMessage?: string
}

function makeMessage({ text, direction, status = 'sent', idMessage }: MakeMessageInput): ChatMessage {
  return {
    id: idMessage || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    direction,
    status,
    timestamp: Date.now(),
  }
}

interface ChatDefaults {
  phone?: string
  title?: string
}

interface ChatsContextValue {
  chats: ChatsMap
  chatList: Chat[]
  activeChatId: string | null
  activeChat: Chat | null
  setActiveChatId: (chatId: string | null) => void
  createChat: (phone: string, title?: string) => string
  sendMessage: (chatId: string, text: string) => Promise<void>
  pollingError: string | null
}

const ChatsContext = createContext<ChatsContextValue | null>(null)

export function ChatsProvider({ children }: { children: ReactNode }) {
  const { credentials, isAuthenticated } = useAuth()
  const idInstance = credentials?.idInstance

  const [chats, setChats] = useState<ChatsMap>(() => (idInstance ? loadChats(idInstance) : {}))
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [pollingError, setPollingError] = useState<string | null>(null)

  useEffect(() => {
    setChats(idInstance ? loadChats(idInstance) : {})
    setActiveChatId(null)
  }, [idInstance])

  useEffect(() => {
    if (!idInstance) return
    localStorage.setItem(storageKey(idInstance), JSON.stringify(chats))
  }, [chats, idInstance])

  const createChat = useCallback((phone: string, title?: string) => {
    const chatId = phoneToChatId(phone)
    setChats((prev) => {
      if (prev[chatId]) return prev
      return {
        ...prev,
        [chatId]: { chatId, phone: phone.replace(/\D/g, ''), title: title?.trim() || phone, messages: [] },
      }
    })
    setActiveChatId(chatId)
    return chatId
  }, [])

  const appendMessage = useCallback((chatId: string, message: ChatMessage, chatDefaults: ChatDefaults = {}) => {
    setChats((prev) => {
      const existing: Chat = prev[chatId] || {
        chatId,
        phone: chatDefaults.phone || chatId.replace(/@c\.us$/, ''),
        title: chatDefaults.title || chatDefaults.phone || chatId.replace(/@c\.us$/, ''),
        messages: [],
      }
      return {
        ...prev,
        [chatId]: { ...existing, messages: [...existing.messages, message] },
      }
    })
  }, [])

  const updateMessageStatus = useCallback((chatId: string, messageId: string, patch: Partial<ChatMessage>) => {
    setChats((prev) => {
      const chat = prev[chatId]
      if (!chat) return prev
      return {
        ...prev,
        [chatId]: {
          ...chat,
          messages: chat.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
        },
      }
    })
  }, [])

  const sendMessage = useCallback(
    async (chatId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !credentials) return
      const message = makeMessage({ text: trimmed, direction: 'out', status: 'sending' })
      appendMessage(chatId, message)
      try {
        const result = await apiSendMessage(credentials, chatId, trimmed)
        updateMessageStatus(chatId, message.id, { status: 'sent', id: result?.idMessage || message.id })
      } catch {
        updateMessageStatus(chatId, message.id, { status: 'error' })
      }
    },
    [credentials, appendMessage, updateMessageStatus],
  )

  const handleIncomingNotification = useCallback(
    (notification: ReceiveNotificationResponse) => {
      const body = notification?.body
      if (!body) return
      if (body.typeWebhook !== 'incomingMessageReceived') return
      if (body.messageData?.typeMessage !== 'textMessage') return

      const chatId = body.senderData?.chatId
      const text = body.messageData?.textMessageData?.textMessage
      if (!chatId || typeof text !== 'string') return

      const title = body.senderData?.chatName || body.senderData?.senderName || chatId.replace(/@c\.us$/, '')
      const phone = body.senderData?.senderPhoneNumber ? String(body.senderData.senderPhoneNumber) : undefined

      appendMessage(chatId, makeMessage({ text, direction: 'in', status: 'sent', idMessage: body.idMessage }), {
        title,
        phone,
      })
    },
    [appendMessage],
  )

  const handleIncomingNotificationRef = useRef(handleIncomingNotification)
  handleIncomingNotificationRef.current = handleIncomingNotification

  useEffect(() => {
    if (!isAuthenticated || !credentials) return undefined
    const activeCredentials = credentials
    let cancelled = false
    const controller = new AbortController()

    async function poll() {
      while (!cancelled) {
        try {
          const notification = await receiveNotification(activeCredentials, 20, controller.signal)
          if (cancelled) break
          if (notification) {
            handleIncomingNotificationRef.current(notification)
            try {
              await deleteNotification(activeCredentials, notification.receiptId)
            } catch {}
          }
          setPollingError(null)
        } catch (err) {
          if (cancelled || (err instanceof Error && err.name === 'AbortError')) break
          setPollingError(err instanceof Error ? err.message : 'Ошибка получения сообщений')
          await new Promise((resolve) => setTimeout(resolve, 4000))
        }
      }
    }

    poll()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [isAuthenticated, credentials])

  const chatList = useMemo<Chat[]>(
    () =>
      Object.values(chats).sort((a, b) => {
        const lastA = a.messages.at(-1)?.timestamp || 0
        const lastB = b.messages.at(-1)?.timestamp || 0
        return lastB - lastA
      }),
    [chats],
  )

  const value = useMemo<ChatsContextValue>(
    () => ({
      chats,
      chatList,
      activeChatId,
      activeChat: activeChatId ? chats[activeChatId] ?? null : null,
      setActiveChatId,
      createChat,
      sendMessage,
      pollingError,
    }),
    [chats, chatList, activeChatId, createChat, sendMessage, pollingError],
  )

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>
}

export function useChats(): ChatsContextValue {
  const ctx = useContext(ChatsContext)
  if (!ctx) throw new Error('useChats должен использоваться внутри ChatsProvider')
  return ctx
}
