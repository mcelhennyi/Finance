import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { BbdDocsProvider } from './components/bbd/BbdDocsContext'
import { BudgetDocsProvider } from './components/budget/BudgetDocsContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BbdDocsProvider>
        <BudgetDocsProvider>
          <App />
        </BudgetDocsProvider>
      </BbdDocsProvider>
    </QueryClientProvider>
  </StrictMode>,
)
