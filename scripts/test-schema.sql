-- BTCStampsExplorer Test Database Schema
-- MySQL 8.0 compatible DDL for testing
-- Derived from repository query patterns in server/database/
-- Created: 2026-02-13

-- ============================================================
-- Drop existing tables (idempotent execution)
-- ============================================================

DROP TABLE IF EXISTS stamp_sales_history;
DROP TABLE IF EXISTS stamp_market_data;
DROP TABLE IF EXISTS stamp_holder_cache;
DROP TABLE IF EXISTS collection_market_data;
DROP TABLE IF EXISTS collection_stamps;
DROP TABLE IF EXISTS collection_creators;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS src101_owners;
DROP TABLE IF EXISTS src101_recipients;
DROP TABLE IF EXISTS src101_price;
DROP TABLE IF EXISTS src101_all;
DROP TABLE IF EXISTS src101;
DROP TABLE IF EXISTS src20_market_data;
DROP TABLE IF EXISTS src20_balance;
DROP TABLE IF EXISTS src20_token_stats;
DROP TABLE IF EXISTS src20;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS creator;
DROP TABLE IF EXISTS stamps;
DROP TABLE IF EXISTS blocks;

-- ============================================================
-- Core Tables
-- ============================================================

-- Blocks table: Bitcoin block data
CREATE TABLE blocks (
    block_index INT NOT NULL,
    block_time INT NOT NULL,
    block_hash VARCHAR(64) NOT NULL,
    previous_block_hash VARCHAR(64),
    ledger_hash VARCHAR(64),
    txlist_hash VARCHAR(64),
    messages_hash VARCHAR(64),
    PRIMARY KEY (block_index),
    UNIQUE KEY idx_block_hash (block_hash),
    INDEX idx_block_time (block_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stamps table: Main stamp data
CREATE TABLE stamps (
    stamp INT NOT NULL,
    block_index INT NOT NULL,
    cpid VARCHAR(255) NOT NULL,
    creator VARCHAR(255) NOT NULL,
    divisible TINYINT(1) DEFAULT 0,
    keyburn TINYINT(1) DEFAULT 0,
    locked TINYINT(1) DEFAULT 0,
    stamp_url VARCHAR(512),
    stamp_mimetype VARCHAR(255),
    stamp_base64 LONGTEXT,
    supply BIGINT UNSIGNED DEFAULT 0,
    block_time INT NOT NULL,
    tx_hash VARCHAR(64) NOT NULL,
    tx_index INT NOT NULL,
    ident VARCHAR(50),
    stamp_hash VARCHAR(64),
    file_hash VARCHAR(64),
    file_size_bytes INT,
    asset_longname VARCHAR(255),
    message_index INT,
    src_data TEXT,
    is_btc_stamp TINYINT(1) DEFAULT 1,
    is_reissue TINYINT(1) DEFAULT 0,
    is_valid_base64 TINYINT(1) DEFAULT 1,
    block_hash VARCHAR(64),
    destination VARCHAR(255),
    PRIMARY KEY (stamp),
    UNIQUE KEY idx_tx_hash (tx_hash),
    UNIQUE KEY idx_cpid (cpid),
    INDEX idx_block_index (block_index),
    INDEX idx_creator (creator),
    INDEX idx_stamp_hash (stamp_hash),
    INDEX idx_ident (ident),
    INDEX idx_block_time (block_time),
    INDEX idx_file_size (file_size_bytes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Creator table: Creator name mappings
CREATE TABLE creator (
    address VARCHAR(255) NOT NULL,
    creator VARCHAR(255),
    PRIMARY KEY (address),
    INDEX idx_creator_name (creator)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions table: Transaction metadata
CREATE TABLE transactions (
    tx_hash VARCHAR(64) NOT NULL,
    fee_rate_sat_vb DECIMAL(10,2),
    fee BIGINT,
    block_index INT,
    PRIMARY KEY (tx_hash),
    INDEX idx_block_index (block_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SRC-20 Tables
-- ============================================================

-- SRC-20 table: SRC-20 token operations
CREATE TABLE src20 (
    tx_hash VARCHAR(64) NOT NULL,
    block_index INT NOT NULL,
    p VARCHAR(50),
    op VARCHAR(50),
    tick VARCHAR(255),
    creator VARCHAR(255),
    amt VARCHAR(255),
    deci VARCHAR(50),
    lim VARCHAR(255),
    max VARCHAR(255),
    destination VARCHAR(255),
    block_time INT NOT NULL,
    tx_index INT NOT NULL,
    PRIMARY KEY (tx_hash, tx_index),
    INDEX idx_block_index (block_index),
    INDEX idx_tick (tick),
    INDEX idx_op (op),
    INDEX idx_creator (creator),
    INDEX idx_destination (destination),
    INDEX idx_tick_op (tick, op)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SRC-20 balance table: Token balances per address
CREATE TABLE src20_balance (
    address VARCHAR(255) NOT NULL,
    p VARCHAR(50),
    tick VARCHAR(255) NOT NULL,
    amt VARCHAR(255) NOT NULL DEFAULT '0',
    block_time INT,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (address, tick),
    INDEX idx_tick (tick),
    INDEX idx_amt (amt(50)),
    INDEX idx_last_update (last_update)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SRC-20 token stats table: Aggregated token statistics
CREATE TABLE src20_token_stats (
    tick VARCHAR(255) NOT NULL,
    total_minted VARCHAR(255) DEFAULT '0',
    holders_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tick)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SRC-20 market data table: Market metrics for SRC-20 tokens
CREATE TABLE src20_market_data (
    tick VARCHAR(255) NOT NULL,
    price_btc DECIMAL(20,8) DEFAULT 0,
    price_usd DECIMAL(20,8) DEFAULT 0,
    floor_price_btc DECIMAL(20,8) DEFAULT 0,
    market_cap_btc DECIMAL(20,8) DEFAULT 0,
    market_cap_usd DECIMAL(20,8) DEFAULT 0,
    volume_24h_btc DECIMAL(16,8) DEFAULT 0,
    volume_7d_btc DECIMAL(16,8) DEFAULT 0,
    volume_30d_btc DECIMAL(16,8) DEFAULT 0,
    total_volume_btc DECIMAL(20,8) DEFAULT 0,
    holder_count INT DEFAULT 0,
    circulating_supply VARCHAR(255) DEFAULT '0',
    price_change_24h_percent DECIMAL(10,2) DEFAULT 0,
    price_change_7d_percent DECIMAL(10,2) DEFAULT 0,
    price_change_30d_percent DECIMAL(10,2) DEFAULT 0,
    primary_exchange VARCHAR(100),
    exchange_sources JSON,
    data_quality_score DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_minted VARCHAR(255) DEFAULT '0',
    total_mints INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    price_source_type VARCHAR(50),
    change_24h DECIMAL(10,2) DEFAULT 0,
    change_7d DECIMAL(10,2) DEFAULT 0,
    PRIMARY KEY (tick),
    INDEX idx_market_cap (market_cap_btc),
    INDEX idx_volume_24h (volume_24h_btc),
    INDEX idx_price_change (price_change_24h_percent),
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SRC-101 Tables
-- ============================================================

-- SRC-101 table: Valid SRC-101 operations
CREATE TABLE src101 (
    tx_hash VARCHAR(64) NOT NULL,
    block_index INT NOT NULL,
    p VARCHAR(50),
    op VARCHAR(50),
    root VARCHAR(255),
    name VARCHAR(255),
    tokenid VARCHAR(255),
    tokenid_utf8 VARCHAR(255),
    tick_hash VARCHAR(64),
    description TEXT,
    tick VARCHAR(255),
    wla VARCHAR(255),
    imglp VARCHAR(512),
    imgf VARCHAR(512),
    deploy_hash VARCHAR(64),
    creator VARCHAR(255),
    pri DECIMAL(20,8),
    dua BIGINT,
    lim VARCHAR(255),
    mintstart BIGINT,
    mintend BIGINT,
    owner VARCHAR(255),
    toaddress VARCHAR(255),
    destination VARCHAR(255),
    block_time INT NOT NULL,
    tx_index INT NOT NULL,
    PRIMARY KEY (tx_hash),
    INDEX idx_block_index (block_index),
    INDEX idx_tick (tick),
    INDEX idx_op (op),
    INDEX idx_deploy_hash (deploy_hash),
    INDEX idx_creator (creator)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SRC-101 all table: All SRC-101 operations (including invalid)
CREATE TABLE src101_all (
    tx_hash VARCHAR(64) NOT NULL,
    block_index INT NOT NULL,
    p VARCHAR(50),
    op VARCHAR(50),
    root VARCHAR(255),
    name VARCHAR(255),
    tokenid_origin VARCHAR(255),
    tokenid VARCHAR(255),
    tokenid_utf8 VARCHAR(255),
    tick_hash VARCHAR(64),
    description TEXT,
    tick VARCHAR(255),
    wla VARCHAR(255),
    imglp VARCHAR(512),
    imgf VARCHAR(512),
    deploy_hash VARCHAR(64),
    creator VARCHAR(255),
    pri DECIMAL(20,8),
    dua BIGINT,
    lim VARCHAR(255),
    coef DECIMAL(10,2),
    mintstart BIGINT,
    mintend BIGINT,
    owner VARCHAR(255),
    toaddress VARCHAR(255),
    destination VARCHAR(255),
    destination_nvalue BIGINT,
    block_time INT NOT NULL,
    tx_index INT NOT NULL,
    status VARCHAR(255),
    PRIMARY KEY (tx_hash),
    INDEX idx_block_index (block_index),
    INDEX idx_tick (tick),
    INDEX idx_op (op),
    INDEX idx_deploy_hash (deploy_hash),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SRC-101 price table: Pricing tiers
CREATE TABLE src101_price (
    deploy_hash VARCHAR(64) NOT NULL,
    len INT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    PRIMARY KEY (deploy_hash, len)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SRC-101 recipients table: Whitelist addresses
CREATE TABLE src101_recipients (
    deploy_hash VARCHAR(64) NOT NULL,
    address VARCHAR(255) NOT NULL,
    PRIMARY KEY (deploy_hash, address),
    INDEX idx_address (address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SRC-101 owners table: Token ownership
CREATE TABLE src101_owners (
    id INT AUTO_INCREMENT,
    `index` INT,
    deploy_hash VARCHAR(64) NOT NULL,
    p VARCHAR(50),
    tokenid VARCHAR(255) NOT NULL,
    tokenid_utf8 VARCHAR(255),
    owner VARCHAR(255) NOT NULL,
    txt_data TEXT,
    expire_timestamp BIGINT,
    img VARCHAR(512),
    address_btc VARCHAR(255),
    address_eth VARCHAR(255),
    prim TINYINT(1) DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_deploy_hash (deploy_hash),
    INDEX idx_owner (owner),
    INDEX idx_tokenid (tokenid(255)),
    INDEX idx_address_btc (address_btc),
    INDEX idx_prim (prim),
    INDEX idx_expire (expire_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Collection Tables
-- ============================================================

-- Collections table: Collection metadata
CREATE TABLE collections (
    collection_id BINARY(16) NOT NULL,
    collection_name VARCHAR(255) NOT NULL,
    collection_description TEXT,
    PRIMARY KEY (collection_id),
    UNIQUE KEY idx_collection_name (collection_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collection creators table: Many-to-many relationship
CREATE TABLE collection_creators (
    collection_id BINARY(16) NOT NULL,
    creator_address VARCHAR(255) NOT NULL,
    PRIMARY KEY (collection_id, creator_address),
    INDEX idx_creator_address (creator_address),
    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collection stamps table: Stamps belonging to collections
CREATE TABLE collection_stamps (
    collection_id BINARY(16) NOT NULL,
    stamp INT NOT NULL,
    PRIMARY KEY (collection_id, stamp),
    INDEX idx_stamp (stamp),
    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collection market data table: Aggregated collection metrics
CREATE TABLE collection_market_data (
    collection_id BINARY(16) NOT NULL,
    floor_price_btc DECIMAL(20,8),
    avg_price_btc DECIMAL(20,8),
    total_value_btc DECIMAL(20,8) DEFAULT 0,
    volume_24h_btc DECIMAL(16,8) DEFAULT 0,
    volume_7d_btc DECIMAL(16,8) DEFAULT 0,
    volume_30d_btc DECIMAL(16,8) DEFAULT 0,
    total_volume_btc DECIMAL(20,8) DEFAULT 0,
    total_stamps INT DEFAULT 0,
    unique_holders INT DEFAULT 0,
    listed_stamps INT DEFAULT 0,
    sold_stamps_24h INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id),
    INDEX idx_floor_price (floor_price_btc),
    INDEX idx_volume_24h (volume_24h_btc),
    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Market Data Tables
-- ============================================================

-- Stamp market data table: Individual stamp market metrics
CREATE TABLE stamp_market_data (
    cpid VARCHAR(255) NOT NULL,
    floor_price_btc DECIMAL(20,8),
    recent_sale_price_btc DECIMAL(20,8),
    open_dispensers_count INT DEFAULT 0,
    closed_dispensers_count INT DEFAULT 0,
    total_dispensers_count INT DEFAULT 0,
    holder_count INT DEFAULT 0,
    unique_holder_count INT DEFAULT 0,
    top_holder_percentage DECIMAL(5,2) DEFAULT 0,
    holder_distribution_score DECIMAL(5,2) DEFAULT 0,
    volume_24h_btc DECIMAL(16,8) DEFAULT 0,
    volume_7d_btc DECIMAL(16,8) DEFAULT 0,
    volume_30d_btc DECIMAL(16,8) DEFAULT 0,
    total_volume_btc DECIMAL(20,8) DEFAULT 0,
    price_source VARCHAR(100),
    volume_sources JSON,
    data_quality_score DECIMAL(5,2) DEFAULT 0,
    confidence_level DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_price_update TIMESTAMP,
    update_frequency_minutes INT DEFAULT 60,
    last_sale_tx_hash VARCHAR(64),
    last_sale_buyer_address VARCHAR(255),
    last_sale_dispenser_address VARCHAR(255),
    last_sale_btc_amount DECIMAL(20,8),
    last_sale_dispenser_tx_hash VARCHAR(64),
    last_sale_block_index INT,
    activity_level VARCHAR(50),
    last_activity_time TIMESTAMP,
    PRIMARY KEY (cpid),
    INDEX idx_floor_price (floor_price_btc),
    INDEX idx_volume_24h (volume_24h_btc),
    INDEX idx_holder_count (holder_count),
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stamp holder cache table: Cached holder rankings
CREATE TABLE stamp_holder_cache (
    id INT AUTO_INCREMENT,
    cpid VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    quantity DECIMAL(30,8) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    rank_position INT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cpid (cpid),
    INDEX idx_address (address),
    INDEX idx_rank (rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stamp sales history table: Recent sales tracking
CREATE TABLE stamp_sales_history (
    cpid VARCHAR(255) NOT NULL,
    btc_amount DECIMAL(20,8) NOT NULL,
    unit_price_sats BIGINT NOT NULL,
    quantity BIGINT DEFAULT 1,
    buyer_address VARCHAR(255),
    seller_address VARCHAR(255),
    block_time INT NOT NULL,
    tx_hash VARCHAR(64) NOT NULL,
    block_index INT NOT NULL,
    sale_type VARCHAR(50),
    PRIMARY KEY (tx_hash, cpid),
    INDEX idx_cpid (cpid),
    INDEX idx_block_time (block_time),
    INDEX idx_buyer (buyer_address),
    INDEX idx_seller (seller_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Schema creation complete
-- ============================================================
