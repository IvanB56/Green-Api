export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessageDirection = 'in' | 'out'
export type MessageStatus = 'sending' | 'sent' | 'error'

export interface ChatMessage {
  id: string
  text: string
  direction: MessageDirection
  status: MessageStatus
  timestamp: number
}

export interface Chat {
  chatId: string
  phone: string
  title: string
  messages: ChatMessage[]
}

export type ChatsMap = Record<string, Chat>


export interface GetStateInstanceResponse {
  stateInstance: string
}

export interface SendMessageResponse {
  idMessage: string
}

export interface DeleteNotificationResponse {
  result: boolean
  reason: string
}

export interface SenderData {
  chatId: string
  chatName?: string
  chatType?: string
  sender?: string
  senderName?: string
  senderType?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

export interface TextMessageData {
  textMessage: string
  isForwarded?: boolean
  forwardingScore?: number
}

export interface MessageData {
  typeMessage: string
  textMessageData?: TextMessageData
  [key: string]: unknown
}

export interface InstanceData {
  idInstance: number
  wid: string
  typeInstance: string
}

export interface IncomingNotificationBody {
  typeWebhook: string
  instanceData: InstanceData
  timestamp: number
  idMessage: string
  senderData: SenderData
  messageData: MessageData
}

export interface ReceiveNotificationResponse {
  receiptId: number
  body: IncomingNotificationBody
}
