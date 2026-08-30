import type { ReactNode } from 'react'
import './Cortina.css'

interface Props {
  titulo: string
  abierto: boolean
  onToggle: () => void
  children: ReactNode
}

function Cortina({ titulo, abierto, onToggle, children }: Props) {
  return (
    <>
      <button className="cortina-titulo" onClick={onToggle}>
        <span>{titulo}</span>
        <span>{abierto ? '▾' : '▸'}</span>
      </button>
      <div className={`cortina${abierto ? ' abierto' : ''}`}>
        <div className={`cortina-inner${abierto ? '' : ' cerrado'}`}>{children}</div>
      </div>
    </>
  )
}

export default Cortina
