// Punto de entrada de React. Aca se "monta" el componente raiz (App)
// dentro del <div id="root"> que esta en index.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
