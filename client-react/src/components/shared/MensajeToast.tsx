import type { Mensaje } from './hooks'

interface Props {
  mensaje: Mensaje | null
}

function MensajeToast({ mensaje }: Props) {
  if (!mensaje) return null
  return (
    <p className={`mensaje ${mensaje.tipo === 'error' ? 'mensaje-error' : 'mensaje-exito'}`}>
      {mensaje.texto}
    </p>
  )
}

export default MensajeToast
