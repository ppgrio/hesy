import { NavLink } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Hesy</span>
      <div className="navbar-links">
        <NavLink to="/pacientes" className={({ isActive }) => isActive ? 'active' : ''}>
          Pacientes
        </NavLink>
        <NavLink to="/sesiones" className={({ isActive }) => isActive ? 'active' : ''}>
          Sesiones
        </NavLink>
        <NavLink to="/doctores" className={({ isActive }) => isActive ? 'active' : ''}>
          Doctores
        </NavLink>
        <NavLink to="/calendario" className={({ isActive }) => isActive ? 'active' : ''}>
          Calendario
        </NavLink>
      </div>
    </nav>
  )
}

export default Navbar
