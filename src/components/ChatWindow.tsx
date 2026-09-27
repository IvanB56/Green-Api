import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useChats } from '../context/ChatsContext'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWindow() {
  const { activeChat, sendMessage } = useChats()
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [activeChat?.messages.length, activeChat?.chatId])

  if (!activeChat) {
    return (
      <div className="chat-window chat-window-empty">
        <div>Выберите чат слева или создайте новый</div>
      </div>
    )
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(activeChat.chatId, text)
    setText('')
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="avatar">{activeChat.title.slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="chat-window-title">{activeChat.title}</div>
          <div className="chat-window-subtitle">{activeChat.phone}</div>
        </div>
      </div>

      <div className="chat-messages" ref={listRef}>
        {activeChat.messages.map((message) => (
          <div key={message.id} className={`message-row message-row-${message.direction}`}>
            <div className={`message-bubble message-bubble-${message.direction}`}>
              <span className="message-text">{message.text}</span>
              <span className="message-meta">
                {formatTime(message.timestamp)}
                {message.direction === 'out' && message.status === 'sending' && ' · отправка...'}
                {message.direction === 'out' && message.status === 'error' && ' · ошибка'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение..."
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={!text.trim()}>
          Отправить
        </button>
      </form>
    </div>
  )
}
