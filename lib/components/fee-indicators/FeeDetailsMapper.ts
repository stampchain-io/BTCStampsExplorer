/* ===== FEE DETAILS MAPPER UTILITIES ===== */

import type {
  FeeDetailsMapperConfig,
  FeeEstimationPhase,
  MappedFeeDetails,
  PhaseResult,
} from "./types.ts";

/* ===== FEE DETAILS MAPPER CLASS ===== */

export class FeeDetailsMapper {
  private static instance: FeeDetailsMapper;

  private constructor() {}

  static getInstance(): FeeDetailsMapper {
    if (!FeeDetailsMapper.instance) {
      FeeDetailsMapper.instance = new FeeDetailsMapper();
    }
    return FeeDetailsMapper.instance;
  }

  /* ===== CORE MAPPING FUNCTIONS ===== */

  /**
   * Map progressive fee details to standardized format
   * Preserves existing implementations while providing optional enhancements
   */
  mapProgressiveFeeDetails(
    details: any,
    config: FeeDetailsMapperConfig = {},
  ): MappedFeeDetails | null {
    if (!details) return null;

    const {
      includePhaseInfo = false,
      normalizeUnits = false,
    } = config;

    // Base mapping (preserves existing structure)
    const mapped: MappedFeeDetails = {
      minerFee: this.ensureNumber(details.minerFee, 0),
      dustValue: this.ensureNumber(details.dustValue, 0),
      totalValue: this.ensureNumber(details.totalValue, 0),
      hasExactFees: Boolean(details.hasExactFees),
      estimatedSize: this.ensureNumber(details.estimatedSize, 300),
    };

    // Optional phase information
    if (includePhaseInfo && details.phase) {
      mapped.phase = details.phase as FeeEstimationPhase;
      mapped.phaseInfo = details.phaseInfo as PhaseResult;
    }

    // Optional unit normalization
    if (normalizeUnits) {
      mapped.formattedMinerFee = this.formatSatoshis(mapped.minerFee);
      mapped.formattedTotalValue = this.formatSatoshis(mapped.totalValue);
    }

    return mapped;
  }

  /**
   * Map fee details for different tool types
   * Handles tool-specific customizations while maintaining consistency
   */
  mapToolSpecificFeeDetails(
    details: any,
    toolType: string,
    config: FeeDetailsMapperConfig = {},
  ): MappedFeeDetails | null {
    const baseMapped = this.mapProgressiveFeeDetails(details, config);
    if (!baseMapped) return null;

    // Tool-specific enhancements
    switch (toolType) {
      case "stamp":
      case "stamping":
        return this.enhanceForStampTool(baseMapped, details);

      case "src20-mint":
      case "src20-deploy":
      case "src20-transfer":
        return this.enhanceForSRC20Tool(baseMapped, details);

      case "src101-create":
        return this.enhanceForSRC101Tool(baseMapped, details);

      case "trade":
        return this.enhanceForTradeTool(baseMapped, details);

      default:
        return baseMapped;
    }
  }

  /* ===== TOOL-SPECIFIC ENHANCEMENTS ===== */

  private enhanceForStampTool(
    mapped: MappedFeeDetails,
    _details: any,
  ): MappedFeeDetails {
    // Add stamp-specific enhancements
    return {
      ...mapped,
      // Preserve existing stamp tool behavior
    };
  }

  private enhanceForSRC20Tool(
    mapped: MappedFeeDetails,
    _details: any,
  ): MappedFeeDetails {
    // Add SRC-20 specific enhancements
    return {
      ...mapped,
      // Preserve existing SRC-20 tool behavior
    };
  }

  private enhanceForSRC101Tool(
    mapped: MappedFeeDetails,
    _details: any,
  ): MappedFeeDetails {
    // Add SRC-101 specific enhancements
    return {
      ...mapped,
      // Preserve existing SRC-101 tool behavior
    };
  }

  private enhanceForTradeTool(
    mapped: MappedFeeDetails,
    _details: any,
  ): MappedFeeDetails {
    // Add trade-specific enhancements
    return {
      ...mapped,
      // Preserve existing trade tool behavior
    };
  }

  /* ===== UTILITY FUNCTIONS ===== */

  private ensureNumber(value: any, fallback: number): number {
    if (typeof value === "number" && !isNaN(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }

  private formatSatoshis(satoshis: number): string {
    if (satoshis >= 100000000) {
      return `${(satoshis / 100000000).toFixed(8)} BTC`;
    }
    return `${satoshis} sats`;
  }

  /* ===== BACKWARDS COMPATIBILITY HELPERS ===== */

  /**
   * Create fallback fee details object
   * Matches existing implementations' fallback behavior
   */
  createFallbackFeeDetails(): MappedFeeDetails {
    return {
      minerFee: 0,
      dustValue: 0,
      totalValue: 0,
      hasExactFees: false,
      estimatedSize: 300,
    };
  }

  /**
   * Validate fee details structure
   * Ensures compatibility with existing tool expectations
   */
  validateFeeDetails(details: any): boolean {
    if (!details || typeof details !== "object") {
      return false;
    }

    const requiredFields = [
      "minerFee",
      "dustValue",
      "totalValue",
      "hasExactFees",
      "estimatedSize",
    ];

    return requiredFields.every((field) => details.hasOwnProperty(field));
  }

  /**
   * Merge fee details with existing values
   * Preserves existing tool customizations
   */
  mergeFeeDetails(
    existing: Partial<MappedFeeDetails>,
    incoming: any,
    config: FeeDetailsMapperConfig = {},
  ): MappedFeeDetails {
    const mapped = this.mapProgressiveFeeDetails(incoming, config);
    const fallback = this.createFallbackFeeDetails();

    return {
      ...fallback,
      ...existing,
      ...(mapped || {}),
    };
  }
}

/* ===== SINGLETON EXPORT ===== */
export const feeDetailsMapper = FeeDetailsMapper.getInstance();
