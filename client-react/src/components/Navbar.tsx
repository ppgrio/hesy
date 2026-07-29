import { NavLink } from 'react-router-dom'

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
      </div>
    </nav>
  )
}

export default Navbar
