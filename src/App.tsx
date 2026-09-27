import { AuthProvider, useAuth } from './context/AuthContext'
import { ChatsProvider, useChats } from './context/ChatsContext'
import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

function PollingBanner() {
  const { pollingError } = useChats()
  if (!pollingError) return null
  return <div className="polling-banner">Проблема с получением сообщений: {pollingError}</div>
}

function ChatApp() {
  return (
    <ChatsProvider>
      <div className="app-shell">
        <PollingBanner />
        <div className="app-body">
          <Sidebar />
          <ChatWindow />
        </div>
      </div>
    </ChatsProvider>
  )
}

function Gate() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <ChatApp /> : <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
