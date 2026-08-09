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
import SemverComparatorPage from './pages/SemverComparatorPage'
import SlugGeneratorPage from './pages/SlugGeneratorPage'
import PaletteGeneratorPage from './pages/PaletteGeneratorPage'
import RippleButtonPage from './pages/RippleButtonPage'
import UseOnScreenSnippetPage from './pages/UseOnScreenSnippetPage'
import FlexboxCheatsheetPage from './pages/FlexboxCheatsheetPage'
import CssUnitConverterPage from './pages/CssUnitConverterPage'
import CssSpecificityCalculatorPage from './pages/CssSpecificityCalculatorPage'
import FloatingLabelInputPage from './pages/FloatingLabelInputPage'
import UseKeyPressSnippetPage from './pages/UseKeyPressSnippetPage'
import SqlCommandsPage from './pages/SqlCommandsPage'
import NanoIdGeneratorPage from './pages/NanoIdGeneratorPage'
import HtmlEntityEncoderPage from './pages/HtmlEntityEncoderPage'
import BorderRadiusGeneratorPage from './pages/BorderRadiusGeneratorPage'
import IosToggleSwitchPage from './pages/IosToggleSwitchPage'
import UseEventListenerSnippetPage from './pages/UseEventListenerSnippetPage'
import PackageManagerCommandsPage from './pages/PackageManagerCommandsPage'
import HmacGeneratorPage from './pages/HmacGeneratorPage'
import LoremIpsumGeneratorPage from './pages/LoremIpsumGeneratorPage'
import JsonDiffPage from './pages/JsonDiffPage'
import DarkModeTogglePage from './pages/DarkModeTogglePage'
import UseThrottleSnippetPage from './pages/UseThrottleSnippetPage'
import VscodeShortcutsPage from './pages/VscodeShortcutsPage'
import JsonPathExplorerPage from './pages/JsonPathExplorerPage'
import CssGridCheatsheetPage from './pages/CssGridCheatsheetPage'
import FisherYatesShufflePage from './pages/FisherYatesShufflePage'
import TeamRoulettePage from './pages/TeamRoulettePage'
import JwtGeneratorPage from './pages/JwtGeneratorPage'
import ToastNotificationPage from './pages/ToastNotificationPage'
import UseUndoSnippetPage from './pages/UseUndoSnippetPage'
import BashShortcutsPage from './pages/BashShortcutsPage'
import CommitMessageGeneratorPage from './pages/CommitMessageGeneratorPage'
import RobotsTxtGeneratorPage from './pages/RobotsTxtGeneratorPage'
import ScrollProgressBarPage from './pages/ScrollProgressBarPage'
import ConfettiEffectPage from './pages/ConfettiEffectPage'
import DebounceThrottleFunctionsPage from './pages/DebounceThrottleFunctionsPage'
import JwtTimelinePage from './pages/JwtTimelinePage'
import TypewriterEffectPage from './pages/TypewriterEffectPage'
import LruCachePage from './pages/LruCachePage'
import CspGeneratorPage from './pages/CspGeneratorPage'
import TokenCounterPage from './pages/TokenCounterPage'
import PomodoroTimerPage from './pages/PomodoroTimerPage'
import EnvToolPage from './pages/EnvToolPage'
import RemoveAccentsPage from './pages/RemoveAccentsPage'
import XmlFormatterPage from './pages/XmlFormatterPage'
import DeepCloneDeepEqualPage from './pages/DeepCloneDeepEqualPage'
import BranchNameGeneratorPage from './pages/BranchNameGeneratorPage'
import LinesToolPage from './pages/LinesToolPage'
import HtmlToJsxConverterPage from './pages/HtmlToJsxConverterPage'
import UuidCollisionSimulatorPage from './pages/UuidCollisionSimulatorPage'
import UnicodeInspectorPage from './pages/UnicodeInspectorPage'
import JsonToSqlPage from './pages/JsonToSqlPage'
import SortingVisualizerPage from './pages/SortingVisualizerPage'
import OtpInputPage from './pages/OtpInputPage'
import TimezoneConverterPage from './pages/TimezoneConverterPage'
import UserAgentParserPage from './pages/UserAgentParserPage'
import CronBuilderPage from './pages/CronBuilderPage'
import MimeLookupPage from './pages/MimeLookupPage'
import HttpMethodsPage from './pages/HttpMethodsPage'
import NumberToWordsPage from './pages/NumberToWordsPage'
import JsonSchemaGeneratorPage from './pages/JsonSchemaGeneratorPage'
import JsonSchemaValidatorPage from './pages/JsonSchemaValidatorPage'
import CssFormatterPage from './pages/CssFormatterPage'
import SqlFormatterPage from './pages/SqlFormatterPage'
import CommonPortsPage from './pages/CommonPortsPage'
import CsvMarkdownTablePage from './pages/CsvMarkdownTablePage'
import MarkdownSyntaxPage from './pages/MarkdownSyntaxPage'
import KubeCtlCommandsPage from './pages/KubeCtlCommandsPage'
import ChmodCalculatorPage from './pages/ChmodCalculatorPage'
import FloatExplorerPage from './pages/FloatExplorerPage'
import SvgPlaceholderGeneratorPage from './pages/SvgPlaceholderGeneratorPage'
import DockerfileGeneratorPage from './pages/DockerfileGeneratorPage'
import CubicBezierEditorPage from './pages/CubicBezierEditorPage'
import AnsiColorsPage from './pages/AnsiColorsPage'
import AsciiTablePage from './pages/AsciiTablePage'
import SvgWaveGeneratorPage from './pages/SvgWaveGeneratorPage'
import CssFilterGeneratorPage from './pages/CssFilterGeneratorPage'
import RegexCheatSheetPage from './pages/RegexCheatSheetPage'
import CrcCalculatorPage from './pages/CrcCalculatorPage'
import JsonToTypeScriptPage from './pages/JsonToTypeScriptPage'
import JsonToYamlPage from './pages/JsonToYamlPage'
import CaddyfileGeneratorPage from './pages/CaddyfileGeneratorPage'
import UnitsConverterPage from './pages/UnitsConverterPage'
import HttpHeadersPage from './pages/HttpHeadersPage'
import JavascriptCheatsheetPage from './pages/JavascriptCheatsheetPage'
import TmuxCheatsheetPage from './pages/TmuxCheatsheetPage'
import DevToolsShortcutsPage from './pages/DevToolsShortcutsPage'
import Ipv6ExplorerPage from './pages/Ipv6ExplorerPage'

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
      { path: 'tools/semver-comparator', element: <SemverComparatorPage /> },
      { path: 'tools/slug-generator', element: <SlugGeneratorPage /> },
      { path: 'frontend/palette-generator', element: <PaletteGeneratorPage /> },
      { path: 'styles/ripple-button', element: <RippleButtonPage /> },
      { path: 'snippets/use-on-screen', element: <UseOnScreenSnippetPage /> },
      { path: 'references/flexbox-cheatsheet', element: <FlexboxCheatsheetPage /> },
      { path: 'tools/css-unit-converter', element: <CssUnitConverterPage /> },
      { path: 'tools/css-specificity-calculator', element: <CssSpecificityCalculatorPage /> },
      { path: 'styles/floating-label-input', element: <FloatingLabelInputPage /> },
      { path: 'snippets/use-key-press', element: <UseKeyPressSnippetPage /> },
      { path: 'references/sql-commands', element: <SqlCommandsPage /> },
      { path: 'tools/nanoid-generator', element: <NanoIdGeneratorPage /> },
      { path: 'tools/html-entity-encoder', element: <HtmlEntityEncoderPage /> },
      { path: 'frontend/border-radius-generator', element: <BorderRadiusGeneratorPage /> },
      { path: 'styles/ios-toggle-switch', element: <IosToggleSwitchPage /> },
      { path: 'snippets/use-event-listener', element: <UseEventListenerSnippetPage /> },
      { path: 'references/package-manager-commands', element: <PackageManagerCommandsPage /> },
      { path: 'tools/hmac-generator', element: <HmacGeneratorPage /> },
      { path: 'tools/lorem-ipsum-generator', element: <LoremIpsumGeneratorPage /> },
      { path: 'data/json-diff', element: <JsonDiffPage /> },
      { path: 'styles/dark-mode-toggle', element: <DarkModeTogglePage /> },
      { path: 'snippets/use-throttle', element: <UseThrottleSnippetPage /> },
      { path: 'references/vscode-shortcuts', element: <VscodeShortcutsPage /> },
      { path: 'data/json-path-explorer', element: <JsonPathExplorerPage /> },
      { path: 'references/css-grid-cheatsheet', element: <CssGridCheatsheetPage /> },
      { path: 'snippets/fisher-yates-shuffle', element: <FisherYatesShufflePage /> },
      { path: 'extras/team-roulette', element: <TeamRoulettePage /> },
      { path: 'extras/pomodoro-timer', element: <PomodoroTimerPage /> },
      { path: 'tools/jwt-generator', element: <JwtGeneratorPage /> },
      { path: 'styles/toast-notification', element: <ToastNotificationPage /> },
      { path: 'snippets/use-undo', element: <UseUndoSnippetPage /> },
      { path: 'references/bash-shortcuts', element: <BashShortcutsPage /> },
      { path: 'devops/commit-message-generator', element: <CommitMessageGeneratorPage /> },
      { path: 'security/robots-txt-generator', element: <RobotsTxtGeneratorPage /> },
      { path: 'styles/scroll-progress-bar', element: <ScrollProgressBarPage /> },
      { path: 'styles/confetti-effect', element: <ConfettiEffectPage /> },
      { path: 'snippets/debounce-throttle-functions', element: <DebounceThrottleFunctionsPage /> },
      { path: 'tools/jwt-timeline', element: <JwtTimelinePage /> },
      { path: 'styles/typewriter-effect', element: <TypewriterEffectPage /> },
      { path: 'snippets/lru-cache', element: <LruCachePage /> },
      { path: 'security/csp-generator', element: <CspGeneratorPage /> },
      { path: 'ai/token-counter', element: <TokenCounterPage /> },
      { path: 'devops/env-tool', element: <EnvToolPage /> },
      { path: 'text/remove-accents', element: <RemoveAccentsPage /> },
      { path: 'tools/xml-formatter', element: <XmlFormatterPage /> },
      { path: 'snippets/deep-clone-deep-equal', element: <DeepCloneDeepEqualPage /> },
      { path: 'devops/branch-name-generator', element: <BranchNameGeneratorPage /> },
      { path: 'text/lines-tool', element: <LinesToolPage /> },
      { path: 'tools/html-to-jsx-converter', element: <HtmlToJsxConverterPage /> },
      { path: 'extras/uuid-collision-simulator', element: <UuidCollisionSimulatorPage /> },
      { path: 'tools/unicode-inspector', element: <UnicodeInspectorPage /> },
      { path: 'database/json-to-sql', element: <JsonToSqlPage /> },
      { path: 'extras/sorting-visualizer', element: <SortingVisualizerPage /> },
      { path: 'styles/otp-input', element: <OtpInputPage /> },
      { path: 'tools/timezone-converter', element: <TimezoneConverterPage /> },
      { path: 'network/user-agent-parser', element: <UserAgentParserPage /> },
      { path: 'tools/cron-builder', element: <CronBuilderPage /> },
      { path: 'network/mime-lookup', element: <MimeLookupPage /> },
      { path: 'references/http-methods', element: <HttpMethodsPage /> },
      { path: 'tools/number-to-words', element: <NumberToWordsPage /> },
      { path: 'data/json-schema-generator', element: <JsonSchemaGeneratorPage /> },
      { path: 'data/json-schema-validator', element: <JsonSchemaValidatorPage /> },
      { path: 'tools/css-formatter', element: <CssFormatterPage /> },
      { path: 'database/sql-formatter', element: <SqlFormatterPage /> },
      { path: 'network/common-ports', element: <CommonPortsPage /> },
      { path: 'network/ipv6-explorer', element: <Ipv6ExplorerPage /> },
      { path: 'data/csv-markdown-table', element: <CsvMarkdownTablePage /> },
      { path: 'references/markdown-syntax', element: <MarkdownSyntaxPage /> },
      { path: 'devops/kubectl-commands', element: <KubeCtlCommandsPage /> },
      { path: 'devops/chmod-calculator', element: <ChmodCalculatorPage /> },
      { path: 'tools/float-explorer', element: <FloatExplorerPage /> },
      { path: 'frontend/svg-placeholder-generator', element: <SvgPlaceholderGeneratorPage /> },
      { path: 'devops/dockerfile-generator', element: <DockerfileGeneratorPage /> },
      { path: 'frontend/cubic-bezier-editor', element: <CubicBezierEditorPage /> },
      { path: 'devops/ansi-colors', element: <AnsiColorsPage /> },
      { path: 'references/ascii-table', element: <AsciiTablePage /> },
      { path: 'frontend/svg-wave-generator', element: <SvgWaveGeneratorPage /> },
      { path: 'frontend/css-filter-generator', element: <CssFilterGeneratorPage /> },
      { path: 'references/regex-cheatsheet', element: <RegexCheatSheetPage /> },
      { path: 'tools/crc-calculator', element: <CrcCalculatorPage /> },
      { path: 'data/json-to-typescript', element: <JsonToTypeScriptPage /> },
      { path: 'data/json-to-yaml', element: <JsonToYamlPage /> },
      { path: 'devops/caddyfile-generator', element: <CaddyfileGeneratorPage /> },
      { path: 'tools/units-converter', element: <UnitsConverterPage /> },
      { path: 'references/http-headers', element: <HttpHeadersPage /> },
      { path: 'references/javascript-cheatsheet', element: <JavascriptCheatsheetPage /> },
      { path: 'references/tmux-cheatsheet', element: <TmuxCheatsheetPage /> },
      { path: 'references/devtools-shortcuts', element: <DevToolsShortcutsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
