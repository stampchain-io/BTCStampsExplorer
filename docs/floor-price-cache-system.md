# Multi-Source Market Data Cache System Implementation

## Overview

This document outlines the design and implementation strategy for a comprehensive pre-computed market data cache system to replace expensive real-time API calls that are causing performance issues. The system will cache **floor prices**, **holder counts**, and **multi-exchange data** using a unified background job infrastructure that supports multiple data sources including Counterparty API, external exchanges, and SRC-20 marketplaces.

## Multi-Source Data Architecture

The system is designed to aggregate data from multiple sources:

### **Stamp (Art) Data Sources**
- **Primary**: Counterparty API (dispensers, balances, sends)
- **Secondary**: External exchanges (future integration)
- **Tertiary**: NFT marketplaces (OpenSea, etc.)

### **SRC-20 Token Data Sources** 
- **Current**: OpenStamp API, StampScan API
- **Planned**: KuCoin API, additional CEX/DEX integrations
- **Future**: Cross-chain bridge data, DeFi protocols

## Current Problems

### Floor Price Performance Issues
- Collection pages make 40+ concurrent API calls to counterparty.io
- "dispatch task is gone: runtime dropped the dispatch task" errors
- Page load times of 10+ seconds
- Unreliable external API dependency
- BTC price fetching multiplies the performance impact

### Holder Count Performance Issues
- **NEW DISCOVERY**: Holder filtering would require fetching ALL holder data for EVERY stamp
- `XcpManager.getAllXcpHoldersByCpid()` makes multiple paginated API calls to `/assets/{cpid}/balances`
- Each call fetches up to 1000 records with cursor-based pagination
- For 1000+ stamps, this would create massive external API load
- Holder data aggregated in memory using Map to combine quantities by address
- No database storage of holder counts - all data retrieved on-demand

### Current Architecture Limitations
```typescript
// Current expensive approach for BOTH floor prices AND holder counts
for (const collection of collections) {
  for (const stamp of collection.stamps) {
    // Floor price calculation
    const dispensers = await DispenserManager.getDispensersByCpid(stamp.cpid); // API call
    const floorPrice = calculateFloorPrice(dispensers);
    const btcPrice = await fetchBTCPriceInUSD(); // Another API call
    
    // Holder count calculation (if filtering by holders)
    const { holders, total } = await XcpManager.getAllXcpHoldersByCpid(stamp.cpid); // Multiple API calls
    const holderCount = total; // Requires fetching ALL holder data
  }
}
```

## Proposed Solution: Unified Market Data Cache

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Indexer       │───▶│  Background Job  │───▶│  Cache Tables   │
│   (Real-time)   │    │  (Every 15-30m)  │    │  (Fast Queries) │
│                 │    │                  │    │                 │
│ • Dispenser     │    │ • Floor Prices   │    │ • Floor Prices  │
│   Events        │    │ • Holder Counts  │    │ • Holder Counts │
│ • Balance       │    │ • Volume Data    │    │ • Collection    │
│   Changes       │    │ • Collection     │    │   Aggregates    │
│                 │    │   Aggregates     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ Collection Pages│
                                               │ (Instant Load)  │
                                               │ • Floor Prices  │
                                               │ • Holder Counts │
                                               │ • Filter Ready  │
                                               └─────────────────┘
```

### Enhanced Database Schema

#### **Stamp Market Data Cache**
```sql
-- Enhanced stamp market data cache with multi-source support
CREATE TABLE stamp_market_data (
  cpid VARCHAR(255) PRIMARY KEY,
  
  -- Floor Price Data
  floor_price_btc DECIMAL(16,8) NULL,
  floor_price_usd DECIMAL(16,2) NULL,
  recent_sale_price_btc DECIMAL(16,8) NULL,
  recent_sale_price_usd DECIMAL(16,2) NULL,
  open_dispensers_count INTEGER DEFAULT 0,
  closed_dispensers_count INTEGER DEFAULT 0,
  total_dispensers_count INTEGER DEFAULT 0,
  
  -- NEW: Holder Data
  holder_count INTEGER DEFAULT 0,
  unique_holder_count INTEGER DEFAULT 0,
  top_holder_percentage DECIMAL(5,2) DEFAULT 0, -- % held by largest holder
  holder_distribution_score DECIMAL(5,2) DEFAULT 0, -- Distribution metric (0-100)
  
  -- Volume Data
  volume_24h_btc DECIMAL(16,8) DEFAULT 0,
  volume_7d_btc DECIMAL(16,8) DEFAULT 0,
  volume_30d_btc DECIMAL(16,8) DEFAULT 0,
  
  -- Multi-Source Attribution
  price_source VARCHAR(50) NULL, -- 'counterparty', 'exchange_a', 'opensea'
  volume_sources JSON NULL, -- {"counterparty": 0.5, "exchange_a": 1.2}
  data_quality_score DECIMAL(3,1) DEFAULT 0, -- 0-10 based on source reliability
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_dispenser_block INTEGER NULL,
  last_balance_block INTEGER NULL, -- NEW: Track balance updates
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_floor_price_btc (floor_price_btc),
  INDEX idx_holder_count (holder_count), -- NEW: For holder filtering
  INDEX idx_last_updated (last_updated),
  INDEX idx_volume_24h (volume_24h_btc),
  INDEX idx_holder_distribution (holder_distribution_score), -- NEW: For quality metrics
  INDEX idx_price_source (price_source), -- NEW: For source filtering
  INDEX idx_data_quality (data_quality_score) -- NEW: For quality filtering
);

#### **SRC-20 Token Market Data Cache**
```sql
-- NEW: SRC-20 token market data cache with multi-marketplace support
CREATE TABLE src20_market_data (
  tick VARCHAR(10) PRIMARY KEY,
  
  -- Aggregated Price Data
  floor_price_btc DECIMAL(16,8) NULL,
  floor_price_usd DECIMAL(16,2) NULL,
  best_bid_btc DECIMAL(16,8) NULL,
  best_ask_btc DECIMAL(16,8) NULL,
  
  -- Volume Data
  volume_24h_btc DECIMAL(16,8) DEFAULT 0,
  volume_7d_btc DECIMAL(16,8) DEFAULT 0,
  volume_30d_btc DECIMAL(16,8) DEFAULT 0,
  
  -- Market Metrics
  market_cap_btc DECIMAL(20,8) DEFAULT 0,
  market_cap_usd DECIMAL(20,2) DEFAULT 0,
  holder_count INTEGER DEFAULT 0,
  total_supply DECIMAL(20,8) DEFAULT 0,
  
  -- Price Changes
  price_change_24h DECIMAL(10,4) DEFAULT 0,
  price_change_7d DECIMAL(10,4) DEFAULT 0,
  
  -- Multi-Source Attribution
  price_source VARCHAR(50) NULL, -- 'openstamp', 'stampscan', 'kucoin'
  volume_sources JSON NULL, -- {"openstamp": 0.5, "kucoin": 1.2}
  data_quality_score DECIMAL(3,1) DEFAULT 0, -- 0-10 based on source reliability
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deploy_tx_hash VARCHAR(64) NULL, -- Reference to deploy transaction
  deploy_block INTEGER NULL,
  
  -- Indexes for filtering
  INDEX idx_floor_price_btc (floor_price_btc),
  INDEX idx_market_cap_btc (market_cap_btc),
  INDEX idx_volume_24h (volume_24h_btc),
  INDEX idx_holder_count (holder_count),
  INDEX idx_price_change_24h (price_change_24h),
  INDEX idx_price_source (price_source),
  INDEX idx_data_quality (data_quality_score)
);

-- Multi-source data tracking for transparency and debugging
CREATE TABLE market_data_sources (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  asset_type ENUM('stamp', 'src20') NOT NULL,
  asset_id VARCHAR(255) NOT NULL, -- cpid for stamps, tick for src20
  source VARCHAR(50) NOT NULL, -- 'counterparty', 'openstamp', 'kucoin', etc.
  
  -- Price Data
  price_btc DECIMAL(16,8) NULL,
  price_usd DECIMAL(16,2) NULL,
  
  -- Volume Data
  volume_24h_btc DECIMAL(16,8) DEFAULT 0,
  
  -- Additional Metrics
  holder_count INTEGER DEFAULT 0,
  market_cap_btc DECIMAL(20,8) DEFAULT 0,
  
  -- Source Metadata
  source_confidence DECIMAL(3,1) DEFAULT 5.0, -- 0-10 confidence score
  api_response_time_ms INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_asset_source (asset_type, asset_id, source),
  INDEX idx_asset (asset_type, asset_id),
  INDEX idx_source (source),
  INDEX idx_last_updated (last_updated),
  INDEX idx_confidence (source_confidence)
);

#### **Collection Market Data Cache**
-- Enhanced collection-level aggregated data
CREATE TABLE collection_market_data (
  collection_id VARCHAR(255) PRIMARY KEY,
  
  -- Floor Price Aggregates
  min_floor_price_btc DECIMAL(16,8) NULL,
  max_floor_price_btc DECIMAL(16,8) NULL,
  avg_floor_price_btc DECIMAL(16,8) NULL,
  median_floor_price_btc DECIMAL(16,8) NULL,
  total_volume_24h_btc DECIMAL(16,8) DEFAULT 0,
  stamps_with_prices_count INTEGER DEFAULT 0,
  
  -- NEW: Holder Aggregates
  min_holder_count INTEGER DEFAULT 0,
  max_holder_count INTEGER DEFAULT 0,
  avg_holder_count DECIMAL(8,2) DEFAULT 0,
  median_holder_count INTEGER DEFAULT 0,
  total_unique_holders INTEGER DEFAULT 0, -- Across all stamps in collection
  avg_distribution_score DECIMAL(5,2) DEFAULT 0,
  
  -- Collection Metadata
  total_stamps_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_min_floor_price (min_floor_price_btc),
  INDEX idx_total_volume (total_volume_24h_btc),
  INDEX idx_min_holder_count (min_holder_count), -- NEW
  INDEX idx_avg_holder_count (avg_holder_count)  -- NEW
);

-- NEW: Detailed holder cache for individual stamp holder pages
CREATE TABLE stamp_holder_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cpid VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL, -- % of total supply
  rank_position INTEGER NOT NULL, -- 1 = largest holder
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_cpid_address (cpid, address),
  INDEX idx_cpid_rank (cpid, rank_position),
  INDEX idx_cpid_quantity (cpid, quantity DESC),
  INDEX idx_address (address),
  INDEX idx_last_updated (last_updated)
);

-- Enhanced price history for trend analysis
CREATE TABLE stamp_price_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cpid VARCHAR(255) NOT NULL,
  price_btc DECIMAL(16,8) NOT NULL,
  price_usd DECIMAL(16,2) NOT NULL,
  price_type ENUM('floor', 'sale', 'dispense') NOT NULL,
  
  -- NEW: Holder data snapshots
  holder_count INTEGER NULL,
  holder_distribution_score DECIMAL(5,2) NULL,
  
  block_index INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_cpid_timestamp (cpid, timestamp),
  INDEX idx_price_type_timestamp (price_type, timestamp),
  INDEX idx_holder_count_timestamp (holder_count, timestamp) -- NEW
);
```

### Multi-Source Background Job Implementation

#### Enhanced Job Schedule
- **Frequency**: Every 15-30 minutes for primary sources
- **SRC-20 Frequency**: Every 5-10 minutes (higher volatility)
- **Exchange APIs**: Every 2-5 minutes (real-time pricing)
- **Trigger**: Cron job or scheduled task
- **Priority Processing**: High-activity assets updated more frequently
- **Fallback**: Manual trigger via admin endpoint

#### Multi-Source Data Aggregation Strategy

```typescript
class MultiSourceMarketDataService {
  // Stamp data aggregation from multiple sources
  async updateStampMarketData(cpid: string): Promise<void> {
    const sources = await Promise.allSettled([
      this.fetchCounterpartyData(cpid),
      this.fetchExchangeAData(cpid),
      this.fetchNFTMarketplaceData(cpid)
    ]);
    
    const validSources = sources
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    const aggregatedData = this.aggregateStampData(validSources);
    await this.updateStampCache(cpid, aggregatedData);
  }
  
  // SRC-20 data aggregation from multiple marketplaces
  async updateSRC20MarketData(tick: string): Promise<void> {
    const sources = await Promise.allSettled([
      this.fetchOpenStampData(tick),
      this.fetchStampScanData(tick),
      this.fetchKuCoinData(tick),
      this.fetchAdditionalExchangeData(tick)
    ]);
    
    const validSources = sources
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    const aggregatedData = this.aggregateSRC20Data(validSources);
    await this.updateSRC20Cache(tick, aggregatedData);
  }
  
  // Smart aggregation logic
  private aggregateStampData(sources: StampMarketSource[]): StampMarketData {
    return {
      // Use lowest price from reliable sources
      floor_price_btc: this.selectBestPrice(sources, 'floor'),
      // Sum volumes from all sources
      volume_24h_btc: sources.reduce((sum, s) => sum + s.volume_24h, 0),
      // Use most recent holder count from most reliable source
      holder_count: this.selectMostReliableValue(sources, 'holder_count'),
      // Track which source provided each data point
      price_source: this.identifyPriceSource(sources),
      volume_sources: this.mapVolumeSources(sources),
      data_quality_score: this.calculateQualityScore(sources)
    };
  }
  
  private aggregateSRC20Data(sources: SRC20MarketSource[]): SRC20MarketData {
    return {
      // Use lowest price for floor, highest for market cap calculation
      floor_price_btc: Math.min(...sources.map(s => s.price_btc).filter(p => p > 0)),
      // Aggregate volume from all marketplaces
      volume_24h_btc: sources.reduce((sum, s) => sum + s.volume_24h, 0),
      // Use most comprehensive holder data
      holder_count: Math.max(...sources.map(s => s.holder_count)),
      // Calculate market cap using best available data
      market_cap_btc: this.calculateMarketCap(sources),
      // Track price changes from most reliable source
      price_change_24h: this.selectMostReliableValue(sources, 'price_change_24h'),
      // Source attribution
      price_source: this.identifyPriceSource(sources),
      volume_sources: this.mapVolumeSources(sources),
      data_quality_score: this.calculateQualityScore(sources)
    };
  }
}

#### Enhanced Processing Strategy

```typescript
interface MarketDataUpdateJob {
  // 1. Batch Processing (Enhanced)
  processBatch(cpids: string[], batchSize: number = 50): Promise<void>;
  
  // 2. Incremental Updates (Enhanced)
  processIncrementalUpdates(sinceBlock: number): Promise<void>;
  
  // 3. Full Refresh (Enhanced)
  processFullRefresh(): Promise<void>;
  
  // 4. Collection Aggregation (Enhanced)
  updateCollectionAggregates(): Promise<void>;
  
  // NEW: Holder-specific methods
  updateHolderCounts(cpids: string[]): Promise<void>;
  updateHolderDetails(cpid: string): Promise<void>;
  calculateHolderDistribution(cpid: string): Promise<HolderDistributionMetrics>;
}

interface HolderDistributionMetrics {
  holderCount: number;
  uniqueHolderCount: number;
  topHolderPercentage: number;
  distributionScore: number; // 0-100, higher = more distributed
  giniCoefficient?: number; // Optional: wealth distribution metric
}
```

#### Implementation Phases

**Phase 1: Enhanced Floor Price Cache + Basic Holder Counts**
```typescript
class MarketDataCacheService {
  async updateStampMarketData(cpid: string): Promise<void> {
    try {
      // PARALLEL PROCESSING: Fetch both dispenser and holder data simultaneously
      const [dispenserData, holderData] = await Promise.all([
        this.fetchDispenserData(cpid),
        this.fetchHolderData(cpid)
      ]);
      
      // Calculate floor price metrics
      const floorPriceMetrics = this.calculateFloorPriceMetrics(dispenserData);
      
      // Calculate holder metrics
      const holderMetrics = this.calculateHolderMetrics(holderData);
      
      // Get current BTC price
      const btcPriceUSD = await fetchBTCPriceInUSD();
      
      // Update unified cache
      await this.updateMarketDataCache({
        cpid,
        
        // Floor price data
        floor_price_btc: floorPriceMetrics.floorPriceBTC,
        floor_price_usd: floorPriceMetrics.floorPriceBTC !== "priceless" 
          ? floorPriceMetrics.floorPriceBTC * btcPriceUSD : null,
        recent_sale_price_btc: floorPriceMetrics.recentSalePriceBTC,
        recent_sale_price_usd: floorPriceMetrics.recentSalePriceBTC !== "priceless" 
          ? floorPriceMetrics.recentSalePriceBTC * btcPriceUSD : null,
        open_dispensers_count: floorPriceMetrics.openDispensersCount,
        closed_dispensers_count: floorPriceMetrics.closedDispensersCount,
        total_dispensers_count: floorPriceMetrics.totalDispensersCount,
        
        // NEW: Holder data
        holder_count: holderMetrics.holderCount,
        unique_holder_count: holderMetrics.uniqueHolderCount,
        top_holder_percentage: holderMetrics.topHolderPercentage,
        holder_distribution_score: holderMetrics.distributionScore,
        
        last_updated: new Date()
      });
      
      // Update detailed holder cache if significant changes
      if (holderMetrics.hasSignificantChanges) {
        await this.updateDetailedHolderCache(cpid, holderData);
      }
      
    } catch (error) {
      logger.error('Failed to update market data for cpid', { cpid, error });
    }
  }
  
  private async fetchHolderData(cpid: string): Promise<HolderData> {
    // Use existing XcpManager.getAllXcpHoldersByCpid but cache the full result
    const { holders, total } = await XcpManager.getAllXcpHoldersByCpid(cpid);
    
    return {
      holders: holders.map((h, index) => ({
        address: h.address,
        quantity: h.quantity,
        rank: index + 1
      })),
      totalHolders: total,
      totalSupply: holders.reduce((sum, h) => sum + h.quantity, 0)
    };
  }
  
  private calculateHolderMetrics(holderData: HolderData): HolderMetrics {
    const { holders, totalHolders, totalSupply } = holderData;
    
    if (totalHolders === 0) {
      return {
        holderCount: 0,
        uniqueHolderCount: 0,
        topHolderPercentage: 0,
        distributionScore: 0,
        hasSignificantChanges: false
      };
    }
    
    // Calculate distribution metrics
    const topHolderPercentage = totalSupply > 0 
      ? (holders[0]?.quantity || 0) / totalSupply * 100 
      : 0;
    
    // Calculate distribution score (0-100, higher = more distributed)
    const distributionScore = this.calculateDistributionScore(holders, totalSupply);
    
    return {
      holderCount: totalHolders,
      uniqueHolderCount: totalHolders, // Same for now, could be enhanced
      topHolderPercentage,
      distributionScore,
      hasSignificantChanges: this.detectSignificantChanges(holders)
    };
  }
  
  private calculateDistributionScore(holders: HolderInfo[], totalSupply: number): number {
    if (holders.length === 0 || totalSupply === 0) return 0;
    
    // Simple distribution score based on:
    // 1. Number of holders (more = better)
    // 2. Top holder concentration (less = better)
    // 3. Distribution across top 10 holders
    
    const holderCountScore = Math.min(holders.length / 100, 1) * 40; // Max 40 points
    const topHolderScore = (1 - (holders[0]?.quantity || 0) / totalSupply) * 30; // Max 30 points
    
    // Top 10 distribution score
    const top10Supply = holders.slice(0, 10).reduce((sum, h) => sum + h.quantity, 0);
    const top10Score = (1 - top10Supply / totalSupply) * 30; // Max 30 points
    
    return Math.round(holderCountScore + topHolderScore + top10Score);
  }
}
```

**Phase 2: Enhanced Volume Tracking + Holder Details**
```typescript
async updateDetailedHolderCache(cpid: string, holderData: HolderData): Promise<void> {
  const { holders, totalSupply } = holderData;
  
  // Clear existing cache for this stamp
  await this.clearHolderCache(cpid);
  
  // Insert updated holder details
  const holderRecords = holders.map((holder, index) => ({
    cpid,
    address: holder.address,
    quantity: holder.quantity,
    percentage: totalSupply > 0 ? (holder.quantity / totalSupply) * 100 : 0,
    rank_position: index + 1,
    last_updated: new Date()
  }));
  
  await this.batchInsertHolderCache(holderRecords);
}

async calculateVolume(cpid: string, timeframe: '24h' | '7d' | '30d'): Promise<number> {
  const cutoffTime = this.getTimeframeCutoff(timeframe);
  const dispenses = await this.getDispensesSince(cpid, cutoffTime);
  
  return dispenses.reduce((total, dispense) => {
    return total + (dispense.btc_amount || 0);
  }, 0);
}
```

**Phase 3: Enhanced Collection Aggregation**
```typescript
async updateCollectionAggregates(collectionId: string): Promise<void> {
  const stamps = await this.getStampsByCollection(collectionId);
  const marketData = await this.getMarketDataForStamps(stamps.map(s => s.cpid));
  
  // Floor price aggregates
  const validPrices = marketData.filter(d => d.floor_price_btc !== null);
  const floorPrices = validPrices.map(d => d.floor_price_btc);
  
  // NEW: Holder count aggregates
  const validHolderCounts = marketData.filter(d => d.holder_count > 0);
  const holderCounts = validHolderCounts.map(d => d.holder_count);
  
  // Calculate unique holders across collection (requires detailed analysis)
  const totalUniqueHolders = await this.calculateCollectionUniqueHolders(
    stamps.map(s => s.cpid)
  );
  
  await this.updateCollectionCache({
    collection_id: collectionId,
    
    // Floor price aggregates
    min_floor_price_btc: floorPrices.length > 0 ? Math.min(...floorPrices) : null,
    max_floor_price_btc: floorPrices.length > 0 ? Math.max(...floorPrices) : null,
    avg_floor_price_btc: this.calculateAverage(floorPrices),
    median_floor_price_btc: this.calculateMedian(floorPrices),
    stamps_with_prices_count: validPrices.length,
    
    // NEW: Holder aggregates
    min_holder_count: holderCounts.length > 0 ? Math.min(...holderCounts) : 0,
    max_holder_count: holderCounts.length > 0 ? Math.max(...holderCounts) : 0,
    avg_holder_count: this.calculateAverage(holderCounts),
    median_holder_count: this.calculateMedian(holderCounts),
    total_unique_holders: totalUniqueHolders,
    avg_distribution_score: this.calculateAverage(
      marketData.map(d => d.holder_distribution_score)
    ),
    
    total_stamps_count: stamps.length
  });
}

private async calculateCollectionUniqueHolders(cpids: string[]): Promise<number> {
  // Get all holders across all stamps in collection
  const allHolders = await this.getHoldersByCpids(cpids);
  
  // Count unique addresses
  const uniqueAddresses = new Set(allHolders.map(h => h.address));
  
  return uniqueAddresses.size;
}
```

### Enhanced API Integration

#### Enhanced Service Layer
```typescript
class MarketDataService {
  // Enhanced: Get cached market data for a single stamp
  async getStampMarketData(cpid: string): Promise<StampMarketData | null>;
  
  // Enhanced: Get cached market data for multiple stamps
  async getStampMarketDataBatch(cpids: string[]): Promise<Map<string, StampMarketData>>;
  
  // Enhanced: Get collection-level aggregated data
  async getCollectionMarketData(collectionId: string): Promise<CollectionMarketData | null>;
  
  // Enhanced: Get stamps with market data for a collection
  async getCollectionStampsWithMarketData(
    collectionId: string, 
    options: PaginationOptions & FilterOptions
  ): Promise<StampWithMarketData[]>;
  
  // NEW: Holder-specific methods
  async getStampHolderCount(cpid: string): Promise<number>;
  async getStampHolderDetails(cpid: string, page: number, limit: number): Promise<PaginatedHolders>;
  async getStampsByHolderCountRange(minHolders: number, maxHolders: number): Promise<string[]>;
  
  // NEW: Filter support
  async filterStampsByMarketData(filters: MarketDataFilters): Promise<string[]>;
}

interface MarketDataFilters {
  floorPriceMin?: number;
  floorPriceMax?: number;
  holderCountMin?: number;
  holderCountMax?: number;
  volumeMin?: number;
  distributionScoreMin?: number;
}
```

#### Enhanced StampController
```typescript
// Enhanced parameter interface
interface GetStampsOptions {
  // ... existing parameters
  skipDispenserLookup?: boolean;
  skipPriceCalculation?: boolean;
  useCachedMarketData?: boolean; // ENHANCED: Use cached market data
  
  // NEW: Holder filtering
  holderCountMin?: number;
  holderCountMax?: number;
  distributionScoreMin?: number;
}

// Enhanced getStamps method
static async getStamps(options: GetStampsOptions) {
  // NEW: Pre-filter by holder count if specified
  let filteredCpids: string[] | undefined;
  if (options.holderCountMin || options.holderCountMax) {
    filteredCpids = await MarketDataService.filterStampsByMarketData({
      holderCountMin: options.holderCountMin,
      holderCountMax: options.holderCountMax,
      distributionScoreMin: options.distributionScoreMin
    });
    
    // If no stamps match holder criteria, return empty result
    if (filteredCpids.length === 0) {
      return { stamps: [], total: 0, page: options.page || 1 };
    }
  }
  
  const stamps = await StampService.getStamps({
    ...options,
    cpidFilter: filteredCpids // NEW: Pre-filter by cpids
  });
  
  if (options.useCachedMarketData && !options.skipPriceCalculation) {
    // Enrich with cached market data
    const cpids = stamps.map(s => s.cpid);
    const cachedMarketData = await MarketDataService.getStampMarketDataBatch(cpids);
    
    return stamps.map(stamp => ({
      ...stamp,
      // Floor price data
      floorPrice: cachedMarketData.get(stamp.cpid)?.floor_price_btc || "priceless",
      floorPriceUSD: cachedMarketData.get(stamp.cpid)?.floor_price_usd || null,
      recentSalePrice: cachedMarketData.get(stamp.cpid)?.recent_sale_price_btc || "priceless",
      
      // NEW: Holder data
      holderCount: cachedMarketData.get(stamp.cpid)?.holder_count || 0,
      holderDistributionScore: cachedMarketData.get(stamp.cpid)?.holder_distribution_score || 0,
      topHolderPercentage: cachedMarketData.get(stamp.cpid)?.top_holder_percentage || 0
    }));
  }
  
  return stamps;
}

// NEW: Enhanced holder endpoint
static async getStampHolders(
  cpid: string,
  page: number = 1,
  limit: number = 50,
  options: { cacheType: RouteType; useCachedData?: boolean } = { cacheType: "stamps" }
): Promise<PaginatedStampHolders> {
  try {
    if (options.useCachedData) {
      // Use cached holder details for better performance
      const cachedHolders = await MarketDataService.getStampHolderDetails(cpid, page, limit);
      return cachedHolders;
    }
    
    // Fallback to real-time API (existing implementation)
    const { holders, total } = await StampService.getStampHolders(
      cpid,
      page, 
      limit, 
      { cacheType: options.cacheType }
    );

    return {
      data: this.processHolders(holders),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error("stamps", {
      message: "Error fetching stamp holders",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
```

### Enhanced Frontend Integration

#### Enhanced Collection Route
```typescript
// routes/collection/index.tsx
const collectionResult = await StampController.getStamps({
  page,
  limit: limit,
  sortBy,
  type,
  filterBy,
  collectionId: item.collection_id,
  skipDispenserLookup: true,     // Skip expensive API calls
  skipPriceCalculation: false,   // We want market data
  useCachedMarketData: true,     // ENHANCED: Use cached market data
  
  // NEW: Support holder filtering
  holderCountMin: holderFilters?.min,
  holderCountMax: holderFilters?.max,
  distributionScoreMin: qualityFilters?.minDistribution
} as GetStampsOptions);
```

#### Enhanced Collection Components
```typescript
// components/card/CollectionCard.tsx
export function CollectionCard({ collection }: { collection: CollectionWithMarketData }) {
  const floorPrice = collection.min_floor_price_btc;
  const floorPriceDisplay = floorPrice !== null 
    ? `${floorPrice.toFixed(8)} BTC`
    : "N/A";
    
  // NEW: Holder information
  const avgHolders = collection.avg_holder_count;
  const holderRange = `${collection.min_holder_count}-${collection.max_holder_count}`;
  const distributionQuality = collection.avg_distribution_score;
    
  return (
    <div className="collection-card">
      {/* Existing price display */}
      <span className={valueSm}>{floorPriceDisplay}</span>
      
      {/* NEW: Holder metrics */}
      <div className="holder-metrics">
        <span className="holder-count">Avg: {avgHolders.toFixed(0)} holders</span>
        <span className="holder-range">Range: {holderRange}</span>
        <span className="distribution-score">
          Distribution: {distributionQuality.toFixed(0)}/100
        </span>
      </div>
    </div>
  );
}
```

#### NEW: Enhanced Filter Components
```typescript
// islands/filter/FilterContentStamp.tsx - FUTURE IMPLEMENTATION
// When holder filtering is re-enabled with cached data:

const handleHoldersRangeChange = (min: number, max: number) => {
  setFilters((prevFilters) => {
    const newFilters = {
      ...prevFilters,
      holdersMin: min === 0 ? "" : min.toString(),
      holdersMax: max === Infinity ? "" : max.toString(),
    };

    onFiltersChange(newFilters);
    return newFilters;
  });
};

// In the JSX:
<CollapsibleSection
  title="HOLDERS"
  section="holders"
  expanded={expandedSections.holders}
  toggle={() => toggleSection("holders")}
  variant="collapsibleTitle"
>
  <RangeSlider
    variant="holders"
    onChange={handleHoldersRangeChange}
    initialMin={filters.holdersMin ? parseInt(filters.holdersMin) : 0}
    initialMax={filters.holdersMax ? parseInt(filters.holdersMax) : Infinity}
    // NEW: Use dynamic breakpoints based on cached data
    useApiData={true}
    apiEndpoint="/api/v2/market-data/holder-ranges"
  />
</CollapsibleSection>
```

### Indexer Integration Strategy

#### Enhanced Integration Points

**1. Real-time Market Events**
```typescript
// Enhanced event handling for both dispensers and balances
interface MarketEvent {
  type: 'DISPENSER_CREATE' | 'DISPENSER_UPDATE' | 'DISPENSER_CLOSE' | 'DISPENSE' | 
        'BALANCE_CHANGE' | 'SEND' | 'ISSUANCE'; // NEW: Balance events
  cpid: string;
  block_index: number;
  transaction_data: any;
  affected_addresses?: string[]; // NEW: For balance changes
}

// Enhanced indexer integration
class IndexerIntegration {
  async onMarketEvent(event: MarketEvent): Promise<void> {
    // Determine update priority based on event type
    const priority = this.getEventPriority(event.type);
    
    // Queue immediate cache update for this stamp
    await MarketDataCacheQueue.add('update-market-data', {
      cpid: event.cpid,
      priority,
      reason: `${event.type.toLowerCase()}_${event.block_index}`,
      updateTypes: this.getRequiredUpdates(event.type) // NEW: Specify what to update
    });
    
    // NEW: Handle balance change events
    if (event.type === 'BALANCE_CHANGE' || event.type === 'SEND') {
      await this.handleBalanceChangeEvent(event);
    }
  }
  
  private async handleBalanceChangeEvent(event: MarketEvent): Promise<void> {
    // Balance changes affect holder counts and distribution
    await MarketDataCacheQueue.add('update-holder-data', {
      cpid: event.cpid,
      priority: 'medium',
      reason: `balance_change_${event.block_index}`,
      affectedAddresses: event.affected_addresses
    });
  }
  
  private getRequiredUpdates(eventType: string): string[] {
    switch (eventType) {
      case 'DISPENSER_CREATE':
      case 'DISPENSER_UPDATE':
      case 'DISPENSER_CLOSE':
      case 'DISPENSE':
        return ['floor_prices', 'volume'];
      case 'BALANCE_CHANGE':
      case 'SEND':
        return ['holder_counts', 'holder_distribution'];
      case 'ISSUANCE':
        return ['floor_prices', 'holder_counts', 'volume'];
      default:
        return ['floor_prices', 'holder_counts', 'volume'];
    }
  }
}
```

**2. Enhanced Batch Processing Coordination**
```typescript
// Enhanced coordination with indexer
class IndexerCoordination {
  async getLastProcessedBlock(): Promise<number>;
  async markBlockProcessed(blockIndex: number): Promise<void>;
  async getStampsModifiedSince(blockIndex: number): Promise<string[]>;
  
  // NEW: Balance-specific tracking
  async getLastProcessedBalanceBlock(): Promise<number>;
  async getStampsWithBalanceChangesSince(blockIndex: number): Promise<string[]>;
  async getAddressesWithBalanceChangesSince(blockIndex: number): Promise<string[]>;
}
```

**3. Enhanced Data Consistency**
```typescript
// Enhanced consistency checking
class ConsistencyChecker {
  async validateCacheConsistency(): Promise<ValidationReport>;
  async repairInconsistencies(issues: ValidationIssue[]): Promise<void>;
  
  // NEW: Holder data validation
  async validateHolderCounts(): Promise<HolderValidationReport>;
  async repairHolderInconsistencies(cpids: string[]): Promise<void>;
  async validateHolderDistribution(cpid: string): Promise<boolean>;
}
```

### Enhanced Monitoring and Maintenance

#### Enhanced Health Checks
```typescript
interface MarketDataHealthMetrics {
  // Floor price metrics
  total_stamps_cached: number;
  stamps_with_prices: number;
  price_cache_hit_rate: number;
  
  // NEW: Holder metrics
  stamps_with_holder_data: number;
  holder_cache_hit_rate: number;
  avg_holder_count: number;
  avg_distribution_score: number;
  
  // General metrics
  average_age_minutes: number;
  stale_entries_count: number;
  last_update_success: Date;
  last_update_duration_ms: number;
  
  // NEW: Performance metrics
  holder_update_duration_ms: number;
  distribution_calculation_duration_ms: number;
}
```

#### Enhanced Admin Endpoints
```typescript
// Enhanced admin API for market data cache management
POST /api/admin/market-data-cache/refresh
POST /api/admin/market-data-cache/refresh/:cpid
POST /api/admin/market-data-cache/refresh-holders/:cpid
GET  /api/admin/market-data-cache/health
GET  /api/admin/market-data-cache/stats
GET  /api/admin/market-data-cache/holder-stats
DELETE /api/admin/market-data-cache/clear
DELETE /api/admin/market-data-cache/clear-holders/:cpid

// NEW: Holder-specific endpoints
GET  /api/admin/market-data-cache/holder-distribution/:cpid
POST /api/admin/market-data-cache/recalculate-distribution/:cpid
GET  /api/admin/market-data-cache/holder-validation-report
```

#### Enhanced Alerting
- Cache update failures (floor prices OR holder data)
- Stale data (> 2 hours old)
- High error rates
- Performance degradation
- **NEW**: Holder count discrepancies
- **NEW**: Distribution calculation failures
- **NEW**: Holder cache inconsistencies

### Performance Expectations

#### Before Implementation
- Collection page load: 10+ seconds
- API calls per page: 40+ (dispensers) + 40+ (holders if filtering) = 80+
- Error rate: 15-20%
- User experience: Poor
- **NEW**: Holder filtering: Impossible due to performance

#### After Implementation
- Collection page load: < 2 seconds
- API calls per page: 0 (cached data)
- Error rate: < 1%
- User experience: Excellent
- **NEW**: Holder filtering: Instant with cached data

#### Enhanced Scalability
- Supports 10,000+ stamps with market data
- Sub-second query times for both prices and holder counts
- Minimal server load
- 95% reduction in external API calls
- **NEW**: Holder filtering scales to any number of stamps
- **NEW**: Collection-level holder analytics

### Enhanced Implementation Timeline

#### Phase 1: Enhanced Foundation (Week 1-2)
- [ ] Enhanced database schema creation (market data + holder cache)
- [ ] Basic MarketDataService implementation
- [ ] Enhanced background job for market data updates
- [ ] TypeScript interface updates for holder data

#### Phase 2: Enhanced Integration (Week 3-4)
- [ ] Enhanced StampController integration
- [ ] Collection route updates with holder support
- [ ] Frontend component updates for market data
- [ ] Basic monitoring for both price and holder data

#### Phase 3: Enhanced Features (Week 5-6)
- [ ] Volume tracking
- [ ] Collection aggregation with holder metrics
- [ ] Enhanced indexer integration for balance events
- [ ] Advanced monitoring and alerting

#### Phase 4: Enhanced Optimization (Week 7-8)
- [ ] Performance tuning for holder calculations
- [ ] Cache warming strategies for both data types
- [ ] Error handling improvements
- [ ] **NEW**: Holder filtering UI implementation
- [ ] Documentation and training

### Enhanced Risk Mitigation

#### Data Freshness
- **Risk**: Cached data becomes stale (prices OR holder counts)
- **Mitigation**: 15-30 minute update frequency, real-time updates for high-activity stamps

#### Cache Failures
- **Risk**: Background job failures
- **Mitigation**: Fallback to real-time API calls, alerting, retry mechanisms

#### Data Inconsistency
- **Risk**: Cache diverges from reality (especially holder counts)
- **Mitigation**: Enhanced validation checks, periodic full refreshes, manual override capabilities

#### **NEW**: Holder Data Complexity
- **Risk**: Holder calculations are computationally expensive
- **Mitigation**: Incremental updates, smart change detection, parallel processing

#### Migration Issues
- **Risk**: Breaking existing functionality
- **Mitigation**: Feature flags, gradual rollout, comprehensive testing

### Enhanced Success Metrics

#### Performance
- [ ] Collection page load time < 2 seconds
- [ ] 95% reduction in external API calls
- [ ] Error rate < 1%
- [ ] **NEW**: Holder filtering response time < 500ms

#### User Experience
- [ ] Floor prices displayed on all collection pages
- [ ] **NEW**: Holder counts displayed where relevant
- [ ] No loading states for market data
- [ ] Consistent market information
- [ ] **NEW**: Functional holder count filtering

#### System Health
- [ ] Cache update success rate > 99%
- [ ] Data freshness < 30 minutes
- [ ] Zero impact on indexer performance
- [ ] **NEW**: Holder data accuracy > 99%

### Enhanced Future Enhancements

#### Advanced Features
- Price trend indicators
- **NEW**: Holder trend analysis
- Volume-based rankings
- Market cap calculations
- **NEW**: Holder distribution quality scores
- Price alerts and notifications
- **NEW**: Holder concentration alerts

#### Analytics
- Price history tracking
- **NEW**: Holder history tracking
- Market trend analysis
- Collection performance metrics
- Trading volume insights
- **NEW**: Holder behavior analytics
- **NEW**: Distribution pattern analysis

#### API Extensions
- Public market data API endpoints
- **NEW**: Public holder data API endpoints
- WebSocket real-time market data updates
- Historical market data access
- Market data exports
- **NEW**: Holder analytics API

---

## 🔄 **IMPLEMENTATION SEGMENTATION: Backend vs Frontend**

This section clearly defines what needs to be implemented in the **backend indexer** versus what needs to be implemented in this **frontend repository**.

### 🌐 **Multi-Source Integration Responsibilities**

#### **Backend Indexer: Data Source Management**
- **API Integration**: Counterparty, OpenStamp, StampScan, KuCoin, additional exchanges
- **Data Aggregation**: Smart merging of multi-source data with conflict resolution
- **Source Reliability**: Confidence scoring and fallback mechanisms
- **Rate Limiting**: Manage API quotas and request throttling across sources

#### **Frontend Repository: Data Consumption**
- **Cache Queries**: Unified interface to cached multi-source data
- **Source Attribution**: Display which sources provided data points
- **Quality Indicators**: Show data quality scores and source reliability
- **Fallback UI**: Handle cases where certain sources are unavailable

### 🏗️ **BACKEND INDEXER RESPONSIBILITIES**
*These components will be implemented in the separate backend indexer codebase*

#### **1. Database Schema Creation & Management**
```sql
-- Backend indexer will create and manage these tables
CREATE TABLE stamp_market_data (
  cpid VARCHAR(255) PRIMARY KEY,
  -- Floor Price Data
  floor_price_btc DECIMAL(16,8) NULL,
  floor_price_usd DECIMAL(16,2) NULL,
  recent_sale_price_btc DECIMAL(16,8) NULL,
  recent_sale_price_usd DECIMAL(16,2) NULL,
  open_dispensers_count INTEGER DEFAULT 0,
  closed_dispensers_count INTEGER DEFAULT 0,
  total_dispensers_count INTEGER DEFAULT 0,
  -- Holder Data
  holder_count INTEGER DEFAULT 0,
  unique_holder_count INTEGER DEFAULT 0,
  top_holder_percentage DECIMAL(5,2) DEFAULT 0,
  holder_distribution_score DECIMAL(5,2) DEFAULT 0,
  -- Volume Data
  volume_24h_btc DECIMAL(16,8) DEFAULT 0,
  volume_7d_btc DECIMAL(16,8) DEFAULT 0,
  volume_30d_btc DECIMAL(16,8) DEFAULT 0,
  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_dispenser_block INTEGER NULL,
  last_balance_block INTEGER NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Indexes for frontend filtering
  INDEX idx_floor_price_btc (floor_price_btc),
  INDEX idx_holder_count (holder_count),
  INDEX idx_last_updated (last_updated),
  INDEX idx_volume_24h (volume_24h_btc),
  INDEX idx_holder_distribution (holder_distribution_score)
);

CREATE TABLE collection_market_data (
  collection_id VARCHAR(255) PRIMARY KEY,
  -- Floor Price Aggregates
  min_floor_price_btc DECIMAL(16,8) NULL,
  max_floor_price_btc DECIMAL(16,8) NULL,
  avg_floor_price_btc DECIMAL(16,8) NULL,
  median_floor_price_btc DECIMAL(16,8) NULL,
  total_volume_24h_btc DECIMAL(16,8) DEFAULT 0,
  stamps_with_prices_count INTEGER DEFAULT 0,
  -- Holder Aggregates
  min_holder_count INTEGER DEFAULT 0,
  max_holder_count INTEGER DEFAULT 0,
  avg_holder_count DECIMAL(8,2) DEFAULT 0,
  median_holder_count INTEGER DEFAULT 0,
  total_unique_holders INTEGER DEFAULT 0,
  avg_distribution_score DECIMAL(5,2) DEFAULT 0,
  -- Collection Metadata
  total_stamps_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Indexes
  INDEX idx_min_floor_price (min_floor_price_btc),
  INDEX idx_total_volume (total_volume_24h_btc),
  INDEX idx_min_holder_count (min_holder_count),
  INDEX idx_avg_holder_count (avg_holder_count)
);

CREATE TABLE stamp_holder_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cpid VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  rank_position INTEGER NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cpid_address (cpid, address),
  INDEX idx_cpid_rank (cpid, rank_position),
  INDEX idx_cpid_quantity (cpid, quantity DESC),
  INDEX idx_address (address),
  INDEX idx_last_updated (last_updated)
);
```

#### **2. Multi-Source API Integration & Data Fetching**
```typescript
// Backend indexer will implement these services
class BackendMarketDataService {
  // === STAMP DATA SOURCES ===
  // Fetch dispenser data from Counterparty API
  async fetchDispenserData(cpid: string): Promise<DispenserData>;
  
  // Fetch holder data from Counterparty API  
  async fetchHolderData(cpid: string): Promise<HolderData>;
  
  // Fetch dispense/sales data from Counterparty API
  async fetchDispenseData(cpid: string): Promise<DispenseData>;
  
  // NEW: Fetch stamp data from external exchanges
  async fetchExchangeStampData(cpid: string, exchange: string): Promise<ExchangeStampData>;
  
  // NEW: Fetch stamp data from NFT marketplaces
  async fetchNFTMarketplaceData(cpid: string): Promise<NFTMarketplaceData>;
  
  // === SRC-20 DATA SOURCES ===
  // Fetch SRC-20 data from OpenStamp API
  async fetchOpenStampData(tick: string): Promise<OpenStampData>;
  
  // Fetch SRC-20 data from StampScan API
  async fetchStampScanData(tick: string): Promise<StampScanData>;
  
  // NEW: Fetch SRC-20 data from KuCoin API
  async fetchKuCoinData(tick: string): Promise<KuCoinData>;
  
  // NEW: Fetch SRC-20 data from additional exchanges
  async fetchAdditionalExchangeData(tick: string): Promise<ExchangeData>;
  
  // === DATA PROCESSING ===
  // Calculate floor prices from multiple sources
  calculateFloorPriceMetrics(sources: MarketDataSource[]): FloorPriceMetrics;
  
  // Calculate holder distribution metrics
  calculateHolderMetrics(sources: HolderDataSource[]): HolderMetrics;
  
  // Calculate volume metrics from multiple sources
  calculateVolumeMetrics(sources: VolumeDataSource[], timeframe: string): VolumeMetrics;
  
  // NEW: Aggregate multi-source data with conflict resolution
  aggregateMultiSourceData(sources: MultiSourceData): AggregatedMarketData;
  
  // NEW: Calculate data quality scores
  calculateDataQualityScore(sources: DataSource[]): number;
  
  // NEW: Implement source reliability scoring
  updateSourceReliabilityScores(source: string, success: boolean, responseTime: number): void;
}

// NEW: Source-specific data interfaces
interface MarketDataSource {
  source: string;
  price_btc: number;
  volume_24h: number;
  confidence: number;
  timestamp: Date;
}

interface SRC20MarketSource extends MarketDataSource {
  tick: string;
  holder_count: number;
  market_cap: number;
  price_change_24h: number;
}

interface StampMarketSource extends MarketDataSource {
  cpid: string;
  holder_count: number;
  dispenser_count: number;
}
```

#### **3. Multi-Asset Background Job Processing**
```typescript
// Backend indexer will implement the background job system
class MarketDataUpdateJob {
  // === STAMP PROCESSING ===
  // Process individual stamp market data from multiple sources
  async updateStampMarketData(cpid: string): Promise<void>;
  
  // Process batch of stamps
  async processBatch(cpids: string[], batchSize: number): Promise<void>;
  
  // === SRC-20 PROCESSING ===
  // NEW: Process individual SRC-20 token market data
  async updateSRC20MarketData(tick: string): Promise<void>;
  
  // NEW: Process batch of SRC-20 tokens
  async processSRC20Batch(ticks: string[], batchSize: number): Promise<void>;
  
  // === UNIFIED PROCESSING ===
  // Process incremental updates based on new blocks
  async processIncrementalUpdates(sinceBlock: number): Promise<void>;
  
  // Full refresh of all market data (stamps + SRC-20)
  async processFullRefresh(): Promise<void>;
  
  // Update collection-level aggregates
  async updateCollectionAggregates(): Promise<void>;
  
  // NEW: Update SRC-20 market aggregates
  async updateSRC20MarketAggregates(): Promise<void>;
  
  // NEW: Multi-source health monitoring
  async monitorSourceHealth(): Promise<SourceHealthReport>;
  
  // NEW: Adaptive update frequency based on market activity
  async adjustUpdateFrequency(asset: string, activityLevel: number): Promise<void>;
}

// NEW: Source health monitoring
interface SourceHealthReport {
  sources: {
    [sourceName: string]: {
      status: 'healthy' | 'degraded' | 'offline';
      response_time_avg: number;
      success_rate: number;
      last_successful_update: Date;
      error_count_24h: number;
    };
  };
  overall_health: 'healthy' | 'degraded' | 'critical';
  recommended_actions: string[];
}
```

#### **4. Real-time Event Processing**
```typescript
// Backend indexer will handle blockchain events
class IndexerEventProcessor {
  // Process dispenser events (create, update, close, dispense)
  async onDispenserEvent(event: DispenserEvent): Promise<void>;
  
  // Process balance change events (sends, receives)
  async onBalanceChangeEvent(event: BalanceEvent): Promise<void>;
  
  // Process issuance events
  async onIssuanceEvent(event: IssuanceEvent): Promise<void>;
  
  // Queue market data updates based on events
  async queueMarketDataUpdate(cpid: string, priority: string): Promise<void>;
}
```

#### **5. Data Validation & Consistency**
```typescript
// Backend indexer will implement validation
class MarketDataValidator {
  // Validate holder counts against API
  async validateHolderCounts(cpids: string[]): Promise<ValidationReport>;
  
  // Validate floor prices against dispensers
  async validateFloorPrices(cpids: string[]): Promise<ValidationReport>;
  
  // Repair inconsistencies
  async repairInconsistencies(issues: ValidationIssue[]): Promise<void>;
}
```

---

### 🎨 **FRONTEND REPOSITORY RESPONSIBILITIES**
*These components will be implemented in this BTCStampsExplorer repository*

#### **1. Multi-Asset Database Query Layer**
```typescript
// Frontend will implement database queries for cached data
// File: server/services/marketDataService.ts
class MarketDataService {
  // === STAMP QUERIES ===
  // Query cached market data for single stamp
  static async getStampMarketData(cpid: string): Promise<StampMarketData | null> {
    const query = `
      SELECT 
        cpid,
        floor_price_btc,
        floor_price_usd,
        recent_sale_price_btc,
        recent_sale_price_usd,
        holder_count,
        holder_distribution_score,
        top_holder_percentage,
        volume_24h_btc,
        last_updated
      FROM stamp_market_data 
      WHERE cpid = ?
    `;
    return await dbManager.query(query, [cpid]);
  }
  
  // Query cached market data for multiple stamps
  static async getStampMarketDataBatch(cpids: string[]): Promise<Map<string, StampMarketData>> {
    const placeholders = cpids.map(() => '?').join(',');
    const query = `
      SELECT * FROM stamp_market_data 
      WHERE cpid IN (${placeholders})
    `;
    const results = await dbManager.query(query, cpids);
    return new Map(results.map(row => [row.cpid, row]));
  }
  
  // Filter stamps by market data criteria
  static async filterStampsByMarketData(filters: MarketDataFilters): Promise<string[]> {
    let query = 'SELECT cpid FROM stamp_market_data WHERE 1=1';
    const params: any[] = [];
    
    if (filters.floorPriceMin) {
      query += ' AND floor_price_btc >= ?';
      params.push(filters.floorPriceMin);
    }
    if (filters.floorPriceMax) {
      query += ' AND floor_price_btc <= ?';
      params.push(filters.floorPriceMax);
    }
    if (filters.holderCountMin) {
      query += ' AND holder_count >= ?';
      params.push(filters.holderCountMin);
    }
    if (filters.holderCountMax) {
      query += ' AND holder_count <= ?';
      params.push(filters.holderCountMax);
    }
    
    const results = await dbManager.query(query, params);
    return results.map(row => row.cpid);
  }
  
  // Get collection market data aggregates
  static async getCollectionMarketData(collectionId: string): Promise<CollectionMarketData | null> {
    const query = `
      SELECT * FROM collection_market_data 
      WHERE collection_id = ?
    `;
    return await dbManager.query(query, [collectionId]);
  }
  
  // Get cached holder details for stamp
  static async getStampHolderDetails(
    cpid: string, 
    page: number, 
    limit: number
  ): Promise<PaginatedHolders> {
    const offset = (page - 1) * limit;
    const query = `
      SELECT address, quantity, percentage, rank_position
      FROM stamp_holder_cache 
      WHERE cpid = ?
      ORDER BY rank_position ASC
      LIMIT ? OFFSET ?
    `;
    const countQuery = `
      SELECT COUNT(*) as total FROM stamp_holder_cache WHERE cpid = ?
    `;
    
    const [holders, countResult] = await Promise.all([
      dbManager.query(query, [cpid, limit, offset]),
      dbManager.query(countQuery, [cpid])
    ]);
    
    return {
      data: holders,
      page,
      limit,
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }
}
```

#### **2. Enhanced StampController Integration**
```typescript
// File: server/controller/stampController.ts
// Frontend will enhance existing controller with market data
export class StampController {
  static async getStamps(options: GetStampsOptions) {
    // NEW: Pre-filter by market data if specified
    let filteredCpids: string[] | undefined;
    if (options.holderCountMin || options.holderCountMax || options.floorPriceMin || options.floorPriceMax) {
      filteredCpids = await MarketDataService.filterStampsByMarketData({
        holderCountMin: options.holderCountMin,
        holderCountMax: options.holderCountMax,
        floorPriceMin: options.floorPriceMin,
        floorPriceMax: options.floorPriceMax,
        distributionScoreMin: options.distributionScoreMin
      });
      
      // If no stamps match criteria, return empty result
      if (filteredCpids.length === 0) {
        return { stamps: [], total: 0, page: options.page || 1 };
      }
    }
    
    // Get stamps with optional pre-filtering
    const stamps = await StampService.getStamps({
      ...options,
      cpidFilter: filteredCpids // NEW: Pre-filter by cpids
    });
    
    // Enrich with cached market data if requested
    if (options.useCachedMarketData && !options.skipPriceCalculation) {
      const cpids = stamps.map(s => s.cpid);
      const cachedMarketData = await MarketDataService.getStampMarketDataBatch(cpids);
      
      return stamps.map(stamp => ({
        ...stamp,
        // Floor price data
        floorPrice: cachedMarketData.get(stamp.cpid)?.floor_price_btc || "priceless",
        floorPriceUSD: cachedMarketData.get(stamp.cpid)?.floor_price_usd || null,
        recentSalePrice: cachedMarketData.get(stamp.cpid)?.recent_sale_price_btc || "priceless",
        // Holder data
        holderCount: cachedMarketData.get(stamp.cpid)?.holder_count || 0,
        holderDistributionScore: cachedMarketData.get(stamp.cpid)?.holder_distribution_score || 0,
        topHolderPercentage: cachedMarketData.get(stamp.cpid)?.top_holder_percentage || 0
      }));
    }
    
    return stamps;
  }
  
  // Enhanced holder endpoint with caching
  static async getStampHolders(
    cpid: string,
    page: number = 1,
    limit: number = 50,
    options: { cacheType: RouteType; useCachedData?: boolean } = { cacheType: "stamps" }
  ): Promise<PaginatedStampHolders> {
    try {
      if (options.useCachedData) {
        // Use cached holder details for better performance
        return await MarketDataService.getStampHolderDetails(cpid, page, limit);
      }
      
      // Fallback to real-time API (existing implementation)
      const { holders, total } = await StampService.getStampHolders(
        cpid, page, limit, { cacheType: options.cacheType }
      );

      return {
        data: this.processHolders(holders),
        page, limit, total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error fetching stamp holders",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
```

#### **3. Enhanced Route Handlers**
```typescript
// File: routes/handlers/sharedStampHandler.ts
// Frontend will enhance existing handlers with market data filtering

export async function handleStampRequest(request: Request, routeConfig: RouteConfig) {
  const url = new URL(request.url);
  
  // Extract existing filters
  const marketFilters = url.searchParams.getAll("market") as STAMP_MARKET[];
  const marketMin = url.searchParams.get("marketMin") || "";
  const marketMax = url.searchParams.get("marketMax") || "";
  
  // NEW: Extract holder filters
  const holdersMin = url.searchParams.get("holdersMin") || "";
  const holdersMax = url.searchParams.get("holdersMax") || "";
  
  // NEW: Extract distribution score filter
  const distributionScoreMin = url.searchParams.get("distributionScoreMin") || "";
  
  const result = await StampController.getStamps({
    page,
    limit: effectiveLimit,
    sortBy: sortValidation,
    type: routeConfig.type,
    allColumns: false,
    skipTotalCount: false,
    includeSecondary: true,
    cacheType,
    filetypeFilters,
    editionFilters,
    marketFilters,
    marketMin,
    marketMax,
    rangeFilters,
    rangeMin,
    rangeMax,
    // NEW: Market data filtering
    useCachedMarketData: true,
    holdersMin: holdersMin ? parseInt(holdersMin) : undefined,
    holdersMax: holdersMax ? parseInt(holdersMax) : undefined,
    distributionScoreMin: distributionScoreMin ? parseInt(distributionScoreMin) : undefined
  });
  
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
```

#### **4. Enhanced Filter Components**
```typescript
// File: islands/filter/FilterOptionsStamp.tsx
// Frontend will add market data filter support

export type StampFilters = {
  market: STAMP_MARKET[];
  marketMin: string;
  marketMax: string;
  fileType: STAMP_FILETYPES[];
  editions: STAMP_EDITIONS[];
  range: STAMP_RANGES | null;
  rangeMin: string;
  rangeMax: string;
  // NEW: Market data filters
  holdersMin: string;
  holdersMax: string;
  floorPriceMin: string;
  floorPriceMax: string;
  distributionScoreMin: string;
  [key: string]: any;
};

export function filtersToQueryParams(search: string, filters: StampFilters): string {
  const queryParams = new URLSearchParams(search);
  
  // Existing filter logic...
  
  // NEW: Market data filters
  if (filters.holdersMin) {
    queryParams.set("holdersMin", filters.holdersMin);
  } else {
    queryParams.delete("holdersMin");
  }
  
  if (filters.holdersMax) {
    queryParams.set("holdersMax", filters.holdersMax);
  } else {
    queryParams.delete("holdersMax");
  }
  
  if (filters.floorPriceMin) {
    queryParams.set("floorPriceMin", filters.floorPriceMin);
  } else {
    queryParams.delete("floorPriceMin");
  }
  
  if (filters.floorPriceMax) {
    queryParams.set("floorPriceMax", filters.floorPriceMax);
  } else {
    queryParams.delete("floorPriceMax");
  }
  
  return queryParams.toString();
}
```

#### **5. Enhanced Filter UI Components**
```typescript
// File: islands/filter/FilterContentStamp.tsx
// Frontend will implement market data filter UI (when ready)

export function FilterContentStamp({ filters, onFiltersChange }: FilterProps) {
  // Existing filter sections...
  
  // NEW: Market data filter sections (to be enabled when backend is ready)
  const handleHoldersRangeChange = (min: number, max: number) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        holdersMin: min === 0 ? "" : min.toString(),
        holdersMax: max === Infinity ? "" : max.toString(),
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };
  
  const handleFloorPriceRangeChange = (min: number, max: number) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        floorPriceMin: min === 0 ? "" : min.toString(),
        floorPriceMax: max === Infinity ? "" : max.toString(),
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };
  
  return (
    <div className="filter-content">
      {/* Existing filter sections */}
      
      {/* NEW: HOLDERS filter section (commented out until backend ready) */}
      {/*
      <CollapsibleSection
        title="HOLDERS"
        section="holders"
        expanded={expandedSections.holders}
        toggle={() => toggleSection("holders")}
        variant="collapsibleTitle"
      >
        <RangeSlider
          variant="holders"
          onChange={handleHoldersRangeChange}
          initialMin={filters.holdersMin ? parseInt(filters.holdersMin) : 0}
          initialMax={filters.holdersMax ? parseInt(filters.holdersMax) : Infinity}
          useApiData={true}
          apiEndpoint="/api/v2/market-data/holder-ranges"
        />
      </CollapsibleSection>
      */}
      
      {/* NEW: FLOOR PRICE filter section (commented out until backend ready) */}
      {/*
      <CollapsibleSection
        title="FLOOR PRICE"
        section="floorPrice"
        expanded={expandedSections.floorPrice}
        toggle={() => toggleSection("floorPrice")}
        variant="collapsibleTitle"
      >
        <RangeSlider
          variant="price"
          onChange={handleFloorPriceRangeChange}
          initialMin={filters.floorPriceMin ? parseFloat(filters.floorPriceMin) : 0}
          initialMax={filters.floorPriceMax ? parseFloat(filters.floorPriceMax) : Infinity}
          useApiData={true}
          apiEndpoint="/api/v2/market-data/price-ranges"
        />
      </CollapsibleSection>
      */}
    </div>
  );
}
```

#### **6. Enhanced Collection Components**
```typescript
// File: components/card/CollectionCard.tsx
// Frontend will display cached market data

export function CollectionCard({ collection }: { collection: CollectionWithMarketData }) {
  const floorPrice = collection.min_floor_price_btc;
  const floorPriceDisplay = floorPrice !== null 
    ? `${floorPrice.toFixed(8)} BTC`
    : "N/A";
    
  // Market data from cache
  const avgHolders = collection.avg_holder_count;
  const holderRange = `${collection.min_holder_count}-${collection.max_holder_count}`;
  const distributionQuality = collection.avg_distribution_score;
    
  return (
    <div className="collection-card">
      {/* Existing price display */}
      <span className={valueSm}>{floorPriceDisplay}</span>
      
      {/* NEW: Market data display */}
      <div className="market-metrics">
        <span className="holder-count">Avg: {avgHolders.toFixed(0)} holders</span>
        <span className="holder-range">Range: {holderRange}</span>
        <span className="distribution-score">
          Distribution: {distributionQuality.toFixed(0)}/100
        </span>
      </div>
    </div>
  );
}
```

#### **7. API Health & Monitoring Endpoints**
```typescript
// File: routes/api/v2/market-data/health.ts
// Frontend will provide health check endpoints for market data cache

export async function GET(request: Request): Promise<Response> {
  try {
    const healthMetrics = await MarketDataService.getHealthMetrics();
    
    return new Response(JSON.stringify({
      status: "healthy",
      cache_status: healthMetrics.cache_hit_rate > 0.8 ? "optimal" : "degraded",
      metrics: {
        total_stamps_cached: healthMetrics.total_stamps_cached,
        stamps_with_prices: healthMetrics.stamps_with_prices,
        stamps_with_holder_data: healthMetrics.stamps_with_holder_data,
        cache_hit_rate: healthMetrics.cache_hit_rate,
        last_update: healthMetrics.last_update_success,
        data_freshness_minutes: healthMetrics.average_age_minutes
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: "error",
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
```

---

### 🔄 **INTEGRATION HANDOFF POINTS**

#### **Backend → Frontend Data Flow**
1. **Backend indexer** populates `stamp_market_data`, `collection_market_data`, and `stamp_holder_cache` tables
2. **Frontend repository** queries these tables via `MarketDataService`
3. **Frontend** serves cached data through existing API endpoints
4. **Frontend** enables filtering UI when backend data is available

#### **Shared Interfaces & Types**
```typescript
// File: lib/types/marketData.ts
// Shared between backend and frontend

export interface StampMarketData {
  cpid: string;
  floor_price_btc: number | null;
  floor_price_usd: number | null;
  recent_sale_price_btc: number | null;
  recent_sale_price_usd: number | null;
  holder_count: number;
  holder_distribution_score: number;
  top_holder_percentage: number;
  volume_24h_btc: number;
  last_updated: Date;
}

export interface CollectionMarketData {
  collection_id: string;
  min_floor_price_btc: number | null;
  max_floor_price_btc: number | null;
  avg_floor_price_btc: number | null;
  min_holder_count: number;
  max_holder_count: number;
  avg_holder_count: number;
  total_unique_holders: number;
  avg_distribution_score: number;
  last_updated: Date;
}

export interface MarketDataFilters {
  floorPriceMin?: number;
  floorPriceMax?: number;
  holderCountMin?: number;
  holderCountMax?: number;
  distributionScoreMin?: number;
}
```

#### **Implementation Sequence**
1. **Phase 1**: Backend indexer implements database schema and data population
2. **Phase 2**: Frontend implements `MarketDataService` and database queries
3. **Phase 3**: Frontend enhances controllers and route handlers
4. **Phase 4**: Frontend enables filter UI components
5. **Phase 5**: Frontend adds collection-level market data display

#### **Monitoring & Validation**
- **Backend** provides data population metrics and validation
- **Frontend** provides API health endpoints and cache performance metrics
- **Shared** monitoring of data consistency and freshness

This segmentation ensures clear responsibilities and enables parallel development of backend indexer and frontend repository components.

---

## Conclusion

The enhanced market data cache system will transform the user experience by providing instant access to both pricing and holder information. The unified approach ensures consistent performance improvements across all market data types while maintaining a single, manageable infrastructure.

The integration with the indexer will be crucial for maintaining data consistency and enabling real-time updates for both dispenser events and balance changes. The system is designed to scale with the growing stamp ecosystem while providing rich analytics capabilities.

**Key Benefits of the Enhanced System:**
1. **Unified Infrastructure**: Single system handles both floor prices and holder data
2. **Scalable Filtering**: Holder count filtering becomes feasible with cached data
3. **Rich Analytics**: Collection-level holder metrics and distribution analysis
4. **Future-Proof**: Extensible architecture for additional market data types
5. **Performance**: Sub-second response times for all market data queries

This system positions the platform for advanced market analysis features while providing immediate performance benefits for existing functionality. The holder data integration specifically enables new filtering capabilities that were previously impossible due to performance constraints.

---

## 🪙 **SRC-20 MARKETPLACE AGGREGATION STRATEGY**

### Current SRC-20 Integration Analysis

Based on the existing `SRC20MarketService`, the system already aggregates data from:
- **OpenStamp API**: Price, volume, holder count, market cap, price changes
- **StampScan API**: Floor prices, volume, holder count, metadata

### Enhanced SRC-20 Multi-Source Architecture

#### **Planned Data Source Expansion**
```typescript
// Backend indexer will implement these SRC-20 data sources
class SRC20DataSources {
  // Existing sources (enhance)
  async fetchOpenStampData(tick: string): Promise<OpenStampData>;
  async fetchStampScanData(tick: string): Promise<StampScanData>;
  
  // NEW: Additional marketplace integrations
  async fetchKuCoinData(tick: string): Promise<KuCoinData>;
  async fetchGateIOData(tick: string): Promise<GateIOData>;
  async fetchOKXData(tick: string): Promise<OKXData>;
  async fetchUniswapData(tick: string): Promise<UniswapData>; // If bridged
  
  // NEW: DEX aggregator data
  async fetchDEXAggregatorData(tick: string): Promise<DEXData>;
  
  // NEW: Cross-chain bridge data
  async fetchBridgeData(tick: string): Promise<BridgeData>;
}
```

#### **SRC-20 Specific Aggregation Logic**
```typescript
// Backend indexer SRC-20 aggregation strategy
class SRC20MarketAggregator {
  async aggregateSRC20Data(tick: string, sources: SRC20MarketSource[]): Promise<SRC20MarketData> {
    // Price aggregation: Use lowest reliable price for floor
    const floorPrice = this.calculateFloorPrice(sources);
    
    // Volume aggregation: Sum all marketplace volumes
    const totalVolume24h = sources.reduce((sum, source) => {
      return sum + (source.volume_24h || 0);
    }, 0);
    
    // Market cap calculation: Use best price and most reliable supply data
    const marketCap = this.calculateMarketCap(floorPrice, sources);
    
    // Holder count: Use most comprehensive source
    const holderCount = Math.max(...sources.map(s => s.holder_count || 0));
    
    // Price change: Use most reliable source with sufficient volume
    const priceChange24h = this.selectMostReliablePriceChange(sources);
    
    return {
      tick,
      floor_price_btc: floorPrice,
      volume_24h_btc: totalVolume24h,
      market_cap_btc: marketCap,
      holder_count: holderCount,
      price_change_24h: priceChange24h,
      price_source: this.identifyBestPriceSource(sources),
      volume_sources: this.mapVolumeSources(sources),
      data_quality_score: this.calculateSRC20QualityScore(sources)
    };
  }
  
  private calculateFloorPrice(sources: SRC20MarketSource[]): number {
    // Filter out unreliable or stale prices
    const reliablePrices = sources
      .filter(s => s.confidence > 7.0 && s.price_btc > 0)
      .map(s => s.price_btc);
    
    if (reliablePrices.length === 0) {
      // Fallback to any available price
      const anyPrices = sources
        .filter(s => s.price_btc > 0)
        .map(s => s.price_btc);
      return anyPrices.length > 0 ? Math.min(...anyPrices) : 0;
    }
    
    return Math.min(...reliablePrices);
  }
  
  private calculateMarketCap(floorPrice: number, sources: SRC20MarketSource[]): number {
    // Get most reliable total supply data
    const supplySource = sources
      .filter(s => s.total_supply > 0)
      .sort((a, b) => b.confidence - a.confidence)[0];
    
    if (!supplySource || floorPrice === 0) return 0;
    
    return floorPrice * supplySource.total_supply;
  }
}
```

#### **SRC-20 Cache Update Strategy**
```typescript
// Backend indexer SRC-20 update job
class SRC20CacheUpdateJob {
  async updateAllSRC20Tokens(): Promise<void> {
    // Get list of all active SRC-20 tokens
    const activeTicks = await this.getActiveSRC20Ticks();
    
    // Process in batches to avoid API rate limits
    const batchSize = 10;
    for (let i = 0; i < activeTicks.length; i += batchSize) {
      const batch = activeTicks.slice(i, i + batchSize);
      await Promise.all(batch.map(tick => this.updateSRC20Token(tick)));
      
      // Rate limiting between batches
      await this.delay(1000);
    }
  }
  
  async updateSRC20Token(tick: string): Promise<void> {
    try {
      // Fetch from all available sources
      const sources = await Promise.allSettled([
        this.fetchOpenStampData(tick),
        this.fetchStampScanData(tick),
        this.fetchKuCoinData(tick),
        // Add more sources as they become available
      ]);
      
      const validSources = sources
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      if (validSources.length === 0) {
        console.warn(`No valid sources for SRC-20 token: ${tick}`);
        return;
      }
      
      // Aggregate data from all sources
      const aggregatedData = await this.aggregateSRC20Data(tick, validSources);
      
      // Update cache
      await this.updateSRC20Cache(tick, aggregatedData);
      
      // Update source tracking
      await this.updateSRC20SourceData(tick, validSources);
      
    } catch (error) {
      console.error(`Error updating SRC-20 token ${tick}:`, error);
    }
  }
}
```

### SRC-20 vs Stamp Data Differences

#### **Key Differences in Data Patterns**
1. **Volatility**: SRC-20 tokens typically more volatile than art stamps
2. **Trading Frequency**: Higher frequency trading requires more frequent updates
3. **Market Depth**: Multiple exchanges vs primarily Counterparty dispensers
4. **Price Discovery**: CEX/DEX pricing vs dispenser-based pricing
5. **Liquidity**: Varies significantly between tokens vs stamps

#### **Optimized Update Frequencies**
```typescript
// Backend indexer adaptive update strategy
class AdaptiveUpdateScheduler {
  getSRC20UpdateFrequency(tick: string, marketData: SRC20MarketData): number {
    // High volume tokens: Update every 2-5 minutes
    if (marketData.volume_24h_btc > 1.0) {
      return 2 * 60 * 1000; // 2 minutes
    }
    
    // Medium volume tokens: Update every 10 minutes
    if (marketData.volume_24h_btc > 0.1) {
      return 10 * 60 * 1000; // 10 minutes
    }
    
    // Low volume tokens: Update every 30 minutes
    return 30 * 60 * 1000; // 30 minutes
  }
  
  getStampUpdateFrequency(cpid: string, marketData: StampMarketData): number {
    // Stamps generally less volatile, longer update intervals
    if (marketData.volume_24h_btc > 0.5) {
      return 15 * 60 * 1000; // 15 minutes
    }
    
    return 30 * 60 * 1000; // 30 minutes default
  }
}
```

### Frontend SRC-20 Integration

#### **Enhanced SRC-20 Market Pages**
```typescript
// Frontend will enhance SRC-20 pages with cached data
// File: routes/src20/market.tsx
export async function handler(req: Request): Promise<Response> {
  // Use cached SRC-20 market data instead of real-time API calls
  const marketData = await MarketDataService.getSRC20MarketRankings('market_cap', 100);
  
  return new Response(JSON.stringify({
    tokens: marketData.map(token => ({
      tick: token.tick,
      floor_price_btc: token.floor_price_btc,
      market_cap_btc: token.market_cap_btc,
      volume_24h_btc: token.volume_24h_btc,
      price_change_24h: token.price_change_24h,
      holder_count: token.holder_count,
      data_quality_score: token.data_quality_score,
      price_source: token.price_source
    }))
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
```

#### **SRC-20 Filtering & Sorting**
```typescript
// Frontend SRC-20 filter interface
interface SRC20FilterOptions {
  marketCapMin?: number;
  marketCapMax?: number;
  volumeMin?: number;
  priceChangeMin?: number;
  priceChangeMax?: number;
  holderCountMin?: number;
  sortBy: 'market_cap' | 'volume_24h' | 'price_change_24h' | 'holder_count';
  sortOrder: 'ASC' | 'DESC';
}
```

### Implementation Benefits

#### **Performance Improvements**
- **Before**: Multiple API calls to OpenStamp + StampScan for each page load
- **After**: Single database query with pre-aggregated data
- **Load Time**: Reduce from 3-5 seconds to <500ms
- **Reliability**: No dependency on external API availability

#### **Enhanced Features Enabled**
1. **Real-time Market Rankings**: Sort by market cap, volume, price change
2. **Advanced Filtering**: Filter by multiple criteria simultaneously  
3. **Historical Tracking**: Price and volume trends over time
4. **Cross-Marketplace Comparison**: See which exchange has best prices
5. **Data Quality Indicators**: Show reliability of price data

#### **Scalability Benefits**
- **API Rate Limits**: Batch background updates vs real-time calls
- **Cost Efficiency**: Reduce external API usage by 95%
- **User Experience**: Instant page loads regardless of external API status
- **Feature Development**: Enable advanced analytics without performance concerns

This comprehensive approach ensures that both stamps (art) and SRC-20 tokens benefit from the multi-source caching strategy, with appropriate optimizations for each asset type's unique characteristics. 