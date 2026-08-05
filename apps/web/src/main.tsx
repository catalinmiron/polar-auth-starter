import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import ReactDOM from 'react-dom/client'
import { queryClient } from './lib/query-client'
import { getRouter } from './router'

const router = getRouter()

const rootElement = document.getElementById('root')!

const root = ReactDOM.createRoot(rootElement)
root.render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
)
