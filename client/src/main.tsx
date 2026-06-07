import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress specific antd warnings in console
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    (args[0].includes('[antd: message]') || args[0].includes('[antd: List]'))
  ) {
    return;
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    (args[0].includes('[antd: message]') || args[0].includes('[antd: List]'))
  ) {
    return;
  }
  originalError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
