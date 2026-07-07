import { useState, useEffect } from 'react'
import { editarPedido, calcularValorParcela, formatarValor } from '../api/pedidos'

const statusOptions = [
  { value: 'falta_dda', label: 'Falta o DDA', color: '#ef4444' },
  { value: 'aguardando_dda', label: 'DDA não aparece no Inter', color: '#f59e0b' },
  { value: 'dda_lancado', label: 'DDA Lançado', color: '#10b981' },
]

const MAX_PARCELAS = 12

export default function EditModal({ pedido, onClose, onSaved }) {
  const [form, setForm] = useState({
    pedido_tiny: '',
    numero_nf: '',
    digitos_boleto: '',
    valor: '',
    data_vencimento: '',
    observacoes: '',
    num_parcelas: 1,
    status: 'falta_dda',
    atencao: false,
  })
  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (pedido) {
      // Formata o valor vindo do banco para exibição com máscara
      let valorFormatado = ''
      if (pedido.valor) {
        const cents = Math.round(pedido.valor * 100).toString().padStart(3, '0')
        const centsPart = cents.slice(-2)
        let intPart = cents.slice(0, -2)
        intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        valorFormatado = `${intPart},${centsPart}`
      }

      // Determinar número de parcelas
      let numParcelas = 1
      if (pedido.parcelamento) {
        const parsed = parseInt(pedido.parcelamento, 10)
        if (!isNaN(parsed) && parsed > 1) {
          numParcelas = parsed
        } else {
          // Tentar formato antigo "1/3", "2/5"
          const match = pedido.parcelamento.toString().match(/\/\s*(\d+)/)
          if (match && match[1]) {
            numParcelas = parseInt(match[1], 10)
          }
        }
      }

      setForm({
        pedido_tiny: pedido.pedido_tiny || '',
        numero_nf: pedido.numero_nf || '',
        digitos_boleto: pedido.digitos_boleto || '',
        valor: valorFormatado,
        data_vencimento: pedido.data_vencimento || '',
        observacoes: pedido.observacoes || '',
        num_parcelas: numParcelas,
        status: pedido.status || 'falta_dda',
        atencao: pedido.atencao === 1,
      })

      // Carregar parcelas existentes
      if (numParcelas > 1 && pedido.parcelas && pedido.parcelas.length > 0) {
        const parcelasCarregadas = []
        for (let i = 0; i < numParcelas; i++) {
          const parcelaExistente = pedido.parcelas.find(p => p.numero_parcela === i + 1)
          parcelasCarregadas.push({
            numero_parcela: i + 1,
            digitos_boleto: parcelaExistente?.digitos_boleto || '',
            data_vencimento: parcelaExistente?.data_vencimento || '',
          })
        }
        setParcelas(parcelasCarregadas)
      } else if (numParcelas > 1) {
        // Parcelas sem dados salvos ainda
        const parcelasNovas = []
        for (let i = 0; i < numParcelas; i++) {
          parcelasNovas.push({
            numero_parcela: i + 1,
            digitos_boleto: i === 0 ? (pedido.digitos_boleto || '') : '',
            data_vencimento: i === 0 ? (pedido.data_vencimento || '') : '',
          })
        }
        setParcelas(parcelasNovas)
      } else {
        setParcelas([])
      }
    }
  }, [pedido])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleNumParcelasChange(e) {
    const num = Math.min(Math.max(parseInt(e.target.value) || 1, 1), MAX_PARCELAS)
    setForm(prev => ({ ...prev, num_parcelas: num }))

    if (num > 1) {
      setParcelas(prev => {
        const novasParcelas = []
        for (let i = 0; i < num; i++) {
          novasParcelas.push({
            numero_parcela: i + 1,
            digitos_boleto: prev[i]?.digitos_boleto || '',
            data_vencimento: prev[i]?.data_vencimento || '',
          })
        }
        return novasParcelas
      })
    } else {
      setParcelas([])
    }
  }

  function handleParcelaChange(index, field, value) {
    setParcelas(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function handleValorChange(e) {
    // Remove tudo que não é dígito
    let digits = e.target.value.replace(/\D/g, '')
    // Remove zeros à esquerda (mas mantém pelo menos '0')
    digits = digits.replace(/^0+/, '') || '0'
    // Garante pelo menos 3 dígitos para ter centavos
    digits = digits.padStart(3, '0')
    // Separa centavos
    const cents = digits.slice(-2)
    let intPart = digits.slice(0, -2)
    // Adiciona pontos de milhar
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const formatted = `${intPart},${cents}`
    setForm(prev => ({ ...prev, valor: formatted }))
  }

  function parseValor(valorStr) {
    if (!valorStr) return 0
    let cleaned = valorStr.replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const valorNumerico = parseValor(form.valor)
    if (!form.pedido_tiny || !form.numero_nf || valorNumerico <= 0) {
      setError('Preencha todos os campos corretamente')
      return
    }

    if (form.num_parcelas <= 1 && !form.digitos_boleto) {
      setError('Preencha os dígitos do boleto')
      return
    }

    setLoading(true)
    try {
      const dadosEnvio = {
        pedido_tiny: form.pedido_tiny,
        numero_nf: form.numero_nf,
        digitos_boleto: form.num_parcelas > 1 ? (parcelas[0]?.digitos_boleto || '') : form.digitos_boleto,
        valor: valorNumerico,
        data_vencimento: form.num_parcelas > 1 ? (parcelas[0]?.data_vencimento || '') : form.data_vencimento,
        observacoes: form.observacoes,
        parcelamento: form.num_parcelas > 1 ? String(form.num_parcelas) : '',
        status: form.status,
        atencao: form.atencao,
        parcelas: form.num_parcelas > 1 ? parcelas : [],
      }

      await editarPedido(pedido.id, dadosEnvio)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const valorNumerico = parseValor(form.valor)
  const temParcelas = form.num_parcelas > 1
  const valorParcela = temParcelas && valorNumerico > 0 ? valorNumerico / form.num_parcelas : 0

  const inputClasses = `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-dark-200
    border border-dark-500/60 focus:border-accent focus:ring-2 focus:ring-accent/20
    bg-dark-900/35 transition-all duration-200`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="modal-content glass-card w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.2))' }}>
              ✏️
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Editar Pedido</h3>
              <p className="text-xs text-dark-200">#{pedido?.pedido_tiny}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-200 hover:text-white hover:bg-dark-500 transition-all">
            ✕
          </button>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Pedido Tiny</label>
              <input type="text" name="pedido_tiny" value={form.pedido_tiny} onChange={handleChange}
                className={inputClasses} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Número NF</label>
              <input type="text" name="numero_nf" value={form.numero_nf} onChange={handleChange}
                className={inputClasses} />
            </div>

            {/* Dígitos Boleto - só aparece se NÃO tem parcelas */}
            {!temParcelas && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Dígitos Boleto</label>
                <input type="text" name="digitos_boleto" value={form.digitos_boleto} onChange={handleChange}
                  className={inputClasses} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Valor</label>
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-3 rounded-xl text-sm font-semibold text-dark-200 border border-dark-500/60 bg-dark-900/35 select-none">
                  R$
                </span>
                <input type="text" name="valor" value={form.valor} onChange={handleValorChange}
                  className={inputClasses} />
              </div>
            </div>

            {/* Vencimento - só aparece se NÃO tem parcelas */}
            {!temParcelas && (
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Vencimento do Boleto</label>
                <input type="date" name="data_vencimento" value={form.data_vencimento} onChange={handleChange}
                  className={inputClasses} style={{ colorScheme: 'dark' }} />
              </div>
            )}

            {/* Número de Parcelas */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Nº de Parcelas</label>
              <input
                type="number"
                name="num_parcelas"
                min="1"
                max={MAX_PARCELAS}
                value={form.num_parcelas}
                onChange={handleNumParcelasChange}
                className={inputClasses}
              />
              {temParcelas && valorNumerico > 0 && (
                <div className="mt-1 text-[10px] font-medium text-accent">
                  ↳ {form.num_parcelas}x de {formatarValor(valorParcela)}
                </div>
              )}
            </div>
          </div>

          {/* Seção de Parcelas Dinâmicas */}
          {temParcelas && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📦</span>
                <h4 className="text-xs font-bold text-white">Parcelas do Boleto</h4>
                {valorNumerico > 0 && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                    {form.num_parcelas}x de {formatarValor(valorParcela)}
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {parcelas.map((parcela, idx) => (
                  <div
                    key={idx}
                    className="bg-dark-900/50 border border-dark-500/40 rounded-xl p-3 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-accent bg-accent/15 border border-accent/20">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-dark-100">
                        Parcela {idx + 1}/{form.num_parcelas}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="block text-[9px] font-semibold text-dark-200 uppercase tracking-wider">
                          Dígitos Boleto
                        </label>
                        <input
                          type="text"
                          value={parcela.digitos_boleto}
                          onChange={(e) => handleParcelaChange(idx, 'digitos_boleto', e.target.value)}
                          placeholder="Ex: 4567"
                          className={inputClasses}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="block text-[9px] font-semibold text-dark-200 uppercase tracking-wider">
                          Vencimento
                        </label>
                        <input
                          type="date"
                          value={parcela.data_vencimento}
                          onChange={(e) => handleParcelaChange(idx, 'data_vencimento', e.target.value)}
                          className={inputClasses}
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1.5 col-span-2">
            <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
              placeholder="Nota ou observação especial"
              className={`${inputClasses} resize-none h-[60px] py-2`} />
          </div>
            
          <div className="col-span-2 bg-dark-900/40 p-4 rounded-xl border border-dark-600/50 mt-2">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  name="atencao" 
                  id="atencaoEdit" 
                  checked={form.atencao} 
                  onChange={handleChange}
                  className="w-5 h-5 accent-[#ef4444] cursor-pointer" 
                />
              </div>
              <label htmlFor="atencaoEdit" className="text-sm font-semibold text-white cursor-pointer select-none flex items-center gap-2">
                <span className="text-lg">🛑</span> Verificar com o Tanaka
              </label>
            </div>
          </div>

          {/* Status selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-dark-100 uppercase tracking-wider">Status</label>
            <div className="flex gap-2">
              {statusOptions.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                  className="flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border"
                  style={{
                    background: form.status === opt.value ? `${opt.color}18` : 'rgba(10, 14, 26, 0.5)',
                    borderColor: form.status === opt.value ? `${opt.color}60` : 'rgba(40, 51, 82, 1)',
                    color: form.status === opt.value ? opt.color : '#9ba3b8',
                  }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ background: opt.color, opacity: form.status === opt.value ? 1 : 0.4 }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-dark-100 border border-dark-500 hover:border-dark-300 hover:text-white transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(135deg, #6366f1, #4338ca)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99, 102, 241, 0.3)',
              }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
              ) : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
