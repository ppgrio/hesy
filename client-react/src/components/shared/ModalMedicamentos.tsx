import { useEffect, useState } from 'react'
import Cortina from './Cortina'
import './ModalMedicamentos.css'

interface SessionMinima {
  id: number
  paciente_nombre: string | null
  fecha_hora: string | null
  credito: number | null
  cobrado: boolean
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

interface Seleccion {
  item: InventarioItem
  cantidad: number
}

interface MetodoPago {
  id: number
  nombre: string
}

interface Abono {
  metodo_pago_id: number
  metodo: string
  monto: number
}

interface PagoRegistrado {
  id: number
  monto: number
  metodo: string | null
}

interface Props {
  session: SessionMinima | null
  medicamentos: MedicamentoUso[]
  cargando: boolean
  onClose: () => void
  onAgregarMedicamento: (item: InventarioItem, cantidad: number) => void
  onQuitarMedicamento: (uso: MedicamentoUso) => void
  precioBase?: number | null
  buscarMedicamentos: (q: string) => Promise<InventarioItem[]>
  onDescontarCredito?: (abonos: Abono[]) => Promise<unknown>
  onAbonar?: (abonos: Abono[]) => Promise<unknown>
}

function fmtPrecio(p: number | null | undefined): string {
  if (p == null) return ''
  return `$${p.toFixed(2)}`
}

function ModalMedicamentos({
  session, medicamentos, cargando, onClose, onAgregarMedicamento, onQuitarMedicamento,
  precioBase = null, buscarMedicamentos, onDescontarCredito, onAbonar,
}: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<InventarioItem[]>([])
  const [buscando, setBuscando] = useState(false)
  const [seleccion, setSeleccion] = useState<Seleccion[]>([])
  const [medAbierto, setMedAbierto] = useState(false)
  const [pagoAbierto, setPagoAbierto] = useState(true)
  const [abonarAbierto, setAbonarAbierto] = useState(false)
  const [descontando, setDescontando] = useState(false)
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [metodoId, setMetodoId] = useState('')
  const [monto, setMonto] = useState('')
  const [abonos, setAbonos] = useState<Abono[]>([])
  const [pagos, setPagos] = useState<PagoRegistrado[]>([])

  useEffect(() => {
    setBusqueda('')
    setResultados([])
    setBuscando(false)
    setSeleccion([])
    setMedAbierto(false)
    setPagoAbierto(true)
    setAbonarAbierto(false)
    setAbonos([])
    setMetodoId('')
    setMonto('')
    setPagos([])
  }, [session?.id])

  useEffect(() => {
    if (!session?.id) return
    let activo = true
    fetch(`/api/session/${session.id}/pagos`)
      .then(r => r.json())
      .then((data: PagoRegistrado[]) => { if (activo) setPagos(data) })
      .catch(() => {})
    return () => { activo = false }
  }, [session?.id])

  useEffect(() => {
    fetch('/api/metodos-pago')
      .then(r => r.json())
      .then((data: MetodoPago[]) => {
        setMetodos(data)
      })
      .catch(() => {})
  }, [])

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

  function agregarASeleccion(item: InventarioItem) {
    setSeleccion(prev => {
      const existe = prev.find(s => s.item.id === item.id)
      if (existe) return prev.map(s => (s.item.id === item.id ? { ...s, cantidad: s.cantidad + 1 } : s))
      return [...prev, { item, cantidad: 1 }]
    })
    setBusqueda('')
  }

  function cambiarCantidad(id: number, n: number) {
    setSeleccion(prev => prev.map(s => (s.item.id === id ? { ...s, cantidad: Math.max(1, n) } : s)))
  }

  function quitarSeleccion(id: number) {
    setSeleccion(prev => prev.filter(s => s.item.id !== id))
  }

  function confirmar() {
    if (seleccion.length === 0) return
    for (const s of seleccion) onAgregarMedicamento(s.item, s.cantidad)
    setSeleccion([])
    setMedAbierto(false)
    setPagoAbierto(true)
  }

  const totalMedicamentos = medicamentos.reduce(
    (acc, u) => acc + ((u.precio ?? 0) * u.cantidad_usada),
    0
  )
  const totalSesion = (precioBase ?? 0) + totalMedicamentos

  function descontar() {
    if (!onDescontarCredito || descontando) return
    setDescontando(true)
    onDescontarCredito(abonos)
      .then(() => { setAbonos([]) })
      .catch(() => {})
      .finally(() => setDescontando(false))
  }

  const [abonando, setAbonando] = useState(false)

  function abonar() {
    if (!onAbonar || abonando || abonos.length === 0) return
    setAbonando(true)
    onAbonar(abonos)
      .then(() => {
        setAbonos([])
        if (session) {
          fetch(`/api/session/${session.id}/pagos`)
            .then(r => r.json())
            .then((data: PagoRegistrado[]) => setPagos(data))
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setAbonando(false))
  }

  function agregarAbono() {
    const importe = parseFloat(monto)
    if (!metodoId || Number.isNaN(importe) || importe <= 0) return
    const metodo = metodos.find(m => m.id === Number(metodoId))
    setAbonos(prev => [...prev, {
      metodo_pago_id: Number(metodoId),
      metodo: metodo?.nombre ?? '—',
      monto: importe,
    }])
    setMonto('')
  }

  const totalAbonos = abonos.reduce((acc, a) => acc + a.monto, 0)

  if (!session) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {session.paciente_nombre || '—'}
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
            <Cortina titulo="Medicamentos" abierto={medAbierto} onToggle={() => setMedAbierto(a => !a)}>
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
                    {!session.cobrado && (
                      <button className="modal-item-quitar" onClick={() => onQuitarMedicamento(u)}>Quitar</button>
                    )}
                  </div>
                ))
              )}
            </div>

            {!session.cobrado && (
              <div className="modal-agregar">
                <h3>Agregar medicamento</h3>
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
                            className={`modal-resultado-item${seleccion.some(s => s.item.id === item.id) ? ' seleccionado' : ''}`}
                            onClick={() => agregarASeleccion(item)}
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

                {seleccion.length > 0 && (
                  <div className="modal-seleccion">
                    {seleccion.map(s => (
                      <div key={s.item.id} className="modal-item-seleccion">
                        <span className="modal-item-seleccion-nombre">{s.item.nombre}</span>
                        <div className="modal-stepper">
                          <button className="modal-stepper-btn" onClick={() => cambiarCantidad(s.item.id, s.cantidad - 1)}>−</button>
                          <span className="modal-stepper-valor">{s.cantidad}</span>
                          <button className="modal-stepper-btn" onClick={() => cambiarCantidad(s.item.id, s.cantidad + 1)}>+</button>
                        </div>
                        <button className="modal-item-seleccion-quitar" onClick={() => quitarSeleccion(s.item.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <button className="modal-confirmar" onClick={confirmar} disabled={seleccion.length === 0}>
                  Confirmar ({seleccion.length})
                </button>
              </div>
            )}
            </Cortina>

            <Cortina titulo="Pago" abierto={pagoAbierto} onToggle={() => setPagoAbierto(a => !a)}>
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
                  Total de la sesión: {fmtPrecio(totalSesion)}
                </span>
                {!session.cobrado && (
                  <>
                    <span className="modal-total-fila">
                      Crédito antes de la sesión: <b>{fmtPrecio(session.credito)}</b>
                    </span>
                    <span className="modal-total-fila">
                      Crédito después de la sesión: <b>{fmtPrecio((session.credito ?? 0) - totalSesion + totalAbonos)}</b>
                    </span>
                  </>
                )}
                {session.cobrado ? (
                  <span className="modal-total-fila modal-descontado">
                    Esta sesión ya fue cobrada del crédito
                  </span>
                ) : (
                  onDescontarCredito && (
                    <button
                      className="modal-confirmar"
                      onClick={descontar}
                      disabled={descontando}
                    >
                      {descontando ? 'Descontando...' : `Cobrar (${fmtPrecio(totalSesion)})`}
                    </button>
                  )
                )}
              </div>
            </Cortina>

            <Cortina titulo="Abonar" abierto={abonarAbierto} onToggle={() => setAbonarAbierto(a => !a)}>
              {pagos.length === 0 ? (
                <>
                  <div className="modal-abonar">
                    <div className="modal-abonar-controles">
                      <select
                        className="modal-abonar-select"
                        value={metodoId}
                        onChange={e => setMetodoId(e.target.value)}
                      >
                        <option value="">Ninguno</option>
                        {metodos.map(m => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Cantidad"
                        className="modal-abonar-monto"
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                      />
                      <button
                        className="modal-abonar-btn"
                        onClick={agregarAbono}
                        disabled={!metodoId || !(parseFloat(monto) > 0)}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                  <div className="modal-abonos-wrap">
                    <div className="modal-abonos">
                      {abonos.map((a, i) => (
                        <div key={i} className="modal-total-fila">
                          <span>{a.metodo}: <b>{fmtPrecio(a.monto)}</b></span>
                          <button
                            className="modal-abono-quitar"
                            onClick={() => setAbonos(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="modal-abonar-fila">
                      <span className="modal-total-grande">
                        Total abonado: {fmtPrecio(totalAbonos)}
                      </span>
                      <button
                        className="modal-confirmar modal-confirmar-auto"
                        type="button"
                        onClick={abonar}
                        disabled={!onAbonar || abonos.length === 0 || abonando}
                      >
                        {abonando ? 'Abonando...' : 'Abonar'}
                      </button>
                    </div>
                    <span className="modal-total-fila">
                      Crédito del paciente: <b>{fmtPrecio(session.credito)}</b>
                    </span>
                    <span className="modal-total-fila">
                      Crédito después del abono: <b>{fmtPrecio((session.credito ?? 0) + totalAbonos)}</b>
                    </span>
                  </div>
                </>
              ) : (
                <div className="modal-abonos">
                  {pagos.length === 0 ? (
                    <span className="modal-total-fila modal-descontado">
                      Sin abonos registrados
                    </span>
                  ) : (
                    <>
                      {pagos.map(p => (
                        <span key={p.id} className="modal-total-fila">
                          {p.metodo ?? '—'}: <b>{fmtPrecio(p.monto)}</b>
                        </span>
                      ))}
                      <span className="modal-total-fila modal-total-grande">
                        Total abonado: {fmtPrecio(pagos.reduce((acc, p) => acc + p.monto, 0))}
                      </span>
                      <span className="modal-total-fila">
                        Crédito del paciente: <b>{fmtPrecio(session.credito)}</b>
                      </span>
                    </>
                  )}
                </div>
              )}
            </Cortina>
          </>
        )}
      </div>
    </div>
  )
}

export default ModalMedicamentos
