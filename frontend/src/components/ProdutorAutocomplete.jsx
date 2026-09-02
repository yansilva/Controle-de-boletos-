import { useState, useEffect, useRef, useCallback } from 'react'
import { User } from 'lucide-react'
import { listarProdutores } from '../api/pedidos'

export default function ProdutorAutocomplete({ value, onChange, inputClass, labelClass }) {
  const [produtores, setProdutores] = useState([])
  const [sugestoes, setSugestoes] = useState([])
  const [showSugestoes, setShowSugestoes] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Carregar produtores do banco ao montar
  useEffect(() => {
    listarProdutores()
      .then(data => setProdutores(data))
      .catch(err => console.error('Erro ao carregar produtores:', err))
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSugestoes(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtrar = useCallback((texto) => {
    if (!texto.trim()) {
      setSugestoes([])
      setShowSugestoes(false)
      return
    }
    const termo = texto.toLowerCase()
    const filtrados = produtores.filter(p => 
      p.toLowerCase().includes(termo) && p.toLowerCase() !== termo
    )
    setSugestoes(filtrados)
    setShowSugestoes(filtrados.length > 0)
    setActiveIndex(-1)
  }, [produtores])

  function handleInputChange(e) {
    const val = e.target.value
    onChange(val)
    filtrar(val)
  }

  function handleSelect(produtor) {
    onChange(produtor)
    setShowSugestoes(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e) {
    if (!showSugestoes) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, sugestoes.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      e.stopPropagation()
      handleSelect(sugestoes[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSugestoes(false)
    }
  }

  function handleFocus() {
    if (value && value.trim()) {
      filtrar(value)
    }
  }

  return (
    <div ref={wrapperRef}>
      <label className={labelClass}>Produtor</label>
      <div className="relative">
        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input
          ref={inputRef}
          type="text"
          name="produtor"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className={inputClass}
          placeholder="Nome do produtor"
          autoComplete="off"
        />
        
        {/* Dropdown de sugestões */}
        {showSugestoes && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto
            bg-[#1C1C1E] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]
            backdrop-blur-xl animate-fade-in-up">
            {sugestoes.map((produtor, idx) => {
              const isActive = idx === activeIndex
              // Highlight do texto digitado
              const termo = value.toLowerCase()
              const matchIndex = produtor.toLowerCase().indexOf(termo)
              
              return (
                <button
                  key={produtor}
                  type="button"
                  onClick={() => handleSelect(produtor)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 text-[14px] transition-colors
                    ${isActive 
                      ? 'bg-[var(--color-accent)]/10 text-white' 
                      : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
                    }
                    ${idx === 0 ? 'rounded-t-xl' : ''}
                    ${idx === sugestoes.length - 1 ? 'rounded-b-xl' : ''}
                  `}
                >
                  <User size={14} className={isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'} />
                  <span className="font-medium">
                    {matchIndex >= 0 ? (
                      <>
                        {produtor.substring(0, matchIndex)}
                        <span className="text-[var(--color-accent)] font-bold">
                          {produtor.substring(matchIndex, matchIndex + termo.length)}
                        </span>
                        {produtor.substring(matchIndex + termo.length)}
                      </>
                    ) : produtor}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
