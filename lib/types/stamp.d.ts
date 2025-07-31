/**
 * Bitcoin Stamps Protocol Type Definitions
 *
 * This module contains all type definitions related to Bitcoin Stamps protocol
 * including stamp data structures, classification types, validation interfaces,
 * and protocol compliance types.
 *
 * @version Bitcoin Stamps Protocol v2.0+
 * @reference https://github.com/mikeinspace/stamps/blob/main/spec.md
 */

import type { CacheStatus, StampMarketData } from "./marketData.d.ts";
import type {
  SUBPROTOCOLS,
  TransactionInput,
  TransactionOutput,
  UTXO,
} from "./base.d.ts";
import type { PaginationProps } from "./pagination.d.ts";

// ============================================================================
// STAMP PROTOCOL ENUMS AND BASIC TYPES
// ============================================================================

/**
 * Bitcoin Stamps protocol subprotocol identifier
 * Maps to the ident field in stamp data
 */
export type STAMP_TYPES =
  | "all"
  | "stamps"
  | "cursed"
  | "classic"
  | "posh"
  | "src20"; // Note: for showing SRC-20 images, not actual SRC-20 details

/**
 * Stamp filter types for UI filtering and search
 */
export type STAMP_FILTER_TYPES =
  | "pixel"
  | "vector"
  | "for sale"
  | "trending sales"
  | "sold"
  | "recursive";

/**
 * File suffix filters for stamp content types
 */
export type STAMP_SUFFIX_FILTERS =
  | "gif"
  | "jpg"
  | "png"
  | "webp"
  | "bmp"
  | "jpeg"
  | "svg"
  | "html";

/**
 * Marketplace filter types for trading interfaces
 */
export type STAMP_MARKETPLACE =
  // Main market types
  | "listings"
  | "sales"
  // Market sub-options
  | "dispensers"
  | "atomics"
  // Listing price types
  | "all" // Default - show all listings
  | "bargain" // <0.0025 BTC
  | "affordable" // 0.005-0.01 BTC
  | "premium" // >0.1 BTC
  // Sales types
  | "recent"
  | "volume" // Maps to volume_24h_btc, volume_7d_btc, volume_30d_btc database fields
  // Shared options
  | "custom" // Custom price range
  // Unused filter types
  | "psbt"; // aka "utxo bound"

/**
 * File type classifications for stamp content
 * Maps to StampTableV4.stamp_mimetype database field
 */
export type STAMP_FILETYPES =
  | "jpg" // Maps to 'image/jpeg'
  | "jpeg" // Grouped with jpg
  | "png" // Maps to 'image/png'
  | "gif" // Maps to 'image/gif'
  | "webp" // Maps to 'image/webp'
  | "avif" // Maps to 'image/avif'
  | "bmp" // Maps to 'image/bmp'
  | "svg" // Maps to 'image/svg+xml'
  | "html" // Maps to 'text/html'
  | "txt" // Maps to 'text/plain' - Unused in UI
  | "mp3" // Maps to 'audio/mpeg'
  | "mpeg" // Grouped with mp3
  | "legacy" // Maps to block_index < 833000
  | "olga"; // Maps to block_index >= 833000

/**
 * Stamp edition types based on supply and lock status
 * Maps to StampTableV4 database fields
 */
export type STAMP_EDITIONS =
  | "single" // Maps to supply = 1
  | "multiple" // Maps to supply > 1
  | "locked" // Maps to locked = 1
  | "unlocked" // Maps to locked = 0
  | "divisible"; // Maps to divisible = 1

/**
 * Stamp number range filters
 */
export type STAMP_RANGES =
  | "100" // stamp < 100
  | "1000" // stamp < 1000
  | "5000" // stamp < 5000
  | "10000" // stamp < 10000
  | "custom"; // User-defined range

/**
 * File size range filters for stamp content
 */
export type STAMP_FILESIZES =
  | "<1kb" // < 1,024 bytes
  | "1kb-7kb" // 1,024 - 7,168 bytes
  | "7kb-32kb" // 7,168 - 32,768 bytes
  | "32kb-64kb" // 32,768 - 65,536 bytes
  | "custom"; // User-defined range

// ============================================================================
// STAMP CLASSIFICATION AND VALIDATION TYPES
// ============================================================================

/**
 * Stamp classification types based on Bitcoin Stamps protocol
 * These represent the different categories of stamps according to protocol rules
 */
export enum StampClassification {
  /** Blessed stamps - follow all protocol rules and are indexed properly */
  BLESSED = "blessed",
  /** Cursed stamps - violate protocol rules but are still valid Bitcoin transactions */
  CURSED = "cursed",
  /** Classic stamps - early stamps before certain protocol updates */
  CLASSIC = "classic",
  /** Posh stamps - premium or high-quality stamps */
  POSH = "posh",
}

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use StampClassification enum instead
 */
export type CursedTypes = StampClassification;

/**
 * Stamp validation status enumeration
 * Represents the validation state of a stamp according to protocol rules
 */
export enum StampValidationStatus {
  /** Stamp is valid according to all protocol rules */
  VALID = "valid",
  /** Stamp is invalid but still recorded on blockchain */
  INVALID = "invalid",
  /** Stamp validation is pending or incomplete */
  PENDING = "pending",
  /** Stamp validation failed due to technical issues */
  ERROR = "error",
}

/**
 * Stamp rarity classification based on various factors
 */
export enum StampRarity {
  /** Common stamps with high supply or frequency */
  COMMON = "common",
  /** Uncommon stamps with moderate scarcity */
  UNCOMMON = "uncommon",
  /** Rare stamps with low supply or unique properties */
  RARE = "rare",
  /** Epic stamps with very low supply or special significance */
  EPIC = "epic",
  /** Legendary stamps with extreme rarity or historical importance */
  LEGENDARY = "legendary",
}

/**
 * Stamp status enumeration for tracking lifecycle
 */
export enum StampStatus {
  /** Stamp is being created/minted */
  CREATING = "creating",
  /** Stamp creation is pending confirmation */
  PENDING = "pending",
  /** Stamp is confirmed and active */
  CONFIRMED = "confirmed",
  /** Stamp has been transferred */
  TRANSFERRED = "transferred",
  /** Stamp is listed for sale */
  LISTED = "listed",
  /** Stamp has been sold */
  SOLD = "sold",
  /** Stamp is locked or frozen */
  LOCKED = "locked",
}

/**
 * Comprehensive stamp metadata interface
 * Contains all metadata associated with a stamp beyond core blockchain data
 */
export interface StampMetadata {
  // Classification
  classification: StampClassification;
  rarity?: StampRarity;
  status: StampStatus;
  validationStatus: StampValidationStatus;

  // Content metadata
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  collection?: string;

  // Technical metadata
  encoding: string;
  compressionRatio?: number;
  originalSize?: number;
  optimizedSize?: number;

  // Protocol metadata
  protocolVersion: string;
  indexingRules: string[];
  validationRules: string[];

  // Timestamps
  createdAt: Date;
  validatedAt?: Date;
  lastUpdated: Date;
}

/**
 * Stamp protocol compliance interface
 * Defines the compliance status of a stamp with various protocol rules
 */
export interface StampProtocolCompliance {
  // Core protocol compliance
  isValidBase64: boolean;
  followsSizeRules: boolean;
  hasValidMimetype: boolean;
  usesCorrectPrefix: boolean;

  // Indexing compliance
  isProperlyIndexed: boolean;
  hasCorrectTimestamp: boolean;
  hasValidTransaction: boolean;

  // Classification compliance
  meetsClassificationRules: boolean;
  classificationReason?: string;

  // Overall compliance score (0-100)
  complianceScore: number;

  // Detailed compliance report
  complianceDetails: {
    rule: string;
    passed: boolean;
    message?: string;
  }[];
}

/**
 * Stamp validation result interface
 * Contains the result of validating a stamp against protocol rules
 */
export interface StampValidationResult {
  // Validation outcome
  isValid: boolean;
  status: StampValidationStatus;

  // Validation details
  validatedAt: Date;
  validatedBy?: string; // Validator identifier

  // Compliance information
  compliance: StampProtocolCompliance;

  // Validation errors and warnings
  errors: StampValidationError[];
  warnings: StampValidationWarning[];

  // Performance metrics
  validationTime: number; // milliseconds

  // Additional context
  context?: {
    blockHeight: number;
    networkFees: number;
    protocolVersion: string;
  };
}

/**
 * Stamp validation error interface
 */
export interface StampValidationError {
  code: string;
  message: string;
  severity: "critical" | "major" | "minor";
  field?: string;
  expectedValue?: any;
  actualValue?: any;
  suggestion?: string;
}

/**
 * Stamp validation warning interface
 */
export interface StampValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
  canIgnore: boolean;
}

/**
 * Stamp size validation interface
 * Validates stamp content size according to protocol rules
 */
export interface StampSizeValidation {
  // Size limits
  maxSizeBytes: number;
  actualSizeBytes: number;
  isWithinLimit: boolean;

  // Compression analysis
  originalSize?: number;
  compressionRatio?: number;
  suggestedOptimizations?: string[];

  // Size category
  sizeCategory: STAMP_FILESIZES;
}

/**
 * Stamp content validation interface
 * Validates stamp content format and encoding
 */
export interface StampContentValidation {
  // Format validation
  isValidFormat: boolean;
  detectedMimeType: string;
  expectedMimeType: string;

  // Encoding validation
  isValidBase64: boolean;
  encodingErrors?: string[];

  // Content analysis
  hasValidHeaders: boolean;
  isCorrupted: boolean;
  contentHash: string;

  // Security checks
  hasVulnerabilities: boolean;
  securityIssues?: string[];
}

/**
 * Extended stamp interface with validation data
 * Combines core stamp data with validation results
 */
export interface ValidatedStamp extends StampRow {
  // Validation results
  validation: StampValidationResult;

  // Enhanced metadata
  metadata: StampMetadata;

  // Size and content validation
  sizeValidation: StampSizeValidation;
  contentValidation: StampContentValidation;

  // Classification details
  classificationDetails: {
    algorithm: string;
    confidence: number;
    factors: string[];
  };
}

/**
 * Stamp collection validation interface
 * For validating groups or collections of stamps
 */
export interface StampCollectionValidation {
  // Collection metadata
  collectionId: string;
  totalStamps: number;
  validStamps: number;
  invalidStamps: number;

  // Validation summary
  overallValid: boolean;
  validationPercentage: number;

  // Individual results
  stampValidations: Map<string, StampValidationResult>;

  // Collection-level issues
  collectionErrors: StampValidationError[];
  collectionWarnings: StampValidationWarning[];

  // Performance metrics
  totalValidationTime: number;
  averageValidationTime: number;
}

// ============================================================================
// BITCOIN TRANSACTION RELATIONSHIP TYPES
// ============================================================================

/**
 * Stamp transaction relationship interface
 * Defines the relationship between a stamp and its Bitcoin transaction
 */
export interface StampTransactionRelationship {
  // Core relationship data
  stampId: string;
  txHash: string;
  blockIndex: number;
  blockTime: Date;

  // Transaction position
  txIndex: number;
  outputIndex?: number; // For stamps embedded in specific outputs

  // Relationship type
  relationshipType: StampTransactionType;

  // Confirmation status
  confirmations: number;
  isConfirmed: boolean;

  // Fee information
  totalFees: number;
  feeRate: number; // satoshis per byte

  // Transaction size and weight
  transactionSize: number;
  transactionWeight?: number;
  virtualSize?: number;
}

/**
 * Types of stamp-transaction relationships
 */
export enum StampTransactionType {
  /** Stamp creation transaction */
  CREATION = "creation",
  /** Stamp transfer transaction */
  TRANSFER = "transfer",
  /** Stamp burn/destroy transaction */
  BURN = "burn",
  /** Stamp update/modification transaction */
  UPDATE = "update",
}

/**
 * Stamp UTXO reference interface
 * References specific UTXOs that contain stamp data
 */
export interface StampUTXOReference {
  // UTXO identification
  utxo: UTXO;

  // Stamp data embedded in this UTXO
  stampData: {
    base64Data: string;
    dataSize: number;
    encoding: string;
  };

  // Output script information
  scriptType: string;
  scriptData: string;

  // Spending status
  isSpent: boolean;
  spentInTx?: string;
  spentAtHeight?: number;
}

/**
 * Bitcoin transaction parsing context for stamps
 * Contains information needed to parse stamps from Bitcoin transactions
 */
export interface StampTransactionParsingContext {
  // Transaction data
  txHash: string;
  rawTransaction: string;
  blockHeight: number;
  blockTime: Date;

  // Parsing configuration
  protocolVersion: string;
  parsingRules: string[];

  // Input analysis
  inputs: StampTransactionInput[];

  // Output analysis
  outputs: StampTransactionOutput[];

  // Parsing results
  detectedStamps: StampParsingResult[];

  // Validation context
  validationContext: {
    networkFees: number;
    blockReward: number;
    difficultyTarget: number;
  };
}

/**
 * Stamp-specific transaction input interface
 * Extends base transaction input with stamp-specific data
 */
export interface StampTransactionInput extends TransactionInput {
  // Stamp-related data
  containsStampData: boolean;
  stampDataSize?: number;

  // Source information
  sourceAddress?: string;
  sourceStamp?: string; // If this input spends a stamp UTXO

  // Validation
  isValidStampInput: boolean;
  validationErrors?: string[];
}

/**
 * Stamp-specific transaction output interface
 * Extends base transaction output with stamp-specific data
 */
export interface StampTransactionOutput extends TransactionOutput {
  // Stamp-related data
  containsStampData: boolean;
  stampData?: {
    base64Content: string;
    mimeType: string;
    dataSize: number;
  };

  // Destination information
  destinationAddress?: string;

  // Validation
  isValidStampOutput: boolean;
  validationErrors?: string[];
}

/**
 * Result of parsing a transaction for stamp data
 */
export interface StampParsingResult {
  // Parsing outcome
  success: boolean;
  foundStamps: number;

  // Detected stamp data
  stamps: {
    stampNumber?: number;
    cpid: string;
    base64Data: string;
    mimeType: string;
    creator: string;
    locked: boolean;
    divisible: boolean;
    supply: number;
  }[];

  // Parsing errors and warnings
  errors: string[];
  warnings: string[];

  // Performance metrics
  parsingTime: number; // milliseconds

  // Additional context
  parserVersion: string;
  parsingRules: string[];
}

/**
 * Stamp blockchain confirmation tracking
 * Tracks confirmation status and block position of stamps
 */
export interface StampConfirmationTracker {
  // Confirmation data
  txHash: string;
  blockHash: string;
  blockHeight: number;
  blockPosition: number;

  // Confirmation counts
  confirmations: number;
  requiredConfirmations: number;
  isFullyConfirmed: boolean;

  // Timestamps
  firstSeenAt: Date;
  confirmedAt?: Date;

  // Network status
  networkHeight: number;
  isReorgRisk: boolean;

  // Confirmation events
  confirmationEvents: {
    timestamp: Date;
    confirmationCount: number;
    blockHash: string;
    eventType: "confirmed" | "reorg" | "deep_reorg";
  }[];
}

/**
 * Stamp transaction fee analysis
 * Analyzes fee structure and optimization for stamp transactions
 */
export interface StampTransactionFeeAnalysis {
  // Fee breakdown
  totalFees: number;
  baseFee: number;
  stampDataFee: number; // Additional fees for stamp data
  priorityFee?: number;

  // Fee rates
  feeRate: number; // satoshis per byte
  effectiveFeeRate: number; // considering stamp data weight

  // Size analysis
  baseTransactionSize: number;
  stampDataSize: number;
  totalSize: number;

  // Fee optimization
  isOptimalFee: boolean;
  suggestedFeeRate?: number;
  potentialSavings?: number;

  // Market context
  networkFeeRate: number;
  feeRatePercentile: number; // Where this fee ranks in current mempool
}

// ============================================================================
// CORE STAMP DATA INTERFACES
// ============================================================================

/**
 * Core stamp data interface representing a Bitcoin stamp
 * This is the main data structure for stamps in the protocol
 *
 * @interface StampRow
 * @description Contains all essential stamp properties including blockchain data,
 * content information, and optional market data
 */
export interface StampRow {
  // Core stamp identification
  stamp: number | null;
  cpid: string;
  ident: SUBPROTOCOLS;

  // Blockchain data
  block_index: number;
  block_time: Date;
  tx_hash: string;
  tx_index: number;

  // Creator information
  creator: string;
  creator_name: string | null;

  // Stamp properties
  divisible: boolean;
  keyburn: number | null;
  locked: number;
  supply: number;

  // Content data
  stamp_base64: string;
  stamp_mimetype: string;
  stamp_url: string;
  stamp_hash: string;
  file_hash: string;
  file_size_bytes: number | null;

  // Market data (optional)
  floorPrice?: number | "priceless";
  marketCap?: number | "priceless";
  balance?: number | string;
  floorPriceUSD?: number | null;
  marketCapUSD?: number | null;
  recentSalePrice?: number | "priceless";
  unbound_quantity: number;

  // Sale information (optional)
  sale_data?: {
    btc_amount: number;
    block_index: number;
    tx_hash: string;
  };

  // Extended fields (optional)
  asset_longname?: string | null;
  message_index?: number | null;
  src_data?: any | null;
  is_btc_stamp?: number | null;
  is_reissue?: number | null;
  is_valid_base64?: number | null;
}

/**
 * Stamp balance information for wallet displays
 */
export interface StampBalance {
  cpid: string;
  stamp: number;
  stamp_base64: string;
  stamp_url: string;
  stamp_mimetype: string;
  tx_hash: string;
  divisible: 0 | 1;
  supply: number | string;
  locked: 0 | 1 | boolean;
  creator: string;
  creator_name: string | null;
  balance: number | string;
  // Market data pricing fields - added for backward compatibility
  floorPrice?: number | "priceless";
  recentSalePrice?: number | "priceless";
}

/**
 * Extended stamp interface that includes optional market data
 * Used when stamps are fetched with market data from the cache
 */
export interface StampWithOptionalMarketData {
  // All standard stamp fields would be inherited from StampRow
  stamp?: number | null;
  block_index: number;
  cpid: string;
  creator: string;
  divisible: number;
  keyburn?: number | null;
  locked: number;
  stamp_base64: string;
  stamp_mimetype: string;
  stamp_url: string;
  supply?: number | null;
  tx_hash: string;
  tx_index: number;
  ident: string;
  creator_name?: string | null;
  stamp_hash: string;
  file_hash: string;

  // Optional market data fields - contains all pricing/market information
  marketData?: StampMarketData | null;
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;
}

// ============================================================================
// STAMP FILTERING AND SEARCH INTERFACES
// ============================================================================

/**
 * Comprehensive stamp filtering interface
 * Used for filtering stamps in gallery views and API queries
 */
export interface StampFilters {
  // Market Place filters
  market: Extract<STAMP_MARKETPLACE, "listings" | "sales"> | "";
  dispensers: boolean;
  atomics: boolean;

  // Listings price range
  listings:
    | Extract<
      STAMP_MARKETPLACE,
      "all" | "bargain" | "affordable" | "premium" | "custom"
    >
    | "";
  listingsMin: string;
  listingsMax: string;

  // SALES options
  sales:
    | Extract<STAMP_MARKETPLACE, "recent" | "premium" | "custom" | "volume">
    | "";
  salesMin: string;
  salesMax: string;

  // Volume (for trending sales)
  volume: "24h" | "7d" | "30d" | "";
  volumeMin: string;
  volumeMax: string;

  // Other existing filters
  fileType: STAMP_FILETYPES[];
  fileSize: STAMP_FILESIZES | null;
  fileSizeMin: string;
  fileSizeMax: string;
  editions: STAMP_EDITIONS[];
  range: STAMP_RANGES | null;
  rangeMin: string;
  rangeMax: string;

  // Market Data Filters (Task 42)
  minHolderCount?: string;
  maxHolderCount?: string;
  minDistributionScore?: string;
  maxTopHolderPercentage?: string;
  minFloorPriceBTC?: string;
  maxFloorPriceBTC?: string;
  minVolume24h?: string;
  minPriceChange24h?: string;
  minDataQualityScore?: string;
  maxCacheAgeMinutes?: string;
  priceSource?: string;

  [key: string]: any; // Keep index signature for flexibility
}

// ============================================================================
// UI COMPONENT INTERFACES
// ============================================================================

/**
 * Display count breakpoints for responsive design
 */
export interface DisplayCountBreakpoints {
  "mobileSm": number; // 360px+
  "mobileMd"?: number; // 568
  "mobileLg": number; // 768px+
  "tablet": number; // 1024px+
  "desktop": number; // 1440px+
}

/**
 * Props interface for stamp gallery components
 */
export interface StampGalleryProps {
  title?: string;
  subTitle?: string;
  type?: string;
  stamps: StampRow[];
  layout: "grid" | "row";
  isRecentSales?: boolean;
  filterBy?: STAMP_FILTER_TYPES | STAMP_FILTER_TYPES[];
  showDetails?: boolean;
  showEdition?: boolean;
  gridClass?: string;
  displayCounts?: DisplayCountBreakpoints;
  pagination?: PaginationProps;
  showMinDetails?: boolean;
  variant?: "default" | "grey";
  viewAllLink?: string;
  alignRight?: boolean;
  fromPage?: string;
  sortBy?: "ASC" | "DESC" | undefined;
}

// ============================================================================
// STAMP OPERATION INTERFACES (Legacy)
// ============================================================================

/**
 * @deprecated Legacy interface for stamp transfers
 * Consider migrating to transaction.d.ts for transaction-specific operations
 */
export interface stampTransferData {
  sourceWallet: string;
  destinationWallet: string;
  assetName: string;
  qty: number;
  divisible: boolean;
  satsPerKB: number;
}

/**
 * @deprecated Legacy interface for stamp minting
 * Consider migrating to transaction.d.ts for transaction-specific operations
 */
export interface stampMintData {
  sourceWallet: string;
  destinationWallet?: string;
  assetName?: string;
  base64Data: string;
  qty: number;
  locked: boolean;
  divisible: boolean;
  satsPerKB: number;
  file?: unknown;
}

// ============================================================================
// API RESPONSE INTERFACES - MOVED TO api.d.ts
// ============================================================================

// NOTE: All API response interfaces have been moved to api.d.ts to eliminate duplication
// Import API response types from api.d.ts:
// - PaginatedStampResponseBody
// - PaginatedIdResponseBody
// - PaginatedStampBalanceResponseBody
//
// These types are now centralized in api.d.ts as the single source of truth

// NOTE: StampPageProps moved to api.d.ts to centralize page prop types
// Import from api.d.ts: StampPageProps

// ============================================================================
// STAMP NUMBER VALIDATION AND PROTOCOL TYPES
// ============================================================================

/**
 * Stamp number validation configuration
 * Defines validation rules for stamp numbering
 */
export interface StampNumberValidationConfig {
  // Numbering rules
  minStampNumber: number;
  maxStampNumber?: number;
  allowZero: boolean;
  requireSequential: boolean;

  // Validation strictness
  strictMode: boolean;
  allowGaps: boolean;

  // Protocol-specific rules
  protocolVersion: string;
  validationRules: StampNumberValidationRule[];
}

/**
 * Individual stamp number validation rule
 */
export interface StampNumberValidationRule {
  // Rule identification
  ruleId: string;
  ruleName: string;
  description: string;

  // Rule parameters
  minValue?: number;
  maxValue?: number;
  pattern?: string; // Regex pattern

  // Rule behavior
  isRequired: boolean;
  severity: "error" | "warning" | "info";

  // Custom validation function reference
  validatorFunction?: string;
}

/**
 * Stamp number validation result
 */
export interface StampNumberValidationResult {
  // Basic validation
  isValid: boolean;
  stampNumber: number;

  // Detailed results
  passedRules: string[];
  failedRules: string[];
  warnings: string[];

  // Context
  validatedAt: Date;
  protocolVersion: string;

  // Suggestions
  suggestedCorrections?: number[];
  nextAvailableNumber?: number;
}

/**
 * Protocol version enumeration
 * Tracks different versions of the Bitcoin Stamps protocol
 */
export enum StampProtocolVersion {
  /** Initial protocol version */
  V1_0 = "1.0",
  /** Enhanced validation rules */
  V1_1 = "1.1",
  /** Cursed stamps support */
  V2_0 = "2.0",
  /** Current version with full feature set */
  V2_1 = "2.1",
  /** Development/beta version */
  BETA = "beta",
}

/**
 * Protocol compliance levels
 */
export enum ProtocolComplianceLevel {
  /** Fully compliant with all protocol rules */
  FULL = "full",
  /** Mostly compliant with minor violations */
  PARTIAL = "partial",
  /** Significant violations but still functional */
  LIMITED = "limited",
  /** Major violations, may not function correctly */
  MINIMAL = "minimal",
  /** Non-compliant, protocol violations */
  NONE = "none",
}

/**
 * Comprehensive protocol compliance interface
 * Tracks compliance with Bitcoin Stamps protocol across all aspects
 */
export interface ComprehensiveProtocolCompliance {
  // Overall compliance
  overallLevel: ProtocolComplianceLevel;
  compliancePercentage: number; // 0-100

  // Version compatibility
  protocolVersion: StampProtocolVersion;
  isVersionCompatible: boolean;
  supportedVersions: StampProtocolVersion[];

  // Detailed compliance areas
  numberingCompliance: {
    level: ProtocolComplianceLevel;
    validStampNumbers: number;
    invalidStampNumbers: number;
    gapCount: number;
    duplicateCount: number;
  };

  contentCompliance: {
    level: ProtocolComplianceLevel;
    validContent: number;
    invalidContent: number;
    corruptedContent: number;
  };

  transactionCompliance: {
    level: ProtocolComplianceLevel;
    validTransactions: number;
    invalidTransactions: number;
    malformedTransactions: number;
  };

  // Compliance history
  lastAuditDate: Date;
  complianceHistory: {
    date: Date;
    level: ProtocolComplianceLevel;
    percentage: number;
    notes?: string;
  }[];
}

/**
 * Stamp indexing configuration
 * Defines how stamps should be indexed and organized
 */
export interface StampIndexingConfig {
  // Indexing strategy
  indexingStrategy: "sequential" | "hash-based" | "hybrid";

  // Index fields
  primaryKeys: string[];
  secondaryKeys: string[];

  // Search optimization
  enableFullTextSearch: boolean;
  searchFields: string[];

  // Performance settings
  batchSize: number;
  indexingInterval: number; // milliseconds

  // Storage optimization
  compressionEnabled: boolean;
  retentionPolicy: {
    maxAge: number; // days
    maxCount: number;
    archiveOld: boolean;
  };
}

/**
 * Search optimization types for stamp queries
 */
export interface StampSearchOptimization {
  // Query optimization
  useIndexes: boolean;
  cacheResults: boolean;
  cacheTTL: number; // seconds

  // Performance hints
  expectedResultSize: "small" | "medium" | "large";
  queryComplexity: "simple" | "moderate" | "complex";

  // Search parameters
  searchFields: string[];
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";

  // Pagination
  offset?: number;
  limit?: number;

  // Advanced features
  fuzzySearch?: boolean;
  relevanceScoring?: boolean;
  highlightMatches?: boolean;
}

/**
 * Stamp protocol creation rules
 * Defines rules for creating new stamps according to protocol
 */
export interface StampCreationRules {
  // Content rules
  maxContentSize: number; // bytes
  allowedMimeTypes: string[];
  requiredFields: string[];

  // Numbering rules
  numberingStrategy: "auto" | "manual" | "reserved";
  numberReservation?: {
    reservedRanges: { start: number; end: number }[];
    reservationExpiry: Date;
  };

  // Validation requirements
  requireValidation: boolean;
  validationTimeout: number; // seconds

  // Fee requirements
  minimumFee: number; // satoshis
  feeCalculationMethod: "fixed" | "size-based" | "dynamic";

  // Protocol compliance
  enforceCompliance: boolean;
  complianceLevel: ProtocolComplianceLevel;
}

// ============================================================================
// TYPE GUARDS AND VALIDATION UTILITIES
// ============================================================================

/**
 * Type guard to check if a value is a valid stamp number
 */
export declare function isValidStampNumber(value: unknown): value is number;

/**
 * Type guard to check if a value is a valid CPID
 */
export declare function isValidCPID(value: unknown): value is string;

/**
 * Type guard to check if a stamp has market data
 */
export declare function hasMarketData(stamp: StampRow): stamp is StampRow & {
  floorPrice: number | "priceless";
  marketCap: number | "priceless";
};

/**
 * Type guard to check if a value is a valid stamp classification
 */
export declare function isValidStampClassification(
  value: unknown,
): value is StampClassification;

/**
 * Type guard to check if a stamp is blessed (not cursed)
 */
export declare function isBlessed(
  stamp: { classification?: StampClassification },
): boolean;

/**
 * Type guard to check if a stamp is cursed
 */
export declare function isCursed(
  stamp: { classification?: StampClassification },
): boolean;

/**
 * Type guard to check if a stamp validation result indicates a valid stamp
 */
export declare function isValidStamp(
  result: StampValidationResult,
): result is StampValidationResult & {
  isValid: true;
  compliance: StampProtocolCompliance;
};

/**
 * Type guard to check if a protocol version is supported
 */
export declare function isSupportedProtocolVersion(
  version: string,
): version is StampProtocolVersion;

/**
 * Type guard to check if a compliance level meets minimum requirements
 */
export declare function meetsComplianceRequirements(
  compliance: ProtocolComplianceLevel,
  minimum?: ProtocolComplianceLevel,
): boolean;

/**
 * Type guard for stamp transaction relationships
 */
export declare function isValidStampTransaction(
  relationship: StampTransactionRelationship,
): relationship is StampTransactionRelationship & {
  isConfirmed: true;
  confirmations: number;
};
