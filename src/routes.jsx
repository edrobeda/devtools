import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import JwtDecoderPage from './pages/JwtDecoderPage'
import GlassCardShowcasePage from './pages/GlassCardShowcasePage'
import UseDebounceSnippetPage from './pages/UseDebounceSnippetPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools/jwt-decoder', element: <JwtDecoderPage /> },
      { path: 'styles/glass-card', element: <GlassCardShowcasePage /> },
      { path: 'snippets/use-debounce', element: <UseDebounceSnippetPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
