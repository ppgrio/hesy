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
        <NavLink to="/calendario" className={({ isActive }) => isActive ? 'active' : ''}>
          Calendario
        </NavLink>
        <NavLink to="/inventario" className={({ isActive }) => isActive ? 'active' : ''}>
          Inventario
        </NavLink>
        <NavLink to="/pagos" className={({ isActive }) => isActive ? 'active' : ''}>
          Pagos
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
          Admin
        </NavLink>
      </div>
    </nav>
  )
}

export default Navbar
