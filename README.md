# Controle de Boletos (DDA)

[![Secured by GitGuard](https://img.shields.io/badge/Secured%20by-GitGuard-success?style=flat-square)](https://www.gitguard.com.br/yansilva)

Sistema completo para gerenciamento, acompanhamento e controle de boletos DDA (Débito Direto Autorizado) em formato Kanban.

---

## 🚀 Funcionalidades

- **Quadro Kanban Interativo:** Visualização e organização de pedidos por etapas de fluxo (`Falta DDA`, `Aguardando DDA`, `DDA Lançado`, `Concluído`).
- **Cadastro e Edição de Pedidos:** Registro ágil com suporte a parcelamento, autocomplete de produtores e formatação monetária inteligente.
- **Filtros Avançados:** Filtro por período, faixa de valor e busca textual com debounce.
- **Histórico e Detalhes:** Visualização completa de logs de alteração e detalhes de cada pedido.
- **Armazenamento Local:** Banco de dados SQLite (`sql.js`) persistente no backend.
- **Acesso Remoto:** Integração automática com túnel Cloudflare para acesso externo.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- [React 19](https://react.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) (Drag and Drop)
- [Lucide React](https://lucide.dev/) (Ícones)
- [React Router DOM](https://reactrouter.com/)

### Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [sql.js](https://sql.js.org/) (SQLite em WebAssembly/Node)
- [CORS](https://github.com/expressjs/cors)

---

## 🏁 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)

### Inicialização Rápida (Windows)
Basta dar dois cliques no arquivo:
```bat
iniciar-sistema.bat
```
O script iniciará automaticamente o backend, frontend e o túnel Cloudflare.

### Inicialização Manual

1. **Instalar dependências:**
   ```bash
   npm run install:all
   ```

2. **Iniciar em modo desenvolvimento:**
   ```bash
   npm run dev
   ```
   - **Frontend:** `http://localhost:5173`
   - **Backend API:** `http://localhost:3001`
