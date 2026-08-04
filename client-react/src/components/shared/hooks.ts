import { useState } from 'react'

interface Mensaje {
  tipo: 'error' | 'exito'
  texto: string
}

function useMensaje(timeout = 3000) {
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  function mostrarMensaje(tipo: 'error' | 'exito', texto: string) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), timeout)
  }

  return { mensaje, mostrarMensaje }
}

export { useMensaje }
export type { Mensaje }
