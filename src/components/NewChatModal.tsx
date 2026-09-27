import { useState, type FormEvent, type MouseEvent } from 'react'

interface NewChatModalProps {
  onClose: () => void
  onCreate: (phone: string, name: string) => void
}

export default function NewChatModal({ onClose, onCreate }: NewChatModalProps) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (!digits) return
    onCreate(digits, name)
  }

  const stopPropagation = (e: MouseEvent<HTMLFormElement>) => e.stopPropagation()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={stopPropagation} onSubmit={handleSubmit}>
        <h2>Новый чат</h2>

        <label className="field">
          <span>Номер телефона получателя</span>
          <input
            type="tel"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79991234567"
            required
          />
        </label>

        <label className="field">
          <span>Имя (необязательно)</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как назвать чат" />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn-primary">
            Создать
          </button>
        </div>
      </form>
    </div>
  )
}
