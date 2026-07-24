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
import ContrastCheckerPage from './pages/ContrastCheckerPage'
import CurlGeneratorPage from './pages/CurlGeneratorPage'
import GitignoreGeneratorPage from './pages/GitignoreGeneratorPage'
import RateLimitCalculatorPage from './pages/RateLimitCalculatorPage'
import ArnParserPage from './pages/ArnParserPage'
import PasswordStrengthPage from './pages/PasswordStrengthPage'
import JsonTreeViewerPage from './pages/JsonTreeViewerPage'
import SubnetCalculatorPage from './pages/SubnetCalculatorPage'
import AnthropicCostCalculatorPage from './pages/AnthropicCostCalculatorPage'
import DeepLinkTesterPage from './pages/DeepLinkTesterPage'
import WordCounterPage from './pages/WordCounterPage'
import GitCommandsPage from './pages/GitCommandsPage'
import DaysUntilPage from './pages/DaysUntilPage'
import RegexTesterPage from './pages/RegexTesterPage'
import Base64ToolPage from './pages/Base64ToolPage'
import UuidGeneratorPage from './pages/UuidGeneratorPage'
import CaseConverterPage from './pages/CaseConverterPage'

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
      { path: 'frontend/contrast-checker', element: <ContrastCheckerPage /> },
      { path: 'apis/curl-generator', element: <CurlGeneratorPage /> },
      { path: 'devops/gitignore-generator', element: <GitignoreGeneratorPage /> },
      { path: 'database/rate-limit-calculator', element: <RateLimitCalculatorPage /> },
      { path: 'cloud/arn-parser', element: <ArnParserPage /> },
      { path: 'security/password-strength', element: <PasswordStrengthPage /> },
      { path: 'data/json-tree-viewer', element: <JsonTreeViewerPage /> },
      { path: 'network/subnet-calculator', element: <SubnetCalculatorPage /> },
      { path: 'ai/anthropic-cost-calculator', element: <AnthropicCostCalculatorPage /> },
      { path: 'mobile/deep-link-tester', element: <DeepLinkTesterPage /> },
      { path: 'text/word-counter', element: <WordCounterPage /> },
      { path: 'references/git-commands', element: <GitCommandsPage /> },
      { path: 'extras/days-until', element: <DaysUntilPage /> },
      { path: 'tools/regex-tester', element: <RegexTesterPage /> },
      { path: 'tools/base64-tool', element: <Base64ToolPage /> },
      { path: 'tools/uuid-generator', element: <UuidGeneratorPage /> },
      { path: 'tools/case-converter', element: <CaseConverterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
