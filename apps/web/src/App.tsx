import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import ForYou from './pages/ForYou'
import { track, trackDwell } from './lib/analytics'

function RouteTracker(){
  const loc = useLocation()
  const ref = React.useRef<{ path: string; start: number } | null>(null)

  React.useEffect(()=>{
    // on route change: send dwell for previous, page_in for current
    const now = Date.now()
    const prev = ref.current
    if (prev){ trackDwell(prev.start, prev.path) }
    ref.current = { path: loc.pathname, start: now }
    track('page_in', { page: loc.pathname })
    return () => {}
  }, [loc.pathname])

  React.useEffect(()=>{
    const onHide = () => {
      const cur = ref.current
      if (cur) trackDwell(cur.start, cur.path)
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return ()=>{
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
      const cur = ref.current
      if (cur) trackDwell(cur.start, cur.path)
    }
  }, [])
  return null
}

function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header/>
        <RouteTracker/>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/onboarding" element={<Onboarding/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/for-you" element={<ForYou/>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
