import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import BastidoresPage from './pages/BastidoresPage'
import JwtDecoderPage from './pages/JwtDecoderPage'
import GlassCardShowcasePage from './pages/GlassCardShowcasePage'
import UseDebounceSnippetPage from './pages/UseDebounceSnippetPage'
import CronParserPage from './pages/CronParserPage'
import HashGeneratorPage from './pages/HashGeneratorPage'
import CopyButtonShowcasePage from './pages/CopyButtonShowcasePage'
import UseLocalStorageSnippetPage from './pages/UseLocalStorageSnippetPage'
import UseSessionStorageSnippetPage from './pages/UseSessionStorageSnippetPage'
import UseClickOutsideSnippetPage from './pages/UseClickOutsideSnippetPage'
import JsonFormatterPage from './pages/JsonFormatterPage'
import ColorConverterPage from './pages/ColorConverterPage'
import SkeletonShimmerPage from './pages/SkeletonShimmerPage'
import SpotlightCardShowcasePage from './pages/SpotlightCardShowcasePage'
import TimestampConverterPage from './pages/TimestampConverterPage'
import GradientBorderButtonPage from './pages/GradientBorderButtonPage'
import UseMediaQuerySnippetPage from './pages/UseMediaQuerySnippetPage'
import ContrastCheckerPage from './pages/ContrastCheckerPage'
import CurlGeneratorPage from './pages/CurlGeneratorPage'
import CurlToCodePage from './pages/CurlToCodePage'
import GraphqlFormatterPage from './pages/GraphqlFormatterPage'
import OpenapiSpecGeneratorPage from './pages/OpenapiSpecGeneratorPage'
import GitignoreGeneratorPage from './pages/GitignoreGeneratorPage'
import RateLimitCalculatorPage from './pages/RateLimitCalculatorPage'
import ArnParserPage from './pages/ArnParserPage'
import CloudCostEstimatorPage from './pages/CloudCostEstimatorPage'
import IamPolicyGeneratorPage from './pages/IamPolicyGeneratorPage'
import PasswordStrengthPage from './pages/PasswordStrengthPage'
import JsonTreeViewerPage from './pages/JsonTreeViewerPage'
import SubnetCalculatorPage from './pages/SubnetCalculatorPage'
import AnthropicCostCalculatorPage from './pages/AnthropicCostCalculatorPage'
import LlmPromptBuilderPage from './pages/LlmPromptBuilderPage'
import DeepLinkTesterPage from './pages/DeepLinkTesterPage'
import WordCounterPage from './pages/WordCounterPage'
import GitCommandsPage from './pages/GitCommandsPage'
import DaysUntilPage from './pages/DaysUntilPage'
import DateTimeCalculatorPage from './pages/DateTimeCalculatorPage'
import RegexTesterPage from './pages/RegexTesterPage'
import RegexPatternGeneratorPage from './pages/RegexPatternGeneratorPage'
import KeyboardEventTesterPage from './pages/KeyboardEventTesterPage'
import Base64ToolPage from './pages/Base64ToolPage'
import Base32ToolPage from './pages/Base32ToolPage'
import Base58ToolPage from './pages/Base58ToolPage'
import UuidGeneratorPage from './pages/UuidGeneratorPage'
import UuidV7GeneratorPage from './pages/UuidV7GeneratorPage'
import UlidToolPage from './pages/UlidToolPage'
import HtmlFormatterPage from './pages/HtmlFormatterPage'
import CaseConverterPage from './pages/CaseConverterPage'
import PasswordGeneratorPage from './pages/PasswordGeneratorPage'
import PassphraseGeneratorPage from './pages/PassphraseGeneratorPage'
import TotpGeneratorPage from './pages/TotpGeneratorPage'
import UrlEncoderPage from './pages/UrlEncoderPage'
import GradientGeneratorPage from './pages/GradientGeneratorPage'
import UseCopyToClipboardSnippetPage from './pages/UseCopyToClipboardSnippetPage'
import HttpStatusCodesPage from './pages/HttpStatusCodesPage'
import DiffCheckerPage from './pages/DiffCheckerPage'
import BoxShadowGeneratorPage from './pages/BoxShadowGeneratorPage'
import CsvJsonConverterPage from './pages/CsvJsonConverterPage'
import UseIntervalSnippetPage from './pages/UseIntervalSnippetPage'
import UseTimeoutSnippetPage from './pages/UseTimeoutSnippetPage'
import UseCountdownSnippetPage from './pages/UseCountdownSnippetPage'
import UseFetchSnippetPage from './pages/UseFetchSnippetPage'
import UseNetworkStatusSnippetPage from './pages/UseNetworkStatusSnippetPage'
import UseElementSizeSnippetPage from './pages/UseElementSizeSnippetPage'
import UseMousePositionSnippetPage from './pages/UseMousePositionSnippetPage'
import UsePageVisibilitySnippetPage from './pages/UsePageVisibilitySnippetPage'
import UseAsyncSnippetPage from './pages/UseAsyncSnippetPage'
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
import FontStackGeneratorPage from './pages/FontStackGeneratorPage'
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
import JwtSecretGeneratorPage from './pages/JwtSecretGeneratorPage'
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
import SriHashGeneratorPage from './pages/SriHashGeneratorPage'
import SecurityTxtGeneratorPage from './pages/SecurityTxtGeneratorPage'
import WebhookSignatureValidatorPage from './pages/WebhookSignatureValidatorPage'
import AsymmetricKeyGeneratorPage from './pages/AsymmetricKeyGeneratorPage'
import SymmetricKeyGeneratorPage from './pages/SymmetricKeyGeneratorPage'
import AesEncryptDecryptPage from './pages/AesEncryptDecryptPage'
import HashIdentifierPage from './pages/HashIdentifierPage'
import PkceGeneratorPage from './pages/PkceGeneratorPage'
import TokenCounterPage from './pages/TokenCounterPage'
import PomodoroTimerPage from './pages/PomodoroTimerPage'
import EnvToolPage from './pages/EnvToolPage'
import RemoveAccentsPage from './pages/RemoveAccentsPage'
import XmlFormatterPage from './pages/XmlFormatterPage'
import DeepCloneDeepEqualPage from './pages/DeepCloneDeepEqualPage'
import BranchNameGeneratorPage from './pages/BranchNameGeneratorPage'
import LinesToolPage from './pages/LinesToolPage'
import HtmlToJsxConverterPage from './pages/HtmlToJsxConverterPage'
import ImagePaletteExtractorPage from './pages/ImagePaletteExtractorPage'
import ImageDiffVisualizerPage from './pages/ImageDiffVisualizerPage'
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
import HtaccessGeneratorPage from './pages/HtaccessGeneratorPage'
import UnitsConverterPage from './pages/UnitsConverterPage'
import HttpHeadersPage from './pages/HttpHeadersPage'
import JavascriptCheatsheetPage from './pages/JavascriptCheatsheetPage'
import TmuxCheatsheetPage from './pages/TmuxCheatsheetPage'
import DevToolsShortcutsPage from './pages/DevToolsShortcutsPage'
import Ipv6ExplorerPage from './pages/Ipv6ExplorerPage'
import MacAddressToolPage from './pages/MacAddressToolPage'
import CidrOverlapAggregatorPage from './pages/CidrOverlapAggregatorPage'
import IbanToolPage from './pages/IbanToolPage'
import WebsocketTesterPage from './pages/WebsocketTesterPage'
import HarViewerPage from './pages/HarViewerPage'
import RomanNumeralConverterPage from './pages/RomanNumeralConverterPage'
import SqlJoinsPage from './pages/SqlJoinsPage'
import SqlIsolationLevelsPage from './pages/SqlIsolationLevelsPage'
import KeyframeGeneratorPage from './pages/KeyframeGeneratorPage'
import ClipPathGeneratorPage from './pages/ClipPathGeneratorPage'
import TomlFormatterPage from './pages/TomlFormatterPage'
import HtmlToMarkdownPage from './pages/HtmlToMarkdownPage'
import ChangelogGeneratorPage from './pages/ChangelogGeneratorPage'
import GitattributesGeneratorPage from './pages/GitattributesGeneratorPage'
import VimCheatsheetPage from './pages/VimCheatsheetPage'
import SshCheatsheetPage from './pages/SshCheatsheetPage'
import DockerComposeGeneratorPage from './pages/DockerComposeGeneratorPage'
import DockerRunToComposePage from './pages/DockerRunToComposePage'
import OpensslCommandsPage from './pages/OpensslCommandsPage'
import PythonCheatsheetPage from './pages/PythonCheatsheetPage'
import GrepSedAwkCheatsheetPage from './pages/GrepSedAwkCheatsheetPage'
import JqCheatsheetPage from './pages/JqCheatsheetPage'
import ScrollbarCssGeneratorPage from './pages/ScrollbarCssGeneratorPage'
import SitemapGeneratorPage from './pages/SitemapGeneratorPage'
import EditorconfigGeneratorPage from './pages/EditorconfigGeneratorPage'
import CodeownersGeneratorPage from './pages/CodeownersGeneratorPage'
import LicenseGeneratorPage from './pages/LicenseGeneratorPage'
import DockerignoreGeneratorPage from './pages/DockerignoreGeneratorPage'
import PrettierrcGeneratorPage from './pages/PrettierrcGeneratorPage'
import MakefileGeneratorPage from './pages/MakefileGeneratorPage'
import TsconfigGeneratorPage from './pages/TsconfigGeneratorPage'
import ViteConfigGeneratorPage from './pages/ViteConfigGeneratorPage'
import DiskPerformanceCalculatorPage from './pages/DiskPerformanceCalculatorPage'
import EslintConfigGeneratorPage from './pages/EslintConfigGeneratorPage'
import RenovateConfigGeneratorPage from './pages/RenovateConfigGeneratorPage'
import CorsConfigGeneratorPage from './pages/CorsConfigGeneratorPage'
import PullRequestTemplateGeneratorPage from './pages/PullRequestTemplateGeneratorPage'
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
import CssSkeletonGeneratorPage from './pages/CssSkeletonGeneratorPage'
import CssTimelineGeneratorPage from './pages/CssTimelineGeneratorPage'
import CssStepperGeneratorPage from './pages/CssStepperGeneratorPage'
import CssSpeechBubbleGeneratorPage from './pages/CssSpeechBubbleGeneratorPage'
import CssButtonGeneratorPage from './pages/CssButtonGeneratorPage'
import CssAlertGeneratorPage from './pages/CssAlertGeneratorPage'
import CssAvatarGeneratorPage from './pages/CssAvatarGeneratorPage'
import CssHamburgerMenuGeneratorPage from './pages/CssHamburgerMenuGeneratorPage'
import CssCornerRibbonGeneratorPage from './pages/CssCornerRibbonGeneratorPage'
import CssPricingTableGeneratorPage from './pages/CssPricingTableGeneratorPage'
import CssImageHoverGeneratorPage from './pages/CssImageHoverGeneratorPage'
import CssSegmentedControlGeneratorPage from './pages/CssSegmentedControlGeneratorPage'
import CssTableGeneratorPage from './pages/CssTableGeneratorPage'
import CssCursorGeneratorPage from './pages/CssCursorGeneratorPage'
import CssFlipCardGeneratorPage from './pages/CssFlipCardGeneratorPage'
import CssProgressRingGeneratorPage from './pages/CssProgressRingGeneratorPage'
import CssDividerGeneratorPage from './pages/CssDividerGeneratorPage'
import SvgBadgeGeneratorPage from './pages/SvgBadgeGeneratorPage'
import SvgSpriteGeneratorPage from './pages/SvgSpriteGeneratorPage'
import CssMarqueeGeneratorPage from './pages/CssMarqueeGeneratorPage'
import CssCarouselGeneratorPage from './pages/CssCarouselGeneratorPage'
import CssLoginFormGeneratorPage from './pages/CssLoginFormGeneratorPage'
import CssNeumorphismGeneratorPage from './pages/CssNeumorphismGeneratorPage'
import CssTextStrokeGeneratorPage from './pages/CssTextStrokeGeneratorPage'
import CssLineClampGeneratorPage from './pages/CssLineClampGeneratorPage'
import CssPulseGeneratorPage from './pages/CssPulseGeneratorPage'
import MasonryLayoutGeneratorPage from './pages/MasonryLayoutGeneratorPage'
import ColorMixGeneratorPage from './pages/ColorMixGeneratorPage'
import BlendModeGeneratorPage from './pages/BlendModeGeneratorPage'
import HtmlBoilerplateGeneratorPage from './pages/HtmlBoilerplateGeneratorPage'
import CssAnimationStaggerGeneratorPage from './pages/CssAnimationStaggerGeneratorPage'
import CssAtPropertyGeneratorPage from './pages/CssAtPropertyGeneratorPage'
import BashScriptingCheatsheetPage from './pages/BashScriptingCheatsheetPage'
import SystemdCheatsheetPage from './pages/SystemdCheatsheetPage'
import SlaCalculatorPage from './pages/SlaCalculatorPage'
import CreditCardToolPage from './pages/CreditCardToolPage'
import QrCodeGeneratorPage from './pages/QrCodeGeneratorPage'
import GithubActionsCheatsheetPage from './pages/GithubActionsCheatsheetPage'
import CssToJsPage from './pages/CssToJsPage'
import NginxCheatsheetPage from './pages/NginxCheatsheetPage'
import NginxConfigGeneratorPage from './pages/NginxConfigGeneratorPage'
import SshConfigGeneratorPage from './pages/SshConfigGeneratorPage'
import SystemdUnitGeneratorPage from './pages/SystemdUnitGeneratorPage'
import ShieldsBadgeGeneratorPage from './pages/ShieldsBadgeGeneratorPage'
import KubernetesManifestGeneratorPage from './pages/KubernetesManifestGeneratorPage'
import OtelCollectorConfigGeneratorPage from './pages/OtelCollectorConfigGeneratorPage'
import GitlabCiConfigGeneratorPage from './pages/GitlabCiConfigGeneratorPage'
import GithubActionsWorkflowGeneratorPage from './pages/GithubActionsWorkflowGeneratorPage'
import CiCdCostCalculatorPage from './pages/CiCdCostCalculatorPage'
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
import A11yCheatsheetPage from './pages/A11yCheatsheetPage'
import JwtClaimsCheatsheetPage from './pages/JwtClaimsCheatsheetPage'
import Oauth2CheatsheetPage from './pages/Oauth2CheatsheetPage'
import DesignPatternsCheatsheetPage from './pages/DesignPatternsCheatsheetPage'
import GridAreasGeneratorPage from './pages/GridAreasGeneratorPage'
import XmlJsonConverterPage from './pages/XmlJsonConverterPage'
import PatternBackgroundGeneratorPage from './pages/PatternBackgroundGeneratorPage'
import WebAppManifestGeneratorPage from './pages/WebAppManifestGeneratorPage'
import DataUriToolPage from './pages/DataUriToolPage'
import DirectoryTreeGeneratorPage from './pages/DirectoryTreeGeneratorPage'
import PayloadCompressionCalculatorPage from './pages/PayloadCompressionCalculatorPage'
import UseUpdateEffectSnippetPage from './pages/UseUpdateEffectSnippetPage'
import UseWhyDidYouUpdateSnippetPage from './pages/UseWhyDidYouUpdateSnippetPage'
import UseBooleanSnippetPage from './pages/UseBooleanSnippetPage'
import UseSetSnippetPage from './pages/UseSetSnippetPage'
import UseCounterSnippetPage from './pages/UseCounterSnippetPage'
import TypographyScaleCalculatorPage from './pages/TypographyScaleCalculatorPage'
import TypingSpeedTestPage from './pages/TypingSpeedTestPage'
import ConwaysGameOfLifePage from './pages/ConwaysGameOfLifePage'
import PathfindingSimulatorPage from './pages/PathfindingSimulatorPage'
import UrlEmailExtractorPage from './pages/UrlEmailExtractorPage'
import BarcodeGeneratorPage from './pages/BarcodeGeneratorPage'
import UseLockBodyScrollSnippetPage from './pages/UseLockBodyScrollSnippetPage'
import UseStableCallbackSnippetPage from './pages/UseStableCallbackSnippetPage'
import UseHoverSnippetPage from './pages/UseHoverSnippetPage'
import UseMergedRefSnippetPage from './pages/UseMergedRefSnippetPage'
import UseQueueSnippetPage from './pages/UseQueueSnippetPage'
import UseLongPressSnippetPage from './pages/UseLongPressSnippetPage'
import UseFormSnippetPage from './pages/UseFormSnippetPage'
import UsePreferredColorSchemeSnippetPage from './pages/UsePreferredColorSchemeSnippetPage'
import UseFaviconSnippetPage from './pages/UseFaviconSnippetPage'
import UseDocumentTitleSnippetPage from './pages/UseDocumentTitleSnippetPage'
import UseListSnippetPage from './pages/UseListSnippetPage'
import UseWindowFocusSnippetPage from './pages/UseWindowFocusSnippetPage'
import UseBeforeUnloadSnippetPage from './pages/UseBeforeUnloadSnippetPage'
import UseCountUpSnippetPage from './pages/UseCountUpSnippetPage'
import UseScriptSnippetPage from './pages/UseScriptSnippetPage'
import UseBatterySnippetPage from './pages/UseBatterySnippetPage'
import UseGeolocationSnippetPage from './pages/UseGeolocationSnippetPage'
import UseMapSnippetPage from './pages/UseMapSnippetPage'
import UseStateWithHistorySnippetPage from './pages/UseStateWithHistorySnippetPage'
import UseIdleSnippetPage from './pages/UseIdleSnippetPage'
import UseMutationObserverSnippetPage from './pages/UseMutationObserverSnippetPage'
import UseResizeObserverSnippetPage from './pages/UseResizeObserverSnippetPage'
import UseHotkeysSnippetPage from './pages/UseHotkeysSnippetPage'
import UseSpeechSynthesisSnippetPage from './pages/UseSpeechSynthesisSnippetPage'
import UsePaginationSnippetPage from './pages/UsePaginationSnippetPage'
import UseControllableStateSnippetPage from './pages/UseControllableStateSnippetPage'
import FileSizeConverterPage from './pages/FileSizeConverterPage'
import FileHashCalculatorPage from './pages/FileHashCalculatorPage'
import GeoCoordinatesConverterPage from './pages/GeoCoordinatesConverterPage'
import HaversineDistanceCalculatorPage from './pages/HaversineDistanceCalculatorPage'
import LevenshteinCalculatorPage from './pages/LevenshteinCalculatorPage'
import BandwidthCalculatorPage from './pages/BandwidthCalculatorPage'
import CookieToolPage from './pages/CookieToolPage'
import CompoundInterestCalculatorPage from './pages/CompoundInterestCalculatorPage'
import PercentageCalculatorPage from './pages/PercentageCalculatorPage'
import AbTestCalculatorPage from './pages/AbTestCalculatorPage'
import ReadingTimeCalculatorPage from './pages/ReadingTimeCalculatorPage'
import ConnectionStringParserPage from './pages/ConnectionStringParserPage'
import BigOCheatsheetPage from './pages/BigOCheatsheetPage'
import JsonToZodSchemaPage from './pages/JsonToZodSchemaPage'
import LoanAmortizationCalculatorPage from './pages/LoanAmortizationCalculatorPage'
import BashToPowershellPage from './pages/BashToPowershellPage'
import RetryCalculatorPage from './pages/RetryCalculatorPage'
import StringEscapePage from './pages/StringEscapePage'
import AwsCliCheatsheetPage from './pages/AwsCliCheatsheetPage'
import CaesarCipherPage from './pages/CaesarCipherPage'
import UtmUrlBuilderPage from './pages/UtmUrlBuilderPage'
import CacheSimulatorPage from './pages/CacheSimulatorPage'
import DescriptiveStatisticsCalculatorPage from './pages/DescriptiveStatisticsCalculatorPage'
import LoadBalancerSimulatorPage from './pages/LoadBalancerSimulatorPage'
import ConsistentHashingSimulatorPage from './pages/ConsistentHashingSimulatorPage'
import BloomFilterSimulatorPage from './pages/BloomFilterSimulatorPage'
import CpuSchedulingSimulatorPage from './pages/CpuSchedulingSimulatorPage'
import DiskSchedulingSimulatorPage from './pages/DiskSchedulingSimulatorPage'
import GossipProtocolSimulatorPage from './pages/GossipProtocolSimulatorPage'
import PageReplacementSimulatorPage from './pages/PageReplacementSimulatorPage'
import MerkleTreeSimulatorPage from './pages/MerkleTreeSimulatorPage'
import QuorumNwrSimulatorPage from './pages/QuorumNwrSimulatorPage'
import CsvToSqlPage from './pages/CsvToSqlPage'
import DatabaseStorageEstimatorPage from './pages/DatabaseStorageEstimatorPage'
import BmiCalculatorPage from './pages/BmiCalculatorPage'
import LogicalClocksSimulatorPage from './pages/LogicalClocksSimulatorPage'
import MapreduceSimulatorPage from './pages/MapreduceSimulatorPage'
import MediaQueryGeneratorPage from './pages/MediaQueryGeneratorPage'
import CssSupportsGeneratorPage from './pages/CssSupportsGeneratorPage'
import CssLayerGeneratorPage from './pages/CssLayerGeneratorPage'
import FaviconGeneratorPage from './pages/FaviconGeneratorPage'
import CssHasSelectorTesterPage from './pages/CssHasSelectorTesterPage'
import CircuitBreakerSimulatorPage from './pages/CircuitBreakerSimulatorPage'
import RateLimiterSimulatorPage from './pages/RateLimiterSimulatorPage'
import TwoPhaseCommitSimulatorPage from './pages/TwoPhaseCommitSimulatorPage'
import ThreePhaseCommitSimulatorPage from './pages/ThreePhaseCommitSimulatorPage'
import RaidSimulatorPage from './pages/RaidSimulatorPage'
import BlockchainSimulatorPage from './pages/BlockchainSimulatorPage'
import HuffmanCodingSimulatorPage from './pages/HuffmanCodingSimulatorPage'
import SequenceDiagramGeneratorPage from './pages/SequenceDiagramGeneratorPage'
import SqlInListGeneratorPage from './pages/SqlInListGeneratorPage'
import DiningPhilosophersSimulatorPage from './pages/DiningPhilosophersSimulatorPage'
import TruthTableGeneratorPage from './pages/TruthTableGeneratorPage'
import AvailabilityCalculatorPage from './pages/AvailabilityCalculatorPage'
import BrazilianDataGeneratorPage from './pages/BrazilianDataGeneratorPage'
import BankersAlgorithmSimulatorPage from './pages/BankersAlgorithmSimulatorPage'
import EmailSignatureGeneratorPage from './pages/EmailSignatureGeneratorPage'
import ConfigConverterPage from './pages/ConfigConverterPage'
import NetworkLatencyCalculatorPage from './pages/NetworkLatencyCalculatorPage'
import HttpCacheAnalyzerPage from './pages/HttpCacheAnalyzerPage'
import DnsRecordGeneratorPage from './pages/DnsRecordGeneratorPage'
import TcpThroughputCalculatorPage from './pages/TcpThroughputCalculatorPage'
import ShannonCapacityCalculatorPage from './pages/ShannonCapacityCalculatorPage'
import LittlesLawCalculatorPage from './pages/LittlesLawCalculatorPage'
import ConcurrencyThroughputCalculatorPage from './pages/ConcurrencyThroughputCalculatorPage'
import QueueingTheoryCalculatorPage from './pages/QueueingTheoryCalculatorPage'
import PertCalculatorPage from './pages/PertCalculatorPage'
import ConfidenceIntervalCalculatorPage from './pages/ConfidenceIntervalCalculatorPage'
import DowntimeCostCalculatorPage from './pages/DowntimeCostCalculatorPage'
import MemoryAllocationSimulatorPage from './pages/MemoryAllocationSimulatorPage'
import RaftSimulatorPage from './pages/RaftSimulatorPage'
import PaxosSimulatorPage from './pages/PaxosSimulatorPage'
import BullyAlgorithmSimulatorPage from './pages/BullyAlgorithmSimulatorPage'
import RingElectionSimulatorPage from './pages/RingElectionSimulatorPage'
import DeadlockSimulatorPage from './pages/DeadlockSimulatorPage'
import SreBurnRateCalculatorPage from './pages/SreBurnRateCalculatorPage'
import AmdahlsLawCalculatorPage from './pages/AmdahlsLawCalculatorPage'
import UnicodeNormalizerPage from './pages/UnicodeNormalizerPage'
import AwsSigv4SignatureGeneratorPage from './pages/AwsSigv4SignatureGeneratorPage'
import ReadabilityCalculatorPage from './pages/ReadabilityCalculatorPage'
import LinearRegressionCalculatorPage from './pages/LinearRegressionCalculatorPage'
import NpvIrrRoiCalculatorPage from './pages/NpvIrrRoiCalculatorPage'
import SaasUnitEconomicsCalculatorPage from './pages/SaasUnitEconomicsCalculatorPage'
import SoftwareBugCostCalculatorPage from './pages/SoftwareBugCostCalculatorPage'
import TestAutomationRoiCalculatorPage from './pages/TestAutomationRoiCalculatorPage'
import LatencyBudgetCalculatorPage from './pages/LatencyBudgetCalculatorPage'
import CacheHitRatioCalculatorPage from './pages/CacheHitRatioCalculatorPage'
import LogStorageCostCalculatorPage from './pages/LogStorageCostCalculatorPage'
import WebVitalsBudgetCalculatorPage from './pages/WebVitalsBudgetCalculatorPage'
import TerraformCheatsheetPage from './pages/TerraformCheatsheetPage'
import NodejsCheatsheetPage from './pages/NodejsCheatsheetPage'
import PostgresqlCheatsheetPage from './pages/PostgresqlCheatsheetPage'
import GoCheatsheetPage from './pages/GoCheatsheetPage'
import RustCheatsheetPage from './pages/RustCheatsheetPage'
import JavaCheatsheetPage from './pages/JavaCheatsheetPage'
import SqliteCheatsheetPage from './pages/SqliteCheatsheetPage'
import FfmpegCheatsheetPage from './pages/FfmpegCheatsheetPage'
import CsharpCheatsheetPage from './pages/CsharpCheatsheetPage'
import PhpCheatsheetPage from './pages/PhpCheatsheetPage'
import KotlinCheatsheetPage from './pages/KotlinCheatsheetPage'
import TcpdumpCheatsheetPage from './pages/TcpdumpCheatsheetPage'
import GitHooksGeneratorPage from './pages/GitHooksGeneratorPage'
import BusinessDaysCalculatorPage from './pages/BusinessDaysCalculatorPage'
import CertificateDecoderPage from './pages/CertificateDecoderPage'
import MongoDbCheatsheetPage from './pages/MongoDbCheatsheetPage'
import PrometheusCheatsheetPage from './pages/PrometheusCheatsheetPage'
import KafkaCheatsheetPage from './pages/KafkaCheatsheetPage'
import ElasticsearchCheatsheetPage from './pages/ElasticsearchCheatsheetPage'
import CppCheatsheetPage from './pages/CppCheatsheetPage'
import GraphqlCheatsheetPage from './pages/GraphqlCheatsheetPage'
import RubyCheatsheetPage from './pages/RubyCheatsheetPage'
import AnsibleCheatsheetPage from './pages/AnsibleCheatsheetPage'
import Iso8601DurationPage from './pages/Iso8601DurationPage'
import GeohashToolPage from './pages/GeohashToolPage'
import MysqlCheatsheetPage from './pages/MysqlCheatsheetPage'
import EmailHeaderAnalyzerPage from './pages/EmailHeaderAnalyzerPage'
import AsciiBannerGeneratorPage from './pages/AsciiBannerGeneratorPage'
import DjangoCheatsheetPage from './pages/DjangoCheatsheetPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'bastidores', element: <BastidoresPage /> },
      { path: 'tools/jwt-decoder', element: <JwtDecoderPage /> },
      { path: 'tools/cron-parser', element: <CronParserPage /> },
      { path: 'tools/hash-generator', element: <HashGeneratorPage /> },
      { path: 'tools/json-formatter', element: <JsonFormatterPage /> },
      { path: 'tools/color-converter', element: <ColorConverterPage /> },
      { path: 'tools/timestamp-converter', element: <TimestampConverterPage /> },
      { path: 'styles/glass-card', element: <GlassCardShowcasePage /> },
      { path: 'styles/copy-button', element: <CopyButtonShowcasePage /> },
      { path: 'styles/skeleton-shimmer', element: <SkeletonShimmerPage /> },
      { path: 'styles/spotlight-card', element: <SpotlightCardShowcasePage /> },
      { path: 'styles/gradient-border-button', element: <GradientBorderButtonPage /> },
      { path: 'snippets/use-debounce', element: <UseDebounceSnippetPage /> },
      { path: 'snippets/use-local-storage', element: <UseLocalStorageSnippetPage /> },
      { path: 'snippets/use-session-storage', element: <UseSessionStorageSnippetPage /> },
      { path: 'snippets/use-click-outside', element: <UseClickOutsideSnippetPage /> },
      { path: 'snippets/use-media-query', element: <UseMediaQuerySnippetPage /> },
      { path: 'frontend/contrast-checker', element: <ContrastCheckerPage /> },
      { path: 'apis/curl-generator', element: <CurlGeneratorPage /> },
      { path: 'apis/curl-to-code', element: <CurlToCodePage /> },
      { path: 'apis/graphql-formatter', element: <GraphqlFormatterPage /> },
      { path: 'apis/openapi-spec-generator', element: <OpenapiSpecGeneratorPage /> },
      { path: 'devops/gitignore-generator', element: <GitignoreGeneratorPage /> },
      { path: 'database/rate-limit-calculator', element: <RateLimitCalculatorPage /> },
      { path: 'cloud/arn-parser', element: <ArnParserPage /> },
      { path: 'cloud/cost-estimator', element: <CloudCostEstimatorPage /> },
      { path: 'cloud/iam-policy-generator', element: <IamPolicyGeneratorPage /> },
      { path: 'security/password-strength', element: <PasswordStrengthPage /> },
      { path: 'data/json-tree-viewer', element: <JsonTreeViewerPage /> },
      { path: 'network/subnet-calculator', element: <SubnetCalculatorPage /> },
      { path: 'ai/anthropic-cost-calculator', element: <AnthropicCostCalculatorPage /> },
      { path: 'ai/llm-prompt-builder', element: <LlmPromptBuilderPage /> },
      { path: 'mobile/deep-link-tester', element: <DeepLinkTesterPage /> },
      { path: 'text/word-counter', element: <WordCounterPage /> },
      { path: 'references/git-commands', element: <GitCommandsPage /> },
      { path: 'extras/days-until', element: <DaysUntilPage /> },
      { path: 'tools/date-time-calculator', element: <DateTimeCalculatorPage /> },
      { path: 'tools/regex-tester', element: <RegexTesterPage /> },
      { path: 'tools/regex-pattern-generator', element: <RegexPatternGeneratorPage /> },
      { path: 'tools/keyboard-event-tester', element: <KeyboardEventTesterPage /> },
      { path: 'tools/base64-tool', element: <Base64ToolPage /> },
      { path: 'tools/base32-tool', element: <Base32ToolPage /> },
      { path: 'tools/base58-tool', element: <Base58ToolPage /> },
      { path: 'tools/uuid-generator', element: <UuidGeneratorPage /> },
      { path: 'tools/uuid-v7-generator', element: <UuidV7GeneratorPage /> },
      { path: 'tools/ulid-tool', element: <UlidToolPage /> },
      { path: 'tools/case-converter', element: <CaseConverterPage /> },
      { path: 'tools/password-generator', element: <PasswordGeneratorPage /> },
      { path: 'tools/url-encoder', element: <UrlEncoderPage /> },
      { path: 'tools/url-parser', element: <UrlParserPage /> },
      { path: 'tools/utm-url-builder', element: <UtmUrlBuilderPage /> },
      { path: 'tools/email-signature-generator', element: <EmailSignatureGeneratorPage /> },
      { path: 'tools/config-converter', element: <ConfigConverterPage /> },
      { path: 'tools/network-latency-calculator', element: <NetworkLatencyCalculatorPage /> },
      { path: 'tools/availability-calculator', element: <AvailabilityCalculatorPage /> },
      { path: 'tools/littles-law-calculator', element: <LittlesLawCalculatorPage /> },
      { path: 'tools/concurrency-throughput-calculator', element: <ConcurrencyThroughputCalculatorPage /> },
      { path: 'tools/queueing-theory-calculator', element: <QueueingTheoryCalculatorPage /> },
      { path: 'tools/pert-calculator', element: <PertCalculatorPage /> },
      { path: 'tools/confidence-interval-calculator', element: <ConfidenceIntervalCalculatorPage /> },
      { path: 'tools/downtime-cost-calculator', element: <DowntimeCostCalculatorPage /> },
      { path: 'tools/brazilian-data-generator', element: <BrazilianDataGeneratorPage /> },
      { path: 'tools/xml-json-converter', element: <XmlJsonConverterPage /> },
      { path: 'frontend/gradient-generator', element: <GradientGeneratorPage /> },
      { path: 'snippets/use-copy-to-clipboard', element: <UseCopyToClipboardSnippetPage /> },
      { path: 'references/http-status-codes', element: <HttpStatusCodesPage /> },
      { path: 'tools/diff-checker', element: <DiffCheckerPage /> },
      { path: 'frontend/box-shadow-generator', element: <BoxShadowGeneratorPage /> },
      { path: 'data/csv-json-converter', element: <CsvJsonConverterPage /> },
      { path: 'snippets/use-interval', element: <UseIntervalSnippetPage /> },
      { path: 'snippets/use-timeout', element: <UseTimeoutSnippetPage /> },
      { path: 'snippets/use-countdown', element: <UseCountdownSnippetPage /> },
      { path: 'snippets/use-fetch', element: <UseFetchSnippetPage /> },
      { path: 'snippets/use-network-status', element: <UseNetworkStatusSnippetPage /> },
      { path: 'snippets/use-element-size', element: <UseElementSizeSnippetPage /> },
      { path: 'snippets/use-mouse-position', element: <UseMousePositionSnippetPage /> },
      { path: 'snippets/use-page-visibility', element: <UsePageVisibilitySnippetPage /> },
      { path: 'snippets/use-async', element: <UseAsyncSnippetPage /> },
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
      { path: 'tools/jwt-secret-generator', element: <JwtSecretGeneratorPage /> },
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
      { path: 'security/sri-hash-generator', element: <SriHashGeneratorPage /> },
      { path: 'security/security-txt-generator', element: <SecurityTxtGeneratorPage /> },
      { path: 'security/webhook-signature-validator', element: <WebhookSignatureValidatorPage /> },
      { path: 'security/asymmetric-key-generator', element: <AsymmetricKeyGeneratorPage /> },
      { path: 'security/symmetric-key-generator', element: <SymmetricKeyGeneratorPage /> },
      { path: 'security/aes-encrypt-decrypt', element: <AesEncryptDecryptPage /> },
      { path: 'security/hash-identifier', element: <HashIdentifierPage /> },
      { path: 'security/pkce-generator', element: <PkceGeneratorPage /> },
      { path: 'security/certificate-decoder', element: <CertificateDecoderPage /> },
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
      { path: 'devops/gitattributes-generator', element: <GitattributesGeneratorPage /> },
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
      { path: 'database/sql-isolation-levels', element: <SqlIsolationLevelsPage /> },
      { path: 'database/csv-to-sql', element: <CsvToSqlPage /> },
      { path: 'database/storage-estimator', element: <DatabaseStorageEstimatorPage /> },
      { path: 'network/common-ports', element: <CommonPortsPage /> },
      { path: 'network/ipv6-explorer', element: <Ipv6ExplorerPage /> },
      { path: 'network/mac-address-tool', element: <MacAddressToolPage /> },
      { path: 'network/cidr-overlap-aggregator', element: <CidrOverlapAggregatorPage /> },
      { path: 'network/websocket-tester', element: <WebsocketTesterPage /> },
      { path: 'network/har-viewer', element: <HarViewerPage /> },
      { path: 'network/http-cache-analyzer', element: <HttpCacheAnalyzerPage /> },
      { path: 'network/dns-record-generator', element: <DnsRecordGeneratorPage /> },
      { path: 'network/tcp-throughput-calculator', element: <TcpThroughputCalculatorPage /> },
      { path: 'network/shannon-capacity-calculator', element: <ShannonCapacityCalculatorPage /> },
      { path: 'tools/iban-tool', element: <IbanToolPage /> },
      { path: 'tools/roman-numeral-converter', element: <RomanNumeralConverterPage /> },
      { path: 'tools/file-size-converter', element: <FileSizeConverterPage /> },
      { path: 'tools/file-hash-calculator', element: <FileHashCalculatorPage /> },
      { path: 'tools/geo-coordinates-converter', element: <GeoCoordinatesConverterPage /> },
      { path: 'tools/geohash-tool', element: <GeohashToolPage /> },
      { path: 'tools/haversine-distance-calculator', element: <HaversineDistanceCalculatorPage /> },
      { path: 'tools/iso-8601-duration', element: <Iso8601DurationPage /> },
      { path: 'tools/levenshtein-calculator', element: <LevenshteinCalculatorPage /> },
      { path: 'tools/bandwidth-calculator', element: <BandwidthCalculatorPage /> },
      { path: 'tools/cookie-tool', element: <CookieToolPage /> },
      { path: 'tools/compound-interest-calculator', element: <CompoundInterestCalculatorPage /> },
      { path: 'tools/percentage-calculator', element: <PercentageCalculatorPage /> },
      { path: 'tools/ab-test-calculator', element: <AbTestCalculatorPage /> },
      { path: 'tools/reading-time-calculator', element: <ReadingTimeCalculatorPage /> },
      { path: 'tools/readability-calculator', element: <ReadabilityCalculatorPage /> },
      { path: 'tools/linear-regression-calculator', element: <LinearRegressionCalculatorPage /> },
      { path: 'tools/npv-irr-roi-calculator', element: <NpvIrrRoiCalculatorPage /> },
      { path: 'tools/saas-unit-economics-calculator', element: <SaasUnitEconomicsCalculatorPage /> },
      { path: 'tools/software-bug-cost-calculator', element: <SoftwareBugCostCalculatorPage /> },
      { path: 'tools/test-automation-roi-calculator', element: <TestAutomationRoiCalculatorPage /> },
      { path: 'tools/latency-budget-calculator', element: <LatencyBudgetCalculatorPage /> },
      { path: 'tools/cache-hit-ratio-calculator', element: <CacheHitRatioCalculatorPage /> },
      { path: 'tools/log-storage-cost-calculator', element: <LogStorageCostCalculatorPage /> },
      { path: 'tools/web-vitals-budget-calculator', element: <WebVitalsBudgetCalculatorPage /> },
      { path: 'tools/connection-string-parser', element: <ConnectionStringParserPage /> },
      { path: 'references/sql-joins', element: <SqlJoinsPage /> },
      { path: 'references/big-o-cheatsheet', element: <BigOCheatsheetPage /> },
      { path: 'tools/json-to-zod-schema', element: <JsonToZodSchemaPage /> },
      { path: 'tools/loan-amortization-calculator', element: <LoanAmortizationCalculatorPage /> },
      { path: 'tools/bash-to-powershell', element: <BashToPowershellPage /> },
      { path: 'tools/retry-calculator', element: <RetryCalculatorPage /> },
      { path: 'tools/load-balancer-simulator', element: <LoadBalancerSimulatorPage /> },
      { path: 'tools/consistent-hashing-simulator', element: <ConsistentHashingSimulatorPage /> },
      { path: 'tools/bloom-filter-simulator', element: <BloomFilterSimulatorPage /> },
      { path: 'tools/cpu-scheduling-simulator', element: <CpuSchedulingSimulatorPage /> },
      { path: 'tools/disk-scheduling-simulator', element: <DiskSchedulingSimulatorPage /> },
      { path: 'tools/gossip-protocol-simulator', element: <GossipProtocolSimulatorPage /> },
      { path: 'tools/page-replacement-simulator', element: <PageReplacementSimulatorPage /> },
      { path: 'tools/cache-simulator', element: <CacheSimulatorPage /> },
      { path: 'tools/deadlock-simulator', element: <DeadlockSimulatorPage /> },
      { path: 'tools/sre-burn-rate-calculator', element: <SreBurnRateCalculatorPage /> },
      { path: 'tools/amdahls-law-calculator', element: <AmdahlsLawCalculatorPage /> },
      { path: 'tools/unicode-normalizer', element: <UnicodeNormalizerPage /> },
      { path: 'tools/aws-sigv4-signature-generator', element: <AwsSigv4SignatureGeneratorPage /> },
      { path: 'tools/merkle-tree-simulator', element: <MerkleTreeSimulatorPage /> },
      { path: 'tools/quorum-nwr-simulator', element: <QuorumNwrSimulatorPage /> },
      { path: 'tools/descriptive-statistics-calculator', element: <DescriptiveStatisticsCalculatorPage /> },
      { path: 'tools/bmi-calculator', element: <BmiCalculatorPage /> },
      { path: 'tools/logical-clocks-simulator', element: <LogicalClocksSimulatorPage /> },
      { path: 'tools/mapreduce-simulator', element: <MapreduceSimulatorPage /> },
      { path: 'tools/circuit-breaker-simulator', element: <CircuitBreakerSimulatorPage /> },
      { path: 'tools/rate-limiter-simulator', element: <RateLimiterSimulatorPage /> },
      { path: 'tools/two-phase-commit-simulator', element: <TwoPhaseCommitSimulatorPage /> },
      { path: 'tools/three-phase-commit-simulator', element: <ThreePhaseCommitSimulatorPage /> },
      { path: 'tools/raid-simulator', element: <RaidSimulatorPage /> },
      { path: 'tools/blockchain-simulator', element: <BlockchainSimulatorPage /> },
      { path: 'tools/huffman-coding-simulator', element: <HuffmanCodingSimulatorPage /> },
      { path: 'tools/sequence-diagram-generator', element: <SequenceDiagramGeneratorPage /> },
      { path: 'tools/sql-in-list-generator', element: <SqlInListGeneratorPage /> },
      { path: 'tools/dining-philosophers-simulator', element: <DiningPhilosophersSimulatorPage /> },
      { path: 'tools/truth-table-generator', element: <TruthTableGeneratorPage /> },
      { path: 'tools/string-escape', element: <StringEscapePage /> },
      { path: 'tools/caesar-cipher', element: <CaesarCipherPage /> },
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
      { path: 'devops/docker-run-to-compose', element: <DockerRunToComposePage /> },
      { path: 'devops/openssl-commands', element: <OpensslCommandsPage /> },
      { path: 'devops/nginx-config-generator', element: <NginxConfigGeneratorPage /> },
      { path: 'devops/ssh-config-generator', element: <SshConfigGeneratorPage /> },
      { path: 'devops/disk-performance-calculator', element: <DiskPerformanceCalculatorPage /> },
      { path: 'devops/systemd-unit-generator', element: <SystemdUnitGeneratorPage /> },
      { path: 'devops/shields-badge-generator', element: <ShieldsBadgeGeneratorPage /> },
      { path: 'devops/kubernetes-manifest-generator', element: <KubernetesManifestGeneratorPage /> },
      { path: 'devops/opentelemetry-collector-config-generator', element: <OtelCollectorConfigGeneratorPage /> },
      { path: 'devops/gitlab-ci-config-generator', element: <GitlabCiConfigGeneratorPage /> },
      { path: 'devops/github-actions-workflow-generator', element: <GithubActionsWorkflowGeneratorPage /> },
      { path: 'devops/ci-cd-cost-calculator', element: <CiCdCostCalculatorPage /> },
      { path: 'devops/git-hooks-generator', element: <GitHooksGeneratorPage /> },
      { path: 'tools/business-days-calculator', element: <BusinessDaysCalculatorPage /> },
      { path: 'devops/caddyfile-generator', element: <CaddyfileGeneratorPage /> },
      { path: 'devops/htaccess-generator', element: <HtaccessGeneratorPage /> },
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
      { path: 'tools/barcode-generator', element: <BarcodeGeneratorPage /> },
      { path: 'references/github-actions-cheatsheet', element: <GithubActionsCheatsheetPage /> },
      { path: 'frontend/css-to-js', element: <CssToJsPage /> },
      { path: 'references/nginx-cheatsheet', element: <NginxCheatsheetPage /> },
      { path: 'references/redis-commands', element: <RedisCheatsheetPage /> },
      { path: 'references/gh-cli-cheatsheet', element: <GhCliCheatsheetPage /> },
      { path: 'frontend/clamp-generator', element: <ClampGeneratorPage /> },
      { path: 'frontend/css-triangle-generator', element: <CssTriangleGeneratorPage /> },
      { path: 'frontend/font-face-generator', element: <FontFaceGeneratorPage /> },
      { path: 'frontend/font-stack-generator', element: <FontStackGeneratorPage /> },
      { path: 'references/typescript-cheatsheet', element: <TypescriptCheatsheetPage /> },
      { path: 'tools/morse-code-converter', element: <MorseConverterPage /> },
      { path: 'tools/glob-tester', element: <GlobTesterPage /> },
      { path: 'tools/data-uri-tool', element: <DataUriToolPage /> },
      { path: 'tools/directory-tree-generator', element: <DirectoryTreeGeneratorPage /> },
      { path: 'tools/payload-compression-calculator', element: <PayloadCompressionCalculatorPage /> },
      { path: 'tools/passphrase-generator', element: <PassphraseGeneratorPage /> },
      { path: 'tools/totp-generator', element: <TotpGeneratorPage /> },
      { path: 'references/html-cheatsheet', element: <HtmlCheatsheetPage /> },
      { path: 'references/react-cheatsheet', element: <ReactCheatsheetPage /> },
      { path: 'references/tailwind-cheatsheet', element: <TailwindCheatsheetPage /> },
      { path: 'references/css-selectors-cheatsheet', element: <CssSelectorsCheatsheetPage /> },
      { path: 'references/a11y-cheatsheet', element: <A11yCheatsheetPage /> },
      { path: 'references/jwt-claims-cheatsheet', element: <JwtClaimsCheatsheetPage /> },
      { path: 'references/oauth2-cheatsheet', element: <Oauth2CheatsheetPage /> },
      { path: 'references/design-patterns', element: <DesignPatternsCheatsheetPage /> },
      { path: 'frontend/grid-areas-generator', element: <GridAreasGeneratorPage /> },
      { path: 'frontend/pattern-background-generator', element: <PatternBackgroundGeneratorPage /> },
      { path: 'frontend/sitemap-generator', element: <SitemapGeneratorPage /> },
      { path: 'frontend/web-app-manifest', element: <WebAppManifestGeneratorPage /> },
      { path: 'devops/editorconfig-generator', element: <EditorconfigGeneratorPage /> },
      { path: 'devops/codeowners-generator', element: <CodeownersGeneratorPage /> },
      { path: 'devops/license-generator', element: <LicenseGeneratorPage /> },
      { path: 'devops/dockerignore-generator', element: <DockerignoreGeneratorPage /> },
      { path: 'devops/prettierrc-generator', element: <PrettierrcGeneratorPage /> },
      { path: 'devops/makefile-generator', element: <MakefileGeneratorPage /> },
      { path: 'devops/tsconfig-generator', element: <TsconfigGeneratorPage /> },
      { path: 'devops/eslint-config-generator', element: <EslintConfigGeneratorPage /> },
      { path: 'devops/renovate-config-generator', element: <RenovateConfigGeneratorPage /> },
      { path: 'devops/cors-config-generator', element: <CorsConfigGeneratorPage /> },
      { path: 'devops/pull-request-template-generator', element: <PullRequestTemplateGeneratorPage /> },
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
      { path: 'frontend/css-skeleton-generator', element: <CssSkeletonGeneratorPage /> },
      { path: 'frontend/css-timeline-generator', element: <CssTimelineGeneratorPage /> },
      { path: 'frontend/css-stepper-generator', element: <CssStepperGeneratorPage /> },
      { path: 'frontend/css-speech-bubble-generator', element: <CssSpeechBubbleGeneratorPage /> },
      { path: 'frontend/css-button-generator', element: <CssButtonGeneratorPage /> },
      { path: 'frontend/css-alert-generator', element: <CssAlertGeneratorPage /> },
      { path: 'frontend/css-avatar-generator', element: <CssAvatarGeneratorPage /> },
      { path: 'frontend/css-hamburger-menu-generator', element: <CssHamburgerMenuGeneratorPage /> },
      { path: 'frontend/css-corner-ribbon-generator', element: <CssCornerRibbonGeneratorPage /> },
      { path: 'frontend/css-pricing-table-generator', element: <CssPricingTableGeneratorPage /> },
      { path: 'frontend/css-image-hover-generator', element: <CssImageHoverGeneratorPage /> },
      { path: 'frontend/css-segmented-control-generator', element: <CssSegmentedControlGeneratorPage /> },
      { path: 'frontend/css-table-generator', element: <CssTableGeneratorPage /> },
      { path: 'frontend/css-cursor-generator', element: <CssCursorGeneratorPage /> },
      { path: 'frontend/css-flip-card-generator', element: <CssFlipCardGeneratorPage /> },
      { path: 'frontend/css-progress-ring-generator', element: <CssProgressRingGeneratorPage /> },
      { path: 'frontend/css-divider-generator', element: <CssDividerGeneratorPage /> },
      { path: 'frontend/svg-badge-generator', element: <SvgBadgeGeneratorPage /> },
      { path: 'frontend/svg-sprite-generator', element: <SvgSpriteGeneratorPage /> },
      { path: 'frontend/css-marquee-generator', element: <CssMarqueeGeneratorPage /> },
      { path: 'frontend/css-carousel-generator', element: <CssCarouselGeneratorPage /> },
      { path: 'frontend/css-login-form-generator', element: <CssLoginFormGeneratorPage /> },
      { path: 'frontend/css-neumorphism-generator', element: <CssNeumorphismGeneratorPage /> },
      { path: 'frontend/css-text-stroke-generator', element: <CssTextStrokeGeneratorPage /> },
      { path: 'frontend/css-line-clamp-generator', element: <CssLineClampGeneratorPage /> },
      { path: 'frontend/css-pulse-generator', element: <CssPulseGeneratorPage /> },
      { path: 'frontend/masonry-layout-generator', element: <MasonryLayoutGeneratorPage /> },
      { path: 'frontend/color-mix-generator', element: <ColorMixGeneratorPage /> },
      { path: 'frontend/blend-mode-generator', element: <BlendModeGeneratorPage /> },
      { path: 'frontend/html-boilerplate-generator', element: <HtmlBoilerplateGeneratorPage /> },
      { path: 'frontend/image-palette-extractor', element: <ImagePaletteExtractorPage /> },
      { path: 'frontend/image-diff-visualizer', element: <ImageDiffVisualizerPage /> },
      { path: 'frontend/css-animation-stagger-generator', element: <CssAnimationStaggerGeneratorPage /> },
      { path: 'frontend/css-at-property-generator', element: <CssAtPropertyGeneratorPage /> },
      { path: 'frontend/media-query-generator', element: <MediaQueryGeneratorPage /> },
      { path: 'frontend/css-supports-generator', element: <CssSupportsGeneratorPage /> },
      { path: 'frontend/css-layer-generator', element: <CssLayerGeneratorPage /> },
      { path: 'frontend/favicon-generator', element: <FaviconGeneratorPage /> },
      { path: 'frontend/css-has-selector-tester', element: <CssHasSelectorTesterPage /> },
      { path: 'frontend/typography-scale-calculator', element: <TypographyScaleCalculatorPage /> },
      { path: 'frontend/vite-config-generator', element: <ViteConfigGeneratorPage /> },
      { path: 'snippets/use-update-effect', element: <UseUpdateEffectSnippetPage /> },
      { path: 'snippets/use-why-did-you-update', element: <UseWhyDidYouUpdateSnippetPage /> },
      { path: 'snippets/use-boolean', element: <UseBooleanSnippetPage /> },
      { path: 'snippets/use-set', element: <UseSetSnippetPage /> },
      { path: 'snippets/use-counter', element: <UseCounterSnippetPage /> },
      { path: 'extras/typing-speed-test', element: <TypingSpeedTestPage /> },
      { path: 'extras/conways-game-of-life', element: <ConwaysGameOfLifePage /> },
      { path: 'extras/pathfinding-simulator', element: <PathfindingSimulatorPage /> },
      { path: 'tools/url-email-extractor', element: <UrlEmailExtractorPage /> },
      { path: 'snippets/use-lock-body-scroll', element: <UseLockBodyScrollSnippetPage /> },
      { path: 'snippets/use-stable-callback', element: <UseStableCallbackSnippetPage /> },
      { path: 'snippets/use-hover', element: <UseHoverSnippetPage /> },
      { path: 'snippets/use-merged-ref', element: <UseMergedRefSnippetPage /> },
      { path: 'snippets/use-queue', element: <UseQueueSnippetPage /> },
      { path: 'snippets/use-long-press', element: <UseLongPressSnippetPage /> },
      { path: 'snippets/use-form', element: <UseFormSnippetPage /> },
      { path: 'snippets/use-preferred-color-scheme', element: <UsePreferredColorSchemeSnippetPage /> },
      { path: 'snippets/use-favicon', element: <UseFaviconSnippetPage /> },
      { path: 'snippets/use-document-title', element: <UseDocumentTitleSnippetPage /> },
      { path: 'snippets/use-list', element: <UseListSnippetPage /> },
      { path: 'snippets/use-window-focus', element: <UseWindowFocusSnippetPage /> },
      { path: 'snippets/use-before-unload', element: <UseBeforeUnloadSnippetPage /> },
      { path: 'snippets/use-count-up', element: <UseCountUpSnippetPage /> },
      { path: 'snippets/use-script', element: <UseScriptSnippetPage /> },
      { path: 'snippets/use-battery', element: <UseBatterySnippetPage /> },
      { path: 'snippets/use-geolocation', element: <UseGeolocationSnippetPage /> },
      { path: 'snippets/use-map', element: <UseMapSnippetPage /> },
      { path: 'snippets/use-state-with-history', element: <UseStateWithHistorySnippetPage /> },
      { path: 'snippets/use-idle', element: <UseIdleSnippetPage /> },
      { path: 'snippets/use-mutation-observer', element: <UseMutationObserverSnippetPage /> },
      { path: 'snippets/use-resize-observer', element: <UseResizeObserverSnippetPage /> },
      { path: 'snippets/use-hotkeys', element: <UseHotkeysSnippetPage /> },
      { path: 'snippets/use-speech-synthesis', element: <UseSpeechSynthesisSnippetPage /> },
      { path: 'snippets/use-pagination', element: <UsePaginationSnippetPage /> },
      { path: 'snippets/use-controllable-state', element: <UseControllableStateSnippetPage /> },
      { path: 'references/aws-cli-cheatsheet', element: <AwsCliCheatsheetPage /> },
      { path: 'references/terraform-cheatsheet', element: <TerraformCheatsheetPage /> },
      { path: 'references/nodejs-cheatsheet', element: <NodejsCheatsheetPage /> },
      { path: 'references/postgresql-cheatsheet', element: <PostgresqlCheatsheetPage /> },
      { path: 'references/go-cheatsheet', element: <GoCheatsheetPage /> },
      { path: 'references/rust-cheatsheet', element: <RustCheatsheetPage /> },
      { path: 'references/java-cheatsheet', element: <JavaCheatsheetPage /> },
      { path: 'references/sqlite-cheatsheet', element: <SqliteCheatsheetPage /> },
      { path: 'references/ffmpeg-cheatsheet', element: <FfmpegCheatsheetPage /> },
      { path: 'references/csharp-cheatsheet', element: <CsharpCheatsheetPage /> },
      { path: 'references/php-cheatsheet', element: <PhpCheatsheetPage /> },
      { path: 'references/kotlin-cheatsheet', element: <KotlinCheatsheetPage /> },
      { path: 'references/tcpdump-cheatsheet', element: <TcpdumpCheatsheetPage /> },
      { path: 'references/mongodb-cheatsheet', element: <MongoDbCheatsheetPage /> },
      { path: 'references/prometheus-cheatsheet', element: <PrometheusCheatsheetPage /> },
      { path: 'references/kafka-cheatsheet', element: <KafkaCheatsheetPage /> },
      { path: 'references/elasticsearch-cheatsheet', element: <ElasticsearchCheatsheetPage /> },
      { path: 'references/cpp-cheatsheet', element: <CppCheatsheetPage /> },
      { path: 'references/graphql-cheatsheet', element: <GraphqlCheatsheetPage /> },
      { path: 'references/ruby-cheatsheet', element: <RubyCheatsheetPage /> },
      { path: 'references/ansible-cheatsheet', element: <AnsibleCheatsheetPage /> },
      { path: 'references/mysql-cheatsheet', element: <MysqlCheatsheetPage /> },
      { path: 'references/django-cheatsheet', element: <DjangoCheatsheetPage /> },
      { path: 'tools/email-header-analyzer', element: <EmailHeaderAnalyzerPage /> },
      { path: 'tools/ascii-banner-generator', element: <AsciiBannerGeneratorPage /> },
      { path: 'tools/bankers-algorithm-simulator', element: <BankersAlgorithmSimulatorPage /> },
      { path: 'tools/memory-allocation-simulator', element: <MemoryAllocationSimulatorPage /> },
      { path: 'tools/raft-simulator', element: <RaftSimulatorPage /> },
      { path: 'tools/paxos-simulator', element: <PaxosSimulatorPage /> },
      { path: 'tools/bully-algorithm-simulator', element: <BullyAlgorithmSimulatorPage /> },
      { path: 'tools/ring-election-simulator', element: <RingElectionSimulatorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
