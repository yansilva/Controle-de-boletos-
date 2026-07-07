import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  function handleChange(e) {
    const val = e.target.value
    setValue(val)
    // Debounce
    clearTimeout(window._searchTimeout)
    window._searchTimeout = setTimeout(() => {
      onSearch(val)
    }, 300)
  }

  return (
    <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'w-full max-w-md' : 'w-11'}`}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-11 h-11 rounded-md flex items-center justify-center text-dark-200 hover:text-white border border-dark-500 hover:border-accent transition-all duration-200 shadow-sm"
          style={{ background: 'rgba(10, 14, 26, 0.5)' }}
          title="Buscar"
        >
          <span className="text-sm">🔍</span>
        </button>
      ) : (
        <div className="relative w-full animate-fade-in">
          {!value && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-200 text-sm pointer-events-none select-none">
              🔍
            </span>
          )}
          <input
            ref={inputRef}
            id="search-bar"
            type="text"
            value={value}
            onChange={handleChange}
            placeholder="Buscar por pedido, NF ou boleto..."
            className="w-full pl-11 pr-10 py-2.5 h-11 rounded-md text-sm text-white placeholder-dark-200
              border border-dark-500 focus:border-accent focus:ring-2 focus:ring-accent/20
              transition-all duration-200 shadow-sm"
            style={{ background: 'rgba(10, 14, 26, 0.5)' }}
          />
          <button
            onClick={() => {
              if (value) {
                setValue('')
                onSearch('')
              } else {
                setIsExpanded(false)
              }
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-200 hover:text-white hover:bg-dark-600/50
              w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
            title={value ? "Limpar busca" : "Fechar busca"}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
