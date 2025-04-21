import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom';
import './index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <QueryClientProvider client={queryClient}>
            <App/>
        </QueryClientProvider>
    </BrowserRouter>
)
