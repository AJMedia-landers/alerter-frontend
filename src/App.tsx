import { useState } from 'react'
import { CronSync } from './components/CronSync'
import { AlertsConfig } from './components/AlertsConfig'
import { Login } from './components/Login'
import { AuthService } from './services/auth.service'
import './App.css'

type Tab = 'cron' | 'alerts'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('cron')
  const [isAuthenticated, setIsAuthenticated] = useState(() => AuthService.isAuthenticated())

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    AuthService.logout()
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-inner">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'cron' ? 'active' : ''}`}
              onClick={() => setActiveTab('cron')}
            >
              Cron Jobs
            </button>
            <button
              className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              Alerts Configuration
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="app-content">
        {activeTab === 'cron' && <CronSync />}
        {activeTab === 'alerts' && <AlertsConfig />}
      </main>
    </div>
  )
}

export default App
