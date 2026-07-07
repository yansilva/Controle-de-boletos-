import { NavLink, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { 
  LayoutDashboard, Kanban, Link as LinkIcon, RefreshCw, CheckCircle2, AlertCircle,
  Plus, FileSpreadsheet, FileUp, FileBarChart, ChevronDown
} from 'lucide-react'
import CadastroPedido from './CadastroPedido'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/quadro', label: 'Kanban', icon: Kanban },
]

export default function Layout({ children, onPedidoCriado }) {
  const location = useLocation()
  const [showTunnel, setShowTunnel] = useState(false)
  const [tunnelUrl, setTunnelUrl] = useState(null)
  const [tunnelMsg, setTunnelMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const popupRef = useRef(null)
  const dropdownRef = useRef(null)

  const fetchTunnelUrl = async () => {
    setLoading(true)
    setCopied(false)
    try {
      const res = await fetch('/api/tunnel-url')
      const data = await res.json()
      setTunnelUrl(data.url)
      setTunnelMsg(data.message || '')
    } catch {
      setTunnelUrl(null)
      setTunnelMsg('Erro ao conectar com o servidor')
    }
    setLoading(false)
  }

  const handleToggle = () => {
    if (!showTunnel) {
      fetchTunnelUrl()
    }
    setShowTunnel(!showTunnel)
  }

  const handleCopy = async () => {
    if (tunnelUrl) {
      await navigator.clipboard.writeText(tunnelUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowTunnel(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Dispara evento global quando um pedido é criado
  function handlePedidoCriado() {
    window.dispatchEvent(new CustomEvent('pedido-criado'))
  }

  const dropdownActions = [
    { label: 'Novo Pedido', icon: Plus, action: () => { setShowModal(true); setShowDropdown(false) } },
    { label: 'Importar XML', icon: FileUp, action: () => { setShowDropdown(false) }, disabled: true },
    { label: 'Importar Excel', icon: FileSpreadsheet, action: () => { setShowDropdown(false) }, disabled: true },
    { label: 'Gerar Relatório', icon: FileBarChart, action: () => { setShowDropdown(false) }, disabled: true },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(9,9,11,0.85)] backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-gradient-to-b from-[#8B5CF6] to-[#7C3AED] shadow-[0_2px_10px_rgba(124,58,237,0.4)] group-hover:shadow-[0_4px_15px_rgba(124,58,237,0.6)] transition-all">
                D
              </div>
              <h1 className="text-sm font-semibold tracking-tight text-white hidden sm:block">Controle DDA</h1>
            </div>

            <nav className="flex items-center gap-0.5">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`relative px-3.5 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? 'text-white bg-[rgba(255,255,255,0.06)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-[var(--color-accent)]' : ''} />
                    <span>{label}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            {/* Tunnel Button */}
            <div className="relative" ref={popupRef}>
              <button
                onClick={handleToggle}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  showTunnel 
                    ? 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30 text-[var(--color-success)]' 
                    : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-white hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                <LinkIcon size={13} />
                <span className="hidden md:inline">Remoto</span>
              </button>

              {showTunnel && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[999] w-[320px] bg-[#171717] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${tunnelUrl ? 'bg-[var(--color-success)] shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-[var(--color-warning)]'} animate-pulse`} />
                      <span className="text-xs font-semibold text-white">Túnel Cloudflare</span>
                    </div>
                    <button onClick={fetchTunnelUrl} className="text-[var(--color-text-secondary)] hover:text-white transition-colors p-1">
                      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="p-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-3 text-[var(--color-text-secondary)] text-xs gap-2">
                        <RefreshCw size={14} className="animate-spin text-[var(--color-accent)]" />
                        Conectando...
                      </div>
                    ) : tunnelUrl ? (
                      <div 
                        onClick={handleCopy}
                        className="flex items-center justify-between gap-2 bg-[#09090B] border border-[rgba(255,255,255,0.08)] hover:border-[var(--color-success)]/40 p-3 rounded-lg cursor-pointer transition-all group"
                      >
                        <span className="text-xs font-mono text-[var(--color-success)] truncate">{tunnelUrl}</span>
                        {copied ? <CheckCircle2 size={14} className="text-[var(--color-success)] flex-shrink-0" /> : <LinkIcon size={14} className="text-[var(--color-text-secondary)] group-hover:text-white flex-shrink-0 transition-colors" />}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <AlertCircle size={24} className="text-[var(--color-text-secondary)] mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-[var(--color-text-secondary)]">Túnel indisponível</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* + Novo Pedido Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-l-lg text-sm font-medium bg-[#7C3AED] text-white hover:bg-[#8B5CF6] shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Novo Pedido</span>
                </button>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center px-1.5 py-1.5 rounded-r-lg text-white bg-[#6D28D9] hover:bg-[#7C3AED] border-l border-[rgba(255,255,255,0.15)] transition-all h-[34px]"
                >
                  <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[999] w-[200px] bg-[#171717] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up py-1">
                  {dropdownActions.map(({ label, icon: Icon, action, disabled }) => (
                    <button
                      key={label}
                      onClick={action}
                      disabled={disabled}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                        disabled 
                          ? 'text-[#52525B] cursor-not-allowed' 
                          : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                      }`}
                    >
                      <Icon size={15} />
                      <span>{label}</span>
                      {disabled && <span className="ml-auto text-[10px] font-medium text-[#52525B] bg-[#27272A] px-1.5 py-0.5 rounded">Em breve</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 md:px-10 py-8">
        {children}
      </main>

      {/* Modal de Cadastro (global, acessível de qualquer página) */}
      <CadastroPedido 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onPedidoCriado={handlePedidoCriado} 
      />
    </div>
  )
}
