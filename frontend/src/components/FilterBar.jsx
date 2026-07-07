import { useState } from 'react'

export default function FilterBar({ onFilter, onClear }) {
  const [filters, setFilters] = useState({
    data_inicio: '',
    data_fim: '',
    valor_min: '',
    valor_max: '',
  })
  const [expanded, setExpanded] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  function handleApply() {
    onFilter(filters)
  }

  function handleClear() {
    const empty = { data_inicio: '', data_fim: '', valor_min: '', valor_max: '' }
    setFilters(empty)
    onClear()
  }

  const hasFilters = Object.values(filters).some(v => v !== '')

  const inputClasses = `w-full px-3 py-2 rounded-lg text-xs text-white placeholder-dark-200
    border border-dark-500 focus:border-accent focus:ring-1 focus:ring-accent/20
    transition-all duration-200`

  return (
    <div className="overflow-hidden transition-all duration-300 border border-dark-500 rounded-md shadow-sm"
      style={{ background: 'rgba(10, 14, 26, 0.5)' }}>
      {/* Toggle */}
      <button
        id="btn-toggle-filters"
        onClick={() => setExpanded(!expanded)}
        className="h-11 px-4 w-full flex items-center justify-between gap-3 text-sm font-medium text-dark-100 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>⚙️</span>
          Filtros
          {hasFilters && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              Ativos
            </span>
          )}
        </span>
        <span className="transition-transform duration-200" style={{
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        }}>
          ▼
        </span>
      </button>

      {/* Filter body */}
      {expanded && (
        <div className="px-5 pb-4 pt-1 border-t border-dark-600 space-y-4"
          style={{ animation: 'scaleIn 0.2s ease-out' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-dark-200 uppercase tracking-wider">Data Início</label>
              <input
                id="filter-data-inicio"
                type="date"
                name="data_inicio"
                value={filters.data_inicio}
                onChange={handleChange}
                className={inputClasses}
                style={{ background: 'rgba(10, 14, 26, 0.5)', colorScheme: 'dark' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-dark-200 uppercase tracking-wider">Data Fim</label>
              <input
                id="filter-data-fim"
                type="date"
                name="data_fim"
                value={filters.data_fim}
                onChange={handleChange}
                className={inputClasses}
                style={{ background: 'rgba(10, 14, 26, 0.5)', colorScheme: 'dark' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-dark-200 uppercase tracking-wider">Valor Mín</label>
              <input
                id="filter-valor-min"
                type="number"
                name="valor_min"
                value={filters.valor_min}
                onChange={handleChange}
                placeholder="0,00"
                className={inputClasses}
                style={{ background: 'rgba(10, 14, 26, 0.5)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-dark-200 uppercase tracking-wider">Valor Máx</label>
              <input
                id="filter-valor-max"
                type="number"
                name="valor_max"
                value={filters.valor_max}
                onChange={handleChange}
                placeholder="0,00"
                className={inputClasses}
                style={{ background: 'rgba(10, 14, 26, 0.5)' }}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              id="btn-clear-filters"
              onClick={handleClear}
              className="px-4 py-2 rounded-lg text-xs font-medium text-dark-100 border border-dark-500 hover:border-dark-300 hover:text-white transition-all"
            >
              Limpar
            </button>
            <button
              id="btn-apply-filters"
              onClick={handleApply}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
              }}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
