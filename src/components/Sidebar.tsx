import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChats } from '../context/ChatsContext'
import NewChatModal from './NewChatModal'

function initials(title: string): string {
  return title.trim().slice(0, 1).toUpperCase() || '#'
}

export default function Sidebar() {
  const { logout } = useAuth()
  const { chatList, activeChatId, setActiveChatId, createChat } = useChats()
  const [isModalOpen, setModalOpen] = useState(false)

  const handleCreate = (phone: string, name: string) => {
    createChat(phone, name)
    setModalOpen(false)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Чаты</span>
        <div className="sidebar-header-actions">
          <button className="icon-btn" title="Новый чат" onClick={() => setModalOpen(true)}>
            +
          </button>
          <button className="icon-btn" title="Выйти" onClick={logout}>
            ⎋
          </button>
        </div>
      </div>

      <div className="chat-list">
        {chatList.length === 0 && <div className="chat-list-empty">Нет чатов. Создайте новый по кнопке «+».</div>}
        {chatList.map((chat) => {
          const lastMessage = chat.messages.at(-1)
          return (
            <button
              key={chat.chatId}
              className={`chat-list-item${chat.chatId === activeChatId ? ' active' : ''}`}
              onClick={() => setActiveChatId(chat.chatId)}
            >
              <div className="avatar">{initials(chat.title)}</div>
              <div className="chat-list-item-body">
                <div className="chat-list-item-title">{chat.title}</div>
                <div className="chat-list-item-preview">{lastMessage ? lastMessage.text : 'Нет сообщений'}</div>
              </div>
            </button>
          )
        })}
      </div>

      {isModalOpen && <NewChatModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />}
    </aside>
  )
}
