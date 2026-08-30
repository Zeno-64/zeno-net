import Fundo from './components/Fundo'
import Janela from './components/Janela'
import Trabalhos from './components/Trabalhos'

export default function App() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-9 px-4 py-12">
      <Fundo />
      <Janela />
      <Trabalhos />
    </main>
  )
}
