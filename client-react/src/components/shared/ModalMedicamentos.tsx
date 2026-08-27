import { useMemo } from 'react'
import { normalizar } from './utils'
import './ModalMedicamentos.css'

interface SessionMinima {
  id: number
  paciente_nombre: string | null
  fecha_hora: string | null
}

interface InventarioItem {
  id: number
  nombre: string
  cantidad: number
}

interface MedicamentoUso {
  id: number
  inventario_id: number
  nombre: string | null
  cantidad_usada: number
  stock_disponible: number
}

interface Props {
  session: SessionMinima | null
  medicamentos: MedicamentoUso[]
  inventarioItems: InventarioItem[]
  busqueda: string
  onBusquedaChange: (t: string) => void
  cantidad: number
  onCantidadChange: (n: number) => void
  cargando: boolean
  onClose: () => void
  onAgregarMedicamento: (item: InventarioItem) => void
  onQuitarMedicamento: (uso: MedicamentoUso) => void
}

function ModalMedicamentos({
  session, medicamentos, inventarioItems,
  busqueda, onBusquedaChange, cantidad, onCantidadChange,
  cargando, onClose, onAgregarMedicamento, onQuitarMedicamento,
}: Props) {
  const resultadosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return []
    const q = normalizar(busqueda)
    return inventarioItems.filter(i =>
      i.cantidad > 0 && normalizar(i.nombre).includes(q)
    )
  }, [busqueda, inventarioItems])

  if (!session) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Medicamentos — {session.paciente_nombre || '—'}
            <span className="modal-hora">
              {session.fecha_hora
                ? new Date(session.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                : ''}
            </span>
          </h2>
          <button className="modal-cerrar" onClick={onClose}>×</button>
        </div>

        {cargando ? (
          <p className="modal-cargando">Cargando medicamentos...</p>
        ) : (
          <>
            <div className="modal-lista">
              {medicamentos.length === 0 ? (
                <p className="modal-vacio">Sin medicamentos registrados</p>
              ) : (
                medicamentos.map(u => (
                  <div key={u.id} className="modal-item">
                    <span className="modal-item-nombre">{u.nombre || '—'}</span>
                    <span className="modal-item-cantidad">{u.cantidad_usada}</span>
                    <button className="modal-item-quitar" onClick={() => onQuitarMedicamento(u)}>Quitar</button>
                  </div>
                ))
              )}
            </div>

            <div className="modal-agregar">
              <h3>Agregar medicamento</h3>
              <div className="modal-agregar-fila">
                <div className="modal-busqueda-wrapper">
                  <input
                    type="text"
                    placeholder="Buscar medicamento..."
                    value={busqueda}
                    onChange={e => onBusquedaChange(e.target.value)}
                  />
                  {busqueda && (
                    <div className="modal-resultados">
                      {resultadosBusqueda.length > 0 ? (
                        resultadosBusqueda.slice(0, 10).map(item => (
                          <button
                            key={item.id}
                            className="modal-resultado-item"
                            onClick={() => { onCantidadChange(1); onAgregarMedicamento(item) }}
                          >
                            <span className="modal-resultado-nombre">{item.nombre}</span>
                            <span className="modal-resultado-stock">{item.cantidad} disp.</span>
                          </button>
                        ))
                      ) : (
                        <div className="modal-resultados-vacio">Sin resultados</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-cantidad-wrapper">
                  <label>Cant:</label>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={e => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ModalMedicamentos
