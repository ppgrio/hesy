import { useState } from 'react'
import AdminSection from './AdminSection'
import type { SectionConfig } from './AdminSection'
import '../shared/crud.css'
import './Admin.css'

const sections: SectionConfig[] = [
  {
    title: 'Doctores',
    apiUrl: '/api/doctor',
    fieldKey: 'nombre',
    fieldLabel: 'Nombre',
    fieldPlaceholder: 'Nombre del doctor',
    entityName: 'Doctor',
    maxLength: 20,
    defaultSortDir: 'asc',
  },
  {
    title: 'Accesos',
    apiUrl: '/api/accesos',
    fieldKey: 'tipo',
    fieldLabel: 'Tipo',
    fieldPlaceholder: 'Tipo de acceso',
    entityName: 'Acceso',
    maxLength: 5,
  },
  {
    title: 'Áreas',
    apiUrl: '/api/areas',
    fieldKey: 'nombre',
    fieldLabel: 'Nombre',
    fieldPlaceholder: 'Nombre del área',
    entityName: 'Área',
    maxLength: 30,
  },
  {
    title: 'Filtros',
    apiUrl: '/api/filtros',
    fieldKey: 'estado',
    fieldLabel: 'Estado',
    fieldPlaceholder: 'Estado del filtro',
    entityName: 'Filtro',
    maxLength: 10,
  },
]

function Admin() {
  const [tab, setTab] = useState(0)

  return (
    <section id="patients-page">
      <h1>Admin</h1>

      <div className="admin-tabs">
        {sections.map((s, i) => (
          <button
            key={i}
            className={`admin-tab${i === tab ? ' active' : ''}`}
            onClick={() => setTab(i)}
          >
            {s.title}
          </button>
        ))}
      </div>

      <AdminSection config={sections[tab]} />
    </section>
  )
}

export default Admin
