import { type ReactNode, type MouseEvent } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  titulo: string
  ancho?: boolean
  children: ReactNode
}

function CrudModal({ open, onClose, titulo, ancho, children }: Props) {
  if (!open) return null

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-contenido${ancho ? ' modal-ancho' : ''}`}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-cerrar" onClick={onClose}>×</button>
        </div>
        <div className="modal-cuerpo">
          {children}
        </div>
      </div>
    </div>
  )
}

export default CrudModal
