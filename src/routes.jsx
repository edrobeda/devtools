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
import PasswordGeneratorPage from './pages/PasswordGeneratorPage'
import UrlEncoderPage from './pages/UrlEncoderPage'
import GradientGeneratorPage from './pages/GradientGeneratorPage'
import UseCopyToClipboardSnippetPage from './pages/UseCopyToClipboardSnippetPage'
import HttpStatusCodesPage from './pages/HttpStatusCodesPage'
import DiffCheckerPage from './pages/DiffCheckerPage'
import BoxShadowGeneratorPage from './pages/BoxShadowGeneratorPage'
import CsvJsonConverterPage from './pages/CsvJsonConverterPage'
import UseIntervalSnippetPage from './pages/UseIntervalSnippetPage'
import MarkdownPreviewerPage from './pages/MarkdownPreviewerPage'
import NeumorphicCardPage from './pages/NeumorphicCardPage'
import UsePreviousSnippetPage from './pages/UsePreviousSnippetPage'
import FakeDataGeneratorPage from './pages/FakeDataGeneratorPage'
import WebhookPayloadGeneratorPage from './pages/WebhookPayloadGeneratorPage'
import CpfCnpjGeneratorPage from './pages/CpfCnpjGeneratorPage'
import BaseConverterPage from './pages/BaseConverterPage'
import UseToggleSnippetPage from './pages/UseToggleSnippetPage'
import UseWindowSizeSnippetPage from './pages/UseWindowSizeSnippetPage'
import BouncingDotsLoaderPage from './pages/BouncingDotsLoaderPage'
import DockerCommandsPage from './pages/DockerCommandsPage'

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
      { path: 'tools/password-generator', element: <PasswordGeneratorPage /> },
      { path: 'tools/url-encoder', element: <UrlEncoderPage /> },
      { path: 'frontend/gradient-generator', element: <GradientGeneratorPage /> },
      { path: 'snippets/use-copy-to-clipboard', element: <UseCopyToClipboardSnippetPage /> },
      { path: 'references/http-status-codes', element: <HttpStatusCodesPage /> },
      { path: 'tools/diff-checker', element: <DiffCheckerPage /> },
      { path: 'frontend/box-shadow-generator', element: <BoxShadowGeneratorPage /> },
      { path: 'data/csv-json-converter', element: <CsvJsonConverterPage /> },
      { path: 'snippets/use-interval', element: <UseIntervalSnippetPage /> },
      { path: 'tools/markdown-previewer', element: <MarkdownPreviewerPage /> },
      { path: 'styles/neumorphic-card', element: <NeumorphicCardPage /> },
      { path: 'snippets/use-previous', element: <UsePreviousSnippetPage /> },
      { path: 'data/fake-data-generator', element: <FakeDataGeneratorPage /> },
      { path: 'apis/webhook-payload-generator', element: <WebhookPayloadGeneratorPage /> },
      { path: 'tools/cpf-cnpj-generator', element: <CpfCnpjGeneratorPage /> },
      { path: 'tools/base-converter', element: <BaseConverterPage /> },
      { path: 'snippets/use-toggle', element: <UseToggleSnippetPage /> },
      { path: 'snippets/use-window-size', element: <UseWindowSizeSnippetPage /> },
      { path: 'styles/bouncing-dots-loader', element: <BouncingDotsLoaderPage /> },
      { path: 'references/docker-commands', element: <DockerCommandsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
