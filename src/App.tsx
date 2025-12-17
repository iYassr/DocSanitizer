import { useDocumentStore } from './stores/documentStore'
import { Header } from './components/Header'
import { FileUploader } from './components/FileUploader'
import { ReviewPanel } from './components/ReviewPanel'
import { ConfigModal } from './components/ConfigModal'
import { useState } from 'react'

export default function App() {
  const { view } = useDocumentStore()
  const [showConfig, setShowConfig] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute inset-0 bg-glow-tl" />
      <div className="absolute inset-0 bg-glow-br" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <Header onConfigClick={() => setShowConfig(true)} />

        <main className="flex-1 overflow-hidden">
          {view === 'upload' && <FileUploader />}
          {view === 'review' && <ReviewPanel />}
        </main>
      </div>

      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
    </div>
  )
}
