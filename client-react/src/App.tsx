import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Pacientes from './components/Pacientes'
import Sesiones from './components/Sesiones'
import Calendario from './components/Calendario'
import Inventario from './components/Inventario'
import Admin from './components/Admin'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/sesiones" element={<Sesiones />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/doctores" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/pacientes" replace />} />
      </Routes>
    </>
  )
}

export default App
