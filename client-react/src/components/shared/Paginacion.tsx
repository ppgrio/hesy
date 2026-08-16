interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

function Paginacion({ page, totalPages, onChange }: Props) {
  return (
    <div className="paginacion">
      <button className="btn-pagina" onClick={() => onChange(page - 1)} disabled={page <= 1}>Anterior</button>
      <span>Página {page} de {totalPages}</span>
      <button className="btn-pagina" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Siguiente</button>
    </div>
  )
}

export default Paginacion
