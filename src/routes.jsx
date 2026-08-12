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
import CurlToCodePage from './pages/CurlToCodePage'
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
import DateTimeCalculatorPage from './pages/DateTimeCalculatorPage'
import RegexTesterPage from './pages/RegexTesterPage'
import KeyboardEventTesterPage from './pages/KeyboardEventTesterPage'
import Base64ToolPage from './pages/Base64ToolPage'
import UuidGeneratorPage from './pages/UuidGeneratorPage'
import HtmlFormatterPage from './pages/HtmlFormatterPage'
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
import UseCountdownSnippetPage from './pages/UseCountdownSnippetPage'
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
import FontFaceGeneratorPage from './pages/FontFaceGeneratorPage'
import CssUnitConverterPage from './pages/CssUnitConverterPage'
import AspectRatioCalculatorPage from './pages/AspectRatioCalculatorPage'
import CssSpecificityCalculatorPage from './pages/CssSpecificityCalculatorPage'
import CssSelectorTesterPage from './pages/CssSelectorTesterPage'
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
import SecurityHeadersGeneratorPage from './pages/SecurityHeadersGeneratorPage'
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
import MetaTagsGeneratorPage from './pages/MetaTagsGeneratorPage'
import RegexCheatSheetPage from './pages/RegexCheatSheetPage'
import CrcCalculatorPage from './pages/CrcCalculatorPage'
import JsonToTypeScriptPage from './pages/JsonToTypeScriptPage'
import JsonToYamlPage from './pages/JsonToYamlPage'
import JsonFlattenPage from './pages/JsonFlattenPage'
import CaddyfileGeneratorPage from './pages/CaddyfileGeneratorPage'
import UnitsConverterPage from './pages/UnitsConverterPage'
import HttpHeadersPage from './pages/HttpHeadersPage'
import JavascriptCheatsheetPage from './pages/JavascriptCheatsheetPage'
import TmuxCheatsheetPage from './pages/TmuxCheatsheetPage'
import DevToolsShortcutsPage from './pages/DevToolsShortcutsPage'
import Ipv6ExplorerPage from './pages/Ipv6ExplorerPage'
import KeyframeGeneratorPage from './pages/KeyframeGeneratorPage'
import ClipPathGeneratorPage from './pages/ClipPathGeneratorPage'
import TomlFormatterPage from './pages/TomlFormatterPage'
import HtmlToMarkdownPage from './pages/HtmlToMarkdownPage'
import ChangelogGeneratorPage from './pages/ChangelogGeneratorPage'
import VimCheatsheetPage from './pages/VimCheatsheetPage'
import SshCheatsheetPage from './pages/SshCheatsheetPage'
import DockerComposeGeneratorPage from './pages/DockerComposeGeneratorPage'
import OpensslCommandsPage from './pages/OpensslCommandsPage'
import PythonCheatsheetPage from './pages/PythonCheatsheetPage'
import GrepSedAwkCheatsheetPage from './pages/GrepSedAwkCheatsheetPage'
import JqCheatsheetPage from './pages/JqCheatsheetPage'
import ScrollbarCssGeneratorPage from './pages/ScrollbarCssGeneratorPage'
import SitemapGeneratorPage from './pages/SitemapGeneratorPage'
import EditorconfigGeneratorPage from './pages/EditorconfigGeneratorPage'
import LicenseGeneratorPage from './pages/LicenseGeneratorPage'
import DockerignoreGeneratorPage from './pages/DockerignoreGeneratorPage'
import PrettierrcGeneratorPage from './pages/PrettierrcGeneratorPage'
import MakefileGeneratorPage from './pages/MakefileGeneratorPage'
import CssSpinnerGeneratorPage from './pages/CssSpinnerGeneratorPage'
import ColorBlindnessSimulatorPage from './pages/ColorBlindnessSimulatorPage'
import TextShadowGeneratorPage from './pages/TextShadowGeneratorPage'
import TransformGeneratorPage from './pages/TransformGeneratorPage'
import ContainerQueryGeneratorPage from './pages/ContainerQueryGeneratorPage'
import ScrollSnapGeneratorPage from './pages/ScrollSnapGeneratorPage'
import CssTransitionGeneratorPage from './pages/CssTransitionGeneratorPage'
import CssTooltipGeneratorPage from './pages/CssTooltipGeneratorPage'
import GradientTextGeneratorPage from './pages/GradientTextGeneratorPage'
import CustomPropertiesGeneratorPage from './pages/CustomPropertiesGeneratorPage'
import CssColumnsGeneratorPage from './pages/CssColumnsGeneratorPage'
import CssBreadcrumbsGeneratorPage from './pages/CssBreadcrumbsGeneratorPage'
import CssTabsGeneratorPage from './pages/CssTabsGeneratorPage'
import CssProgressBarGeneratorPage from './pages/CssProgressBarGeneratorPage'
import CssModalGeneratorPage from './pages/CssModalGeneratorPage'
import CssAccordionGeneratorPage from './pages/CssAccordionGeneratorPage'
import CssRangeSliderGeneratorPage from './pages/CssRangeSliderGeneratorPage'
import CssStarRatingGeneratorPage from './pages/CssStarRatingGeneratorPage'
import CssGlassmorphismGeneratorPage from './pages/CssGlassmorphismGeneratorPage'
import CssToggleSwitchGeneratorPage from './pages/CssToggleSwitchGeneratorPage'
import CssCustomCheckboxGeneratorPage from './pages/CssCustomCheckboxGeneratorPage'
import CssChipGeneratorPage from './pages/CssChipGeneratorPage'
import CssPaginationGeneratorPage from './pages/CssPaginationGeneratorPage'
import CssRadioButtonGeneratorPage from './pages/CssRadioButtonGeneratorPage'
import CssCardGeneratorPage from './pages/CssCardGeneratorPage'
import CssDropdownMenuGeneratorPage from './pages/CssDropdownMenuGeneratorPage'
import BashScriptingCheatsheetPage from './pages/BashScriptingCheatsheetPage'
import SystemdCheatsheetPage from './pages/SystemdCheatsheetPage'
import SlaCalculatorPage from './pages/SlaCalculatorPage'
import CreditCardToolPage from './pages/CreditCardToolPage'
import QrCodeGeneratorPage from './pages/QrCodeGeneratorPage'
import GithubActionsCheatsheetPage from './pages/GithubActionsCheatsheetPage'
import CssToJsPage from './pages/CssToJsPage'
import NginxCheatsheetPage from './pages/NginxCheatsheetPage'
import RedisCheatsheetPage from './pages/RedisCheatsheetPage'
import GhCliCheatsheetPage from './pages/GhCliCheatsheetPage'
import ClampGeneratorPage from './pages/ClampGeneratorPage'
import CssTriangleGeneratorPage from './pages/CssTriangleGeneratorPage'
import TypescriptCheatsheetPage from './pages/TypescriptCheatsheetPage'
import MorseConverterPage from './pages/MorseConverterPage'
import GlobTesterPage from './pages/GlobTesterPage'
import HtmlCheatsheetPage from './pages/HtmlCheatsheetPage'
import UrlParserPage from './pages/UrlParserPage'
import JsTestingCheatsheetPage from './pages/JsTestingCheatsheetPage'
import ReactCheatsheetPage from './pages/ReactCheatsheetPage'
import TailwindCheatsheetPage from './pages/TailwindCheatsheetPage'
import CssSelectorsCheatsheetPage from './pages/CssSelectorsCheatsheetPage'
import GridAreasGeneratorPage from './pages/GridAreasGeneratorPage'
import XmlJsonConverterPage from './pages/XmlJsonConverterPage'
import PatternBackgroundGeneratorPage from './pages/PatternBackgroundGeneratorPage'
import WebAppManifestGeneratorPage from './pages/WebAppManifestGeneratorPage'

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
      { path: 'apis/curl-to-code', element: <CurlToCodePage /> },
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
      { path: 'tools/date-time-calculator', element: <DateTimeCalculatorPage /> },
      { path: 'tools/regex-tester', element: <RegexTesterPage /> },
      { path: 'tools/keyboard-event-tester', element: <KeyboardEventTesterPage /> },
      { path: 'tools/base64-tool', element: <Base64ToolPage /> },
      { path: 'tools/uuid-generator', element: <UuidGeneratorPage /> },
      { path: 'tools/case-converter', element: <CaseConverterPage /> },
      { path: 'tools/password-generator', element: <PasswordGeneratorPage /> },
      { path: 'tools/url-encoder', element: <UrlEncoderPage /> },
      { path: 'tools/url-parser', element: <UrlParserPage /> },
      { path: 'tools/xml-json-converter', element: <XmlJsonConverterPage /> },
      { path: 'frontend/gradient-generator', element: <GradientGeneratorPage /> },
      { path: 'snippets/use-copy-to-clipboard', element: <UseCopyToClipboardSnippetPage /> },
      { path: 'references/http-status-codes', element: <HttpStatusCodesPage /> },
      { path: 'tools/diff-checker', element: <DiffCheckerPage /> },
      { path: 'frontend/box-shadow-generator', element: <BoxShadowGeneratorPage /> },
      { path: 'data/csv-json-converter', element: <CsvJsonConverterPage /> },
      { path: 'snippets/use-interval', element: <UseIntervalSnippetPage /> },
      { path: 'snippets/use-countdown', element: <UseCountdownSnippetPage /> },
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
      { path: 'tools/aspect-ratio-calculator', element: <AspectRatioCalculatorPage /> },
      { path: 'tools/css-specificity-calculator', element: <CssSpecificityCalculatorPage /> },
      { path: 'tools/css-selector-tester', element: <CssSelectorTesterPage /> },
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
      { path: 'security/security-headers-generator', element: <SecurityHeadersGeneratorPage /> },
      { path: 'ai/token-counter', element: <TokenCounterPage /> },
      { path: 'devops/env-tool', element: <EnvToolPage /> },
      { path: 'text/remove-accents', element: <RemoveAccentsPage /> },
      { path: 'tools/xml-formatter', element: <XmlFormatterPage /> },
      { path: 'tools/toml-formatter', element: <TomlFormatterPage /> },
      { path: 'tools/html-formatter', element: <HtmlFormatterPage /> },
      { path: 'snippets/deep-clone-deep-equal', element: <DeepCloneDeepEqualPage /> },
      { path: 'devops/branch-name-generator', element: <BranchNameGeneratorPage /> },
      { path: 'text/lines-tool', element: <LinesToolPage /> },
      { path: 'tools/html-to-jsx-converter', element: <HtmlToJsxConverterPage /> },
      { path: 'tools/html-to-markdown', element: <HtmlToMarkdownPage /> },
      { path: 'devops/changelog-generator', element: <ChangelogGeneratorPage /> },
      { path: 'references/vim-cheatsheet', element: <VimCheatsheetPage /> },
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
      { path: 'frontend/meta-tags-generator', element: <MetaTagsGeneratorPage /> },
      { path: 'frontend/keyframe-generator', element: <KeyframeGeneratorPage /> },
      { path: 'frontend/clip-path-generator', element: <ClipPathGeneratorPage /> },
      { path: 'references/regex-cheatsheet', element: <RegexCheatSheetPage /> },
      { path: 'tools/crc-calculator', element: <CrcCalculatorPage /> },
      { path: 'data/json-to-typescript', element: <JsonToTypeScriptPage /> },
      { path: 'data/json-to-yaml', element: <JsonToYamlPage /> },
      { path: 'data/json-flatten', element: <JsonFlattenPage /> },
      { path: 'devops/docker-compose-generator', element: <DockerComposeGeneratorPage /> },
      { path: 'devops/openssl-commands', element: <OpensslCommandsPage /> },
      { path: 'devops/caddyfile-generator', element: <CaddyfileGeneratorPage /> },
      { path: 'tools/units-converter', element: <UnitsConverterPage /> },
      { path: 'references/http-headers', element: <HttpHeadersPage /> },
      { path: 'references/javascript-cheatsheet', element: <JavascriptCheatsheetPage /> },
      { path: 'references/tmux-cheatsheet', element: <TmuxCheatsheetPage /> },
      { path: 'references/devtools-shortcuts', element: <DevToolsShortcutsPage /> },
      { path: 'references/ssh-cheatsheet', element: <SshCheatsheetPage /> },
      { path: 'references/python-cheatsheet', element: <PythonCheatsheetPage /> },
      { path: 'references/grep-sed-awk', element: <GrepSedAwkCheatsheetPage /> },
      { path: 'references/jq-cheatsheet', element: <JqCheatsheetPage /> },
      { path: 'frontend/scrollbar-generator', element: <ScrollbarCssGeneratorPage /> },
      { path: 'references/bash-scripting', element: <BashScriptingCheatsheetPage /> },
      { path: 'references/systemd-commands', element: <SystemdCheatsheetPage /> },
      { path: 'devops/sla-calculator', element: <SlaCalculatorPage /> },
      { path: 'tools/credit-card-tool', element: <CreditCardToolPage /> },
      { path: 'tools/qr-code-generator', element: <QrCodeGeneratorPage /> },
      { path: 'references/github-actions-cheatsheet', element: <GithubActionsCheatsheetPage /> },
      { path: 'frontend/css-to-js', element: <CssToJsPage /> },
      { path: 'references/nginx-cheatsheet', element: <NginxCheatsheetPage /> },
      { path: 'references/redis-commands', element: <RedisCheatsheetPage /> },
      { path: 'references/gh-cli-cheatsheet', element: <GhCliCheatsheetPage /> },
      { path: 'frontend/clamp-generator', element: <ClampGeneratorPage /> },
      { path: 'frontend/css-triangle-generator', element: <CssTriangleGeneratorPage /> },
      { path: 'frontend/font-face-generator', element: <FontFaceGeneratorPage /> },
      { path: 'references/typescript-cheatsheet', element: <TypescriptCheatsheetPage /> },
      { path: 'tools/morse-code-converter', element: <MorseConverterPage /> },
      { path: 'tools/glob-tester', element: <GlobTesterPage /> },
      { path: 'references/html-cheatsheet', element: <HtmlCheatsheetPage /> },
      { path: 'references/react-cheatsheet', element: <ReactCheatsheetPage /> },
      { path: 'references/tailwind-cheatsheet', element: <TailwindCheatsheetPage /> },
      { path: 'references/css-selectors-cheatsheet', element: <CssSelectorsCheatsheetPage /> },
      { path: 'frontend/grid-areas-generator', element: <GridAreasGeneratorPage /> },
      { path: 'frontend/pattern-background-generator', element: <PatternBackgroundGeneratorPage /> },
      { path: 'frontend/sitemap-generator', element: <SitemapGeneratorPage /> },
      { path: 'frontend/web-app-manifest', element: <WebAppManifestGeneratorPage /> },
      { path: 'devops/editorconfig-generator', element: <EditorconfigGeneratorPage /> },
      { path: 'devops/license-generator', element: <LicenseGeneratorPage /> },
      { path: 'devops/dockerignore-generator', element: <DockerignoreGeneratorPage /> },
      { path: 'devops/prettierrc-generator', element: <PrettierrcGeneratorPage /> },
      { path: 'devops/makefile-generator', element: <MakefileGeneratorPage /> },
      { path: 'frontend/css-spinner-generator', element: <CssSpinnerGeneratorPage /> },
      { path: 'frontend/color-blindness-simulator', element: <ColorBlindnessSimulatorPage /> },
      { path: 'frontend/text-shadow-generator', element: <TextShadowGeneratorPage /> },
      { path: 'frontend/transform-generator', element: <TransformGeneratorPage /> },
      { path: 'frontend/container-query-generator', element: <ContainerQueryGeneratorPage /> },
      { path: 'frontend/scroll-snap-generator', element: <ScrollSnapGeneratorPage /> },
      { path: 'frontend/css-transition-generator', element: <CssTransitionGeneratorPage /> },
      { path: 'frontend/css-tooltip-generator', element: <CssTooltipGeneratorPage /> },
      { path: 'frontend/gradient-text-generator', element: <GradientTextGeneratorPage /> },
      { path: 'frontend/custom-properties-generator', element: <CustomPropertiesGeneratorPage /> },
      { path: 'frontend/css-columns-generator', element: <CssColumnsGeneratorPage /> },
      { path: 'frontend/css-breadcrumbs-generator', element: <CssBreadcrumbsGeneratorPage /> },
      { path: 'frontend/css-tabs-generator', element: <CssTabsGeneratorPage /> },
      { path: 'frontend/css-progress-bar-generator', element: <CssProgressBarGeneratorPage /> },
      { path: 'frontend/css-modal-generator', element: <CssModalGeneratorPage /> },
      { path: 'frontend/css-accordion-generator', element: <CssAccordionGeneratorPage /> },
      { path: 'frontend/css-range-slider-generator', element: <CssRangeSliderGeneratorPage /> },
      { path: 'frontend/css-star-rating-generator', element: <CssStarRatingGeneratorPage /> },
      { path: 'frontend/css-glassmorphism-generator', element: <CssGlassmorphismGeneratorPage /> },
      { path: 'frontend/css-toggle-switch-generator', element: <CssToggleSwitchGeneratorPage /> },
      { path: 'frontend/css-custom-checkbox-generator', element: <CssCustomCheckboxGeneratorPage /> },
      { path: 'frontend/css-radio-button-generator', element: <CssRadioButtonGeneratorPage /> },
      { path: 'frontend/css-chip-generator', element: <CssChipGeneratorPage /> },
      { path: 'frontend/css-pagination-generator', element: <CssPaginationGeneratorPage /> },
      { path: 'frontend/css-card-generator', element: <CssCardGeneratorPage /> },
      { path: 'frontend/css-dropdown-menu-generator', element: <CssDropdownMenuGeneratorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
