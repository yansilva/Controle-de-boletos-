import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Cadastro from './pages/Cadastro'
import Quadro from './pages/Quadro'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Cadastro />} />
          <Route path="/quadro" element={<Quadro />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
