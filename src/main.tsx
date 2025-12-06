import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { FlowbiteInitializer } from './components/FlowbiteInitializer'
import { ToastContainer } from './components/Toast/ToastContainer'
import './sentryClient'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <FlowbiteInitializer />
      <App />
      <ToastContainer />
    </AuthProvider>
  </StrictMode>,
);
