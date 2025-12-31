import { useState, useCallback, useEffect } from 'react'
import { useDocumentStore } from './stores/documentStore'
import { UploadStep } from './components/UploadStep'
import { ReviewStep } from './components/ReviewStep'
import { ExportStep } from './components/ExportStep'
import { Check, Shield } from './components/ui/icons'
import { ThemeToggle } from './components/ui/theme-toggle'

type Step = 'upload' | 'review' | 'export'

const STEPS: { id: Step; label: string; number: number }[] = [
  { id: 'upload', label: 'Upload', number: 1 },
  { id: 'review', label: 'Review', number: 2 },
  { id: 'export', label: 'Export', number: 3 }
]

// Loading screen component
function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <div className="text-center">
        {/* Logo/Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        {/* App name */}
        <h1 className="text-3xl font-bold text-foreground mb-2">maskr</h1>
        <p className="text-muted-foreground mb-8">Secure Document Sanitization</p>

        {/* Loading bar */}
        <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading text */}
        <p className="text-sm text-muted-foreground mt-4">
          {progress < 30 ? 'Initializing...' :
           progress < 60 ? 'Loading detection engine...' :
           progress < 90 ? 'Preparing workspace...' :
           'Almost ready...'}
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const { reset } = useDocumentStore()

  // Simulate loading and preload resources
  useEffect(() => {
    let mounted = true

    const preload = async () => {
      // Stage 1: Initial setup
      setLoadingProgress(10)
      await new Promise(r => setTimeout(r, 100))

      // Stage 2: Preload the NLP/detection engine by making a dummy call
      if (mounted) setLoadingProgress(30)
      try {
        // This will trigger lazy loading of the compromise NLP module
        await window.api?.extractEntities('preload warmup text')
      } catch {
        // Ignore errors during preload
      }

      if (mounted) setLoadingProgress(70)
      await new Promise(r => setTimeout(r, 100))

      // Stage 3: Final setup
      if (mounted) setLoadingProgress(90)
      await new Promise(r => setTimeout(r, 100))

      if (mounted) {
        setLoadingProgress(100)
        // Small delay before hiding loading screen
        setTimeout(() => {
          if (mounted) setIsLoading(false)
        }, 200)
      }
    }

    preload()

    return () => {
      mounted = false
    }
  }, [])

  const handleFileUploaded = useCallback(() => {
    setCurrentStep('review')
  }, [])

  const handleReviewComplete = useCallback(() => {
    setCurrentStep('export')
  }, [])

  const handleBackToReview = useCallback(() => {
    setCurrentStep('review')
  }, [])

  const handleBackToUpload = useCallback(() => {
    reset()
    setCurrentStep('upload')
  }, [reset])

  const handleReset = useCallback(() => {
    reset()
    setCurrentStep('upload')
  }, [reset])

  const getCurrentStepIndex = () => STEPS.findIndex(s => s.id === currentStep)

  // Show loading screen during initial load
  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} />
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header with step indicator */}
      <header className="flex-shrink-0 titlebar-drag-region bg-muted border-b border-border">
        {/* Drag area for window */}
        <div className="h-10 flex items-center justify-center">
          <div className="titlebar-no-drag flex items-center gap-6 px-4">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep
              const isCompleted = getCurrentStepIndex() > index
              const isPast = index < getCurrentStepIndex()

              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                        transition-all duration-300
                        ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'bg-primary/60 text-primary-foreground'
                            : 'bg-secondary text-muted-foreground'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-foreground'
                          : isPast
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground/60'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-12 h-px ${
                        isPast ? 'bg-primary/60' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {currentStep === 'upload' && (
          <UploadStep onFileUploaded={handleFileUploaded} />
        )}
        {currentStep === 'review' && (
          <ReviewStep
            onContinue={handleReviewComplete}
            onBack={handleBackToUpload}
          />
        )}
        {currentStep === 'export' && (
          <ExportStep
            onBack={handleBackToReview}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 px-4 py-2 flex items-center justify-between text-xs bg-muted border-t border-border text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>maskr v1.3</span>
          <ThemeToggle />
          <button
            onClick={() => window.api?.logsOpenFolder()}
            className="px-1.5 py-0.5 rounded hover:bg-background/50 transition-colors"
            title="Open debug logs folder"
          >
            Logs
          </button>
        </div>
        <span>Secure document sanitization</span>
      </footer>
    </div>
  )
}
