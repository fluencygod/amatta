import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Initialize mode (all/you) before rendering for CSS variables
try{
  const m = (typeof window !== 'undefined' && window.localStorage?.getItem('mode')) || 'all'
  const docEl = document.documentElement
  docEl.setAttribute('data-mode', m)
  if(m === 'you'){
    docEl.style.setProperty('--mode-r', '171')
    docEl.style.setProperty('--mode-g', '61')
    docEl.style.setProperty('--mode-b', '48')
  }else{
    docEl.style.setProperty('--mode-r', '114')
    docEl.style.setProperty('--mode-g', '136')
    docEl.style.setProperty('--mode-b', '134')
  }
}catch{}

const root = createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App/></React.StrictMode>)
