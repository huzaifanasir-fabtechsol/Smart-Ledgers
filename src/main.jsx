import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installEnterNavigation } from './enterNavigation.js'

installEnterNavigation()

createRoot(document.getElementById('root')).render(
  <App />
)
