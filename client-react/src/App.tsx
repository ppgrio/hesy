import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Pacientes from './components/Pacientes'
import Sesiones from './components/Sesiones'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/sesiones" element={<Sesiones />} />
        <Route path="*" element={<Navigate to="/pacientes" replace />} />
      </Routes>
    </>
  )
}

export default App
