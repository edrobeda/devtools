import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import JwtDecoderPage from './pages/JwtDecoderPage'
import GlassCardShowcasePage from './pages/GlassCardShowcasePage'
import UseDebounceSnippetPage from './pages/UseDebounceSnippetPage'
import CronParserPage from './pages/CronParserPage'
import HashGeneratorPage from './pages/HashGeneratorPage'
import CopyButtonShowcasePage from './pages/CopyButtonShowcasePage'
import UseLocalStorageSnippetPage from './pages/UseLocalStorageSnippetPage'
import UseClickOutsideSnippetPage from './pages/UseClickOutsideSnippetPage'
import JsonFormatterPage from './pages/JsonFormatterPage'
import ColorConverterPage from './pages/ColorConverterPage'
import SkeletonShimmerPage from './pages/SkeletonShimmerPage'
import TimestampConverterPage from './pages/TimestampConverterPage'
import GradientBorderButtonPage from './pages/GradientBorderButtonPage'
import UseMediaQuerySnippetPage from './pages/UseMediaQuerySnippetPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools/jwt-decoder', element: <JwtDecoderPage /> },
      { path: 'tools/cron-parser', element: <CronParserPage /> },
      { path: 'tools/hash-generator', element: <HashGeneratorPage /> },
      { path: 'tools/json-formatter', element: <JsonFormatterPage /> },
      { path: 'tools/color-converter', element: <ColorConverterPage /> },
      { path: 'tools/timestamp-converter', element: <TimestampConverterPage /> },
      { path: 'styles/glass-card', element: <GlassCardShowcasePage /> },
      { path: 'styles/copy-button', element: <CopyButtonShowcasePage /> },
      { path: 'styles/skeleton-shimmer', element: <SkeletonShimmerPage /> },
      { path: 'styles/gradient-border-button', element: <GradientBorderButtonPage /> },
      { path: 'snippets/use-debounce', element: <UseDebounceSnippetPage /> },
      { path: 'snippets/use-local-storage', element: <UseLocalStorageSnippetPage /> },
      { path: 'snippets/use-click-outside', element: <UseClickOutsideSnippetPage /> },
      { path: 'snippets/use-media-query', element: <UseMediaQuerySnippetPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
