import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login, isChecking, error } = useAuth()
  const [apiUrl, setApiUrl] = useState('https://api.green-api.com')
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError(null)
    if (!idInstance.trim() || !apiTokenInstance.trim() || !apiUrl.trim()) return
    if (!/^\d+$/.test(idInstance.trim())) {
      setValidationError('idInstance должен содержать только цифры')
      return
    }
    await login({ apiUrl, idInstance, apiTokenInstance })
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">MAX</div>
        <h1>Вход в чат</h1>
        <p className="login-subtitle">Введите данные вашего инстанса GREEN-API</p>

        <label className="field">
          <span>apiUrl</span>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.green-api.com"
            required
          />
        </label>

        <label className="field">
          <span>idInstance</span>
          <input
            type="text"
            inputMode="numeric"
            value={idInstance}
            onChange={(e) => {
              setIdInstance(e.target.value)
              setValidationError(null)
            }}
            placeholder="1101000001"
            required
          />
        </label>

        <label className="field">
          <span>apiTokenInstance</span>
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Токен доступа"
            required
          />
        </label>

        {(validationError || error) && <div className="login-error">{validationError || error}</div>}

        <button type="submit" className="btn-primary" disabled={isChecking}>
          {isChecking ? 'Проверка...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
