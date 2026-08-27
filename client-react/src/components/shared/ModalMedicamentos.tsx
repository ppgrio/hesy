import { useEffect, useState } from 'react'
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
  precio: number | null
}

interface MedicamentoUso {
  id: number
  inventario_id: number
  nombre: string | null
  cantidad_usada: number
  precio: number | null
  stock_disponible: number
}

interface Props {
  session: SessionMinima | null
  medicamentos: MedicamentoUso[]
  cantidad: number
  onCantidadChange: (n: number) => void
  cargando: boolean
  onClose: () => void
  onAgregarMedicamento: (item: InventarioItem) => void
  onQuitarMedicamento: (uso: MedicamentoUso) => void
  precioBase?: number | null
  buscarMedicamentos: (q: string) => Promise<InventarioItem[]>
}

function fmtPrecio(p: number | null | undefined): string {
  if (p == null) return ''
  return `$${p.toFixed(2)}`
}

function ModalMedicamentos({
  session, medicamentos, cantidad, onCantidadChange,
  cargando, onClose, onAgregarMedicamento, onQuitarMedicamento,
  precioBase = null, buscarMedicamentos,
}: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<InventarioItem[]>([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    setBusqueda('')
    setResultados([])
    setBuscando(false)
  }, [session?.id])

  useEffect(() => {
    const q = busqueda.trim()
    if (!q) {
      setResultados([])
      setBuscando(false)
      return
    }
    let activo = true
    setBuscando(true)
    const timer = setTimeout(() => {
      buscarMedicamentos(q)
        .then(items => { if (activo) setResultados(items) })
        .catch(() => { if (activo) setResultados([]) })
        .finally(() => { if (activo) setBuscando(false) })
    }, 250)
    return () => { activo = false; clearTimeout(timer) }
  }, [busqueda, buscarMedicamentos])

  const totalMedicamentos = medicamentos.reduce(
    (acc, u) => acc + ((u.precio ?? 0) * u.cantidad_usada),
    0
  )
  const totalSesion = (precioBase ?? 0) + totalMedicamentos

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
                    <span className="modal-item-precio">
                      {u.precio != null ? `$${(u.precio * u.cantidad_usada).toFixed(2)}` : '—'}
                    </span>
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
                    onChange={e => setBusqueda(e.target.value)}
                  />
                  {busqueda.trim() && (
                    <div className="modal-resultados">
                      {buscando ? (
                        <div className="modal-resultados-vacio">Buscando...</div>
                      ) : resultados.length > 0 ? (
                        resultados.map(item => (
                          <button
                            key={item.id}
                            className="modal-resultado-item"
                            onClick={() => { onCantidadChange(1); onAgregarMedicamento(item) }}
                          >
                            <span className="modal-resultado-nombre">{item.nombre}</span>
                            <span className="modal-resultado-stock">{fmtPrecio(item.precio)} · {item.cantidad} disp.</span>
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

            <div className="modal-total">
              {precioBase != null && (
                <span className="modal-total-fila">
                  Consulta: <b>{fmtPrecio(precioBase)}</b>
                </span>
              )}
              {totalMedicamentos > 0 && (
                <span className="modal-total-fila">
                  Medicamentos: <b>{fmtPrecio(totalMedicamentos)}</b>
                </span>
              )}
              <span className="modal-total-fila modal-total-grande">
                Total de la sesión: <b>{fmtPrecio(totalSesion)}</b>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ModalMedicamentos
