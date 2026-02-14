#!/usr/bin/env python3
"""
Extract comprehensive seed data from production btc_stamps database.
Generates test-seed-data.sql with real data for all 21 test schema tables.

Uses the test variable values from Newman CI to ensure all test endpoints have data.
Only selects columns that exist in both production AND test schema.
"""

import pymysql
import sys
from datetime import datetime

# Production DB config (from .env)
DB_CONFIG = {
    "host": "3.81.158.147",
    "port": 3306,
    "user": "bitname",
    "password": "mMwuB+StpoS6JxPjEGaj3g==",
    "database": "btc_stamps",
    "connect_timeout": 30,
    "read_timeout": 60,
}

# Newman test variables - these drive what data we need
TEST_VARS = {
    "test_block": 820000,
    "test_stamp_id": 1384305,
    "test_cpid": "A888354448084788958",
    "test_address": "bc1qkqqre5xuqk60xtt93j297zgg7t6x0ul7gwjmv4",
    "test_tx_hash": "e94be2793462692ca8fea3a54dd90ff4b18735196a2bc426382c11959533c8ca",
    "test_src20_tick": "stamp",
    "test_cursed_id": -1832,
    "test_deploy_hash": "77fb147b72a551cf1e2f0b37dccf9982a1c25623a7fe8b4d5efaac566cf63fed",
    "test_tokenid": "U0FUT1NISU5BS0FNT1RP",
    "test_index": 1942,
    "test_tick": "stamp",
}

# Test schema column definitions - only these columns will be inserted
# Must match scripts/test-schema.sql exactly (derived from indexer/table_schema.sql)
TEST_SCHEMA_COLUMNS = {
    "blocks": ["block_index", "block_hash", "block_time", "previous_block_hash",
               "difficulty", "ledger_hash", "txlist_hash", "messages_hash", "indexed"],
    "transactions": ["tx_index", "tx_hash", "block_index", "block_hash", "block_time",
                     "source", "destination", "btc_amount", "fee", "fee_rate_sat_vb",
                     "data", "supported", "keyburn"],
    "StampTableV4": ["stamp", "block_index", "cpid", "asset_longname", "creator",
                     "divisible", "keyburn", "locked", "message_index", "stamp_base64",
                     "stamp_mimetype", "stamp_url", "supply", "block_time", "tx_hash",
                     "tx_index", "src_data", "ident", "stamp_hash", "is_btc_stamp",
                     "is_reissue", "file_hash", "is_valid_base64", "file_size_bytes"],
    "creator": ["address", "creator"],
    "SRC20Valid": ["id", "tx_hash", "tx_index", "block_index", "p", "op", "tick",
                   "tick_hash", "creator", "amt", "deci", "lim", "max", "destination",
                   "block_time", "status", "locked_amt", "locked_block",
                   "creator_bal", "destination_bal"],
    "balances": ["id", "address", "p", "tick", "tick_hash", "amt", "locked_amt",
                 "block_time", "last_update"],
    "src20_token_stats": ["tick", "total_minted", "holders_count", "last_updated"],
    "src20_metadata": ["tick", "tick_hash", "description", "x", "tg", "web", "email",
                       "img", "icon", "deploy_block_index", "deploy_tx_hash"],
    "src20_market_data": ["tick", "price_btc", "price_usd", "floor_price_btc",
                          "price_source_type", "market_cap_btc", "market_cap_usd",
                          "volume_24h_btc", "volume_7d_btc", "volume_30d_btc",
                          "total_volume_btc", "price_change_24h_percent",
                          "price_change_7d_percent", "price_change_30d_percent",
                          "holder_count", "circulating_supply", "max_supply",
                          "progress_percentage", "total_minted", "total_mints",
                          "primary_exchange", "exchange_sources",
                          "data_quality_score", "confidence_level", "last_updated",
                          "last_price_update", "update_frequency_minutes",
                          "created_at"],
    "SRC101": ["id", "tx_hash", "tx_index", "block_index", "p", "op", "name", "root",
               "tokenid_origin", "tokenid", "tokenid_utf8", "img", "description",
               "tick", "imglp", "imgf", "wla", "tick_hash", "deploy_hash", "creator",
               "pri", "dua", "idua", "coef", "lim", "mintstart", "mintend", "prim",
               "address_btc", "address_eth", "txt_data", "owner", "toaddress",
               "destination", "destination_nvalue", "block_time", "status"],
    "SRC101Valid": ["id", "tx_hash", "tx_index", "block_index", "p", "op", "name",
                    "root", "tokenid_origin", "tokenid", "tokenid_utf8", "img",
                    "description", "tick", "imglp", "imgf", "wla", "tick_hash",
                    "deploy_hash", "creator", "pri", "dua", "idua", "coef", "lim",
                    "mintstart", "mintend", "prim", "address_btc", "address_eth",
                    "txt_data", "owner", "toaddress", "destination",
                    "destination_nvalue", "block_time", "status"],
    "owners": ["index", "id", "p", "deploy_hash", "tokenid", "tokenid_utf8", "img",
               "preowner", "owner", "prim", "address_btc", "address_eth", "txt_data",
               "expire_timestamp", "last_update"],
    "recipients": ["id", "p", "deploy_hash", "address", "block_index"],
    "src101price": ["id", "len", "price", "deploy_hash", "block_index"],
    "collections": ["collection_id", "collection_name", "collection_description",
                    "collection_website", "collection_tg", "collection_x",
                    "collection_email", "collection_onchain"],
    "collection_creators": ["collection_id", "creator_address"],
    "collection_stamps": ["collection_id", "stamp"],
    "collection_market_data": ["collection_id", "floor_price_btc", "avg_price_btc",
                               "total_value_btc", "volume_24h_btc", "volume_7d_btc",
                               "volume_30d_btc", "total_volume_btc", "total_stamps",
                               "unique_holders", "listed_stamps", "sold_stamps_24h",
                               "last_updated", "created_at"],
    "stamp_market_data": ["cpid", "floor_price_btc", "recent_sale_price_btc",
                          "open_dispensers_count", "closed_dispensers_count",
                          "total_dispensers_count", "holder_count",
                          "unique_holder_count", "top_holder_percentage",
                          "holder_distribution_score", "volume_24h_btc",
                          "volume_7d_btc", "volume_30d_btc", "total_volume_btc",
                          "price_source", "volume_sources", "data_quality_score",
                          "confidence_level", "last_sale_tx_hash",
                          "last_sale_buyer_address", "last_sale_dispenser_address",
                          "last_sale_btc_amount", "last_sale_dispenser_tx_hash",
                          "activity_level", "last_activity_time", "last_updated",
                          "last_dispenser_block", "last_balance_block",
                          "last_price_update", "last_sale_block_index",
                          "update_frequency_minutes", "created_at"],
    "stamp_holder_cache": ["id", "cpid", "address", "quantity", "percentage",
                           "rank_position", "balance_source", "last_updated",
                           "last_tx_block"],
    "stamp_sales_history": ["tx_hash", "block_index", "block_time", "cpid",
                            "sale_type", "buyer_address", "seller_address",
                            "quantity", "btc_amount", "unit_price_sats",
                            "dispenser_tx_hash", "swap_contract_id", "platform",
                            "external_id", "data_source", "notes", "processed_at"],
}


def escape_sql(val):
    """Escape a value for SQL INSERT."""
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bytes):
        return f"X'{val.hex()}'"
    if isinstance(val, datetime):
        return f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'"
    s = str(val)
    # Treat the literal string 'null' as SQL NULL (production data quality issue)
    if s.lower() == "null":
        return "NULL"
    # Escape single quotes and backslashes
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def format_insert(table, columns, rows):
    """Format rows as REPLACE INTO statements."""
    if not rows:
        return f"-- No data found for {table}\n"

    col_list = ", ".join(f"`{c}`" for c in columns)
    lines = []
    lines.append(f"REPLACE INTO `{table}` ({col_list}) VALUES")
    value_rows = []
    for row in rows:
        vals = ", ".join(escape_sql(v) for v in row)
        value_rows.append(f"  ({vals})")
    lines.append(",\n".join(value_rows) + ";")
    return "\n".join(lines)


def get_prod_columns(cursor, table):
    """Get production column names for a table."""
    cursor.execute(f"SHOW COLUMNS FROM `{table}`")
    return [row[0] for row in cursor.fetchall()]


def build_select(table, prod_cols):
    """Build SELECT column list - only include columns in both prod and test schema."""
    test_cols = TEST_SCHEMA_COLUMNS.get(table)
    if not test_cols:
        return "*", prod_cols

    available = []
    for col in test_cols:
        if col in prod_cols:
            available.append(col)

    if not available:
        return "*", prod_cols

    select_clause = ", ".join(f"`{c}`" for c in available)
    return select_clause, available


def query_table(cursor, table, where_clause, params=(), limit=None):
    """Query a table with only test-schema columns."""
    prod_cols = get_prod_columns(cursor, table)
    select_clause, result_cols = build_select(table, prod_cols)

    sql = f"SELECT {select_clause} FROM `{table}`"
    if where_clause:
        sql += f" {where_clause}"
    if limit:
        sql += f" LIMIT {limit}"

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    return result_cols, rows


def query_union(cursor, table, queries):
    """Execute multiple queries as UNION and return deduplicated results."""
    prod_cols = get_prod_columns(cursor, table)
    select_clause, result_cols = build_select(table, prod_cols)

    parts = []
    all_params = []
    for where_clause, params in queries:
        part = f"(SELECT {select_clause} FROM `{table}` {where_clause})"
        parts.append(part)
        all_params.extend(params)

    sql = " UNION ".join(parts)
    cursor.execute(sql, tuple(all_params))
    rows = cursor.fetchall()
    return result_cols, rows


def extract_all(conn):
    """Extract seed data for all 20 tables."""
    cur = conn.cursor()
    sections = []

    # ============================================================
    # 1. BLOCKS
    # ============================================================
    print("Extracting blocks...")
    cols, rows = query_union(cur, "blocks", [
        ("WHERE block_index BETWEEN %s AND %s", (819990, 820010)),
        ("ORDER BY block_index DESC LIMIT 5", ()),
    ])
    sections.append(("blocks", cols, rows))
    print(f"  blocks: {len(rows)} rows")

    # ============================================================
    # 2. StampTableV4
    # ============================================================
    print("Extracting StampTableV4...")
    # First get cpids with recent sales
    cur.execute("SELECT DISTINCT cpid FROM stamp_sales_history ORDER BY block_time DESC LIMIT 20")
    sale_cpids = [r[0] for r in cur.fetchall()]

    stamp_queries = [
        ("WHERE stamp = %s", (TEST_VARS["test_stamp_id"],)),
        ("WHERE cpid = %s", (TEST_VARS["test_cpid"],)),
        ("WHERE tx_hash = %s", (TEST_VARS["test_tx_hash"],)),
        ("WHERE stamp = %s", (TEST_VARS["test_cursed_id"],)),
        ("WHERE block_index = %s LIMIT 10", (TEST_VARS["test_block"],)),
        ("WHERE stamp < 0 ORDER BY stamp DESC LIMIT 15", ()),
        ("WHERE stamp > 0 AND ident = 'STAMP' ORDER BY stamp DESC LIMIT 20", ()),
        ("WHERE stamp > 0 AND ident = 'SRC-721' ORDER BY stamp DESC LIMIT 5", ()),
        ("WHERE creator = %s LIMIT 10", (TEST_VARS["test_address"],)),
    ]
    if sale_cpids:
        placeholders = ",".join(["%s"] * len(sale_cpids))
        stamp_queries.append((f"WHERE cpid IN ({placeholders})", tuple(sale_cpids)))

    cols, rows = query_union(cur, "StampTableV4", stamp_queries)
    sections.append(("StampTableV4", cols, rows))
    print(f"  StampTableV4: {len(rows)} rows")

    # Collect cpids and creators for related data
    stamp_cpids = set()
    stamp_creators = set()
    stamp_tx_hashes = set()
    cpid_idx = cols.index("cpid") if "cpid" in cols else None
    creator_idx = cols.index("creator") if "creator" in cols else None
    tx_idx = cols.index("tx_hash") if "tx_hash" in cols else None
    for row in rows:
        if cpid_idx is not None:
            stamp_cpids.add(row[cpid_idx])
        if creator_idx is not None:
            stamp_creators.add(row[creator_idx])
        if tx_idx is not None:
            stamp_tx_hashes.add(row[tx_idx])

    # ============================================================
    # 3. CREATOR
    # ============================================================
    print("Extracting creator...")
    creator_queries = [("LIMIT 10", ())]
    if stamp_creators:
        ph = ",".join(["%s"] * len(stamp_creators))
        creator_queries.insert(0, (f"WHERE address IN ({ph})", tuple(stamp_creators)))
    cols, rows = query_union(cur, "creator", creator_queries)
    sections.append(("creator", cols, rows))
    print(f"  creator: {len(rows)} rows")

    # ============================================================
    # 4. TRANSACTIONS
    # ============================================================
    print("Extracting transactions...")
    tx_queries = [("WHERE block_index = %s LIMIT 10", (TEST_VARS["test_block"],))]
    if stamp_tx_hashes:
        ph = ",".join(["%s"] * len(stamp_tx_hashes))
        tx_queries.insert(0, (f"WHERE tx_hash IN ({ph})", tuple(stamp_tx_hashes)))
    cols, rows = query_union(cur, "transactions", tx_queries)
    sections.append(("transactions", cols, rows))
    print(f"  transactions: {len(rows)} rows")

    # ============================================================
    # 5. SRC20Valid
    # ============================================================
    print("Extracting SRC20Valid...")
    cols, rows = query_union(cur, "SRC20Valid", [
        ("WHERE tick = %s ORDER BY block_index DESC LIMIT 30", (TEST_VARS["test_src20_tick"],)),
        ("WHERE op = 'DEPLOY' AND tick = %s LIMIT 5", (TEST_VARS["test_src20_tick"],)),
        ("WHERE op = 'MINT' AND tick = %s LIMIT 10", (TEST_VARS["test_src20_tick"],)),
        ("WHERE op = 'TRANSFER' AND tick = %s LIMIT 10", (TEST_VARS["test_src20_tick"],)),
        ("WHERE block_index = %s LIMIT 10", (TEST_VARS["test_block"],)),
    ])
    sections.append(("SRC20Valid", cols, rows))
    print(f"  SRC20Valid: {len(rows)} rows")

    # ============================================================
    # 6. BALANCES
    # ============================================================
    print("Extracting balances...")
    cols, rows = query_union(cur, "balances", [
        ("WHERE address = %s LIMIT 20", (TEST_VARS["test_address"],)),
        ("WHERE tick = %s ORDER BY CAST(amt AS DECIMAL) DESC LIMIT 20",
         (TEST_VARS["test_src20_tick"],)),
    ])
    sections.append(("balances", cols, rows))
    print(f"  balances: {len(rows)} rows")

    # ============================================================
    # 7. SRC20_TOKEN_STATS
    # ============================================================
    print("Extracting src20_token_stats...")
    cols, rows = query_union(cur, "src20_token_stats", [
        ("WHERE tick = %s", (TEST_VARS["test_src20_tick"],)),
        ("ORDER BY holders_count DESC LIMIT 15", ()),
    ])
    sections.append(("src20_token_stats", cols, rows))
    print(f"  src20_token_stats: {len(rows)} rows")

    # ============================================================
    # 8. SRC20_METADATA
    # ============================================================
    print("Extracting src20_metadata...")
    cols, rows = query_union(cur, "src20_metadata", [
        ("WHERE tick = %s", (TEST_VARS["test_src20_tick"],)),
        ("ORDER BY deploy_block_index DESC LIMIT 20", ()),
    ])
    sections.append(("src20_metadata", cols, rows))
    print(f"  src20_metadata: {len(rows)} rows")

    # ============================================================
    # 9. SRC20_MARKET_DATA
    # ============================================================
    print("Extracting src20_market_data...")
    cols, rows = query_union(cur, "src20_market_data", [
        ("WHERE tick = %s", (TEST_VARS["test_src20_tick"],)),
        ("ORDER BY market_cap_btc DESC LIMIT 10", ()),
    ])
    sections.append(("src20_market_data", cols, rows))
    print(f"  src20_market_data: {len(rows)} rows")

    # ============================================================
    # 9. SRC101Valid
    # ============================================================
    print("Extracting SRC101Valid...")
    cols, rows = query_union(cur, "SRC101Valid", [
        ("WHERE deploy_hash = %s LIMIT 20", (TEST_VARS["test_deploy_hash"],)),
        ("WHERE tokenid = %s LIMIT 10", (TEST_VARS["test_tokenid"],)),
        ("WHERE op = 'DEPLOY' LIMIT 10", ()),
        ("WHERE op = 'MINT' LIMIT 10", ()),
        ("WHERE op = 'TRANSFER' LIMIT 5", ()),
    ])
    sections.append(("SRC101Valid", cols, rows))
    print(f"  SRC101Valid: {len(rows)} rows")

    # Collect deploy_hashes
    deploy_hashes = set()
    if rows:
        dh_idx = cols.index("deploy_hash") if "deploy_hash" in cols else None
        if dh_idx is not None:
            for row in rows:
                if row[dh_idx]:
                    deploy_hashes.add(row[dh_idx])

    # ============================================================
    # 10. SRC101
    # ============================================================
    print("Extracting SRC101...")
    cols, rows = query_union(cur, "SRC101", [
        ("WHERE deploy_hash = %s LIMIT 20", (TEST_VARS["test_deploy_hash"],)),
        ("WHERE tokenid = %s LIMIT 10", (TEST_VARS["test_tokenid"],)),
        ("WHERE op = 'DEPLOY' LIMIT 10", ()),
        ("WHERE op = 'MINT' LIMIT 10", ()),
    ])
    sections.append(("SRC101", cols, rows))
    print(f"  SRC101: {len(rows)} rows")

    # ============================================================
    # 11. SRC101PRICE
    # ============================================================
    print("Extracting src101price...")
    price_queries = [("LIMIT 20", ())]
    if deploy_hashes:
        ph = ",".join(["%s"] * len(deploy_hashes))
        price_queries.insert(0, (f"WHERE deploy_hash IN ({ph})", tuple(deploy_hashes)))
    cols, rows = query_union(cur, "src101price", price_queries)
    sections.append(("src101price", cols, rows))
    print(f"  src101price: {len(rows)} rows")

    # ============================================================
    # 12. RECIPIENTS
    # ============================================================
    print("Extracting recipients...")
    recip_queries = [("LIMIT 20", ())]
    if deploy_hashes:
        ph = ",".join(["%s"] * len(deploy_hashes))
        recip_queries.insert(0, (f"WHERE deploy_hash IN ({ph})", tuple(deploy_hashes)))
    cols, rows = query_union(cur, "recipients", recip_queries)
    sections.append(("recipients", cols, rows))
    print(f"  recipients: {len(rows)} rows")

    # ============================================================
    # 13. OWNERS
    # ============================================================
    print("Extracting owners...")
    owner_queries = [("LIMIT 10", ())]
    if deploy_hashes:
        ph = ",".join(["%s"] * len(deploy_hashes))
        owner_queries.insert(0, (f"WHERE deploy_hash IN ({ph}) LIMIT 30", tuple(deploy_hashes)))
    owner_queries.append(("WHERE tokenid = %s LIMIT 10", (TEST_VARS["test_tokenid"],)))
    cols, rows = query_union(cur, "owners", owner_queries)
    sections.append(("owners", cols, rows))
    print(f"  owners: {len(rows)} rows")

    # ============================================================
    # 14. COLLECTIONS (all 66 rows)
    # ============================================================
    print("Extracting collections...")
    cols, rows = query_table(cur, "collections", "")
    sections.append(("collections", cols, rows))
    print(f"  collections: {len(rows)} rows")

    # ============================================================
    # 15. COLLECTION_CREATORS (all 20 rows)
    # ============================================================
    print("Extracting collection_creators...")
    cols, rows = query_table(cur, "collection_creators", "")
    sections.append(("collection_creators", cols, rows))
    print(f"  collection_creators: {len(rows)} rows")

    # ============================================================
    # 16. COLLECTION_STAMPS (sample)
    # ============================================================
    print("Extracting collection_stamps...")
    prod_cols = get_prod_columns(cur, "collection_stamps")
    _, result_cols = build_select("collection_stamps", prod_cols)
    # Use qualified column names to avoid ambiguity
    qualified_select = ", ".join(f"cs.`{c}`" for c in result_cols)
    cur.execute(f"""
        SELECT {qualified_select} FROM collection_stamps cs
        INNER JOIN (
            SELECT collection_id, stamp,
            ROW_NUMBER() OVER (PARTITION BY collection_id ORDER BY stamp) as rn
            FROM collection_stamps
        ) ranked ON cs.collection_id = ranked.collection_id
            AND cs.stamp = ranked.stamp
        WHERE ranked.rn <= 5
    """)
    rows = cur.fetchall()
    sections.append(("collection_stamps", result_cols, rows))
    print(f"  collection_stamps: {len(rows)} rows")

    # ============================================================
    # 17. COLLECTION_MARKET_DATA (all 66 rows)
    # ============================================================
    print("Extracting collection_market_data...")
    cols, rows = query_table(cur, "collection_market_data", "")
    sections.append(("collection_market_data", cols, rows))
    print(f"  collection_market_data: {len(rows)} rows")

    # ============================================================
    # 18. STAMP_MARKET_DATA
    # ============================================================
    print("Extracting stamp_market_data...")
    smd_queries = [
        ("WHERE activity_level = 'high' ORDER BY last_updated DESC LIMIT 15", ()),
        ("WHERE floor_price_btc > 0 ORDER BY floor_price_btc DESC LIMIT 10", ()),
    ]
    if stamp_cpids:
        ph = ",".join(["%s"] * len(stamp_cpids))
        smd_queries.insert(0, (f"WHERE cpid IN ({ph})", tuple(stamp_cpids)))
    cols, rows = query_union(cur, "stamp_market_data", smd_queries)
    sections.append(("stamp_market_data", cols, rows))
    print(f"  stamp_market_data: {len(rows)} rows")

    # ============================================================
    # 19. STAMP_HOLDER_CACHE
    # ============================================================
    print("Extracting stamp_holder_cache...")
    shc_queries = [("ORDER BY id DESC LIMIT 20", ())]
    if stamp_cpids:
        ph = ",".join(["%s"] * len(stamp_cpids))
        shc_queries.insert(0, (f"WHERE cpid IN ({ph}) LIMIT 30", tuple(stamp_cpids)))
    cols, rows = query_union(cur, "stamp_holder_cache", shc_queries)
    sections.append(("stamp_holder_cache", cols, rows))
    print(f"  stamp_holder_cache: {len(rows)} rows")

    # ============================================================
    # 20. STAMP_SALES_HISTORY (CRITICAL for Recent Sales endpoint)
    # ============================================================
    print("Extracting stamp_sales_history...")
    ssh_queries = [
        ("ORDER BY block_time DESC LIMIT 50", ()),
    ]
    if stamp_cpids:
        ph = ",".join(["%s"] * len(stamp_cpids))
        ssh_queries.insert(0, (f"WHERE cpid IN ({ph})", tuple(stamp_cpids)))
    cols, rows = query_union(cur, "stamp_sales_history", ssh_queries)
    sections.append(("stamp_sales_history", cols, rows))
    print(f"  stamp_sales_history: {len(rows)} rows")

    return sections


def generate_sql(sections):
    """Generate the full SQL file."""
    lines = []
    lines.append("-- BTCStampsExplorer Test Seed Data")
    lines.append("-- Auto-generated from production database")
    lines.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("-- Source: btc_stamps production database")
    lines.append("--")
    lines.append("-- This file contains real production data sampled for comprehensive")
    lines.append("-- Newman API test coverage. All 21 test schema tables are populated.")
    lines.append("--")
    lines.append("-- Test variables this data supports:")
    for key, val in TEST_VARS.items():
        lines.append(f"--   {key} = {val}")
    lines.append("")
    lines.append("SET FOREIGN_KEY_CHECKS = 0;")
    lines.append("")

    for table, cols, rows in sections:
        lines.append(f"-- ============================================================")
        lines.append(f"-- {table} ({len(rows)} rows)")
        lines.append(f"-- ============================================================")
        lines.append("")
        if rows:
            lines.append(format_insert(table, cols, rows))
        else:
            lines.append(f"-- No data found for {table}")
        lines.append("")

    lines.append("SET FOREIGN_KEY_CHECKS = 1;")
    lines.append("")
    lines.append("-- ============================================================")
    lines.append("-- Seed data complete")
    lines.append("-- ============================================================")

    return "\n".join(lines)


def main():
    print("Connecting to production database...")
    conn = pymysql.connect(**DB_CONFIG)
    print("Connected!")

    try:
        sections = extract_all(conn)

        print("\nGenerating SQL...")
        sql = generate_sql(sections)

        output_path = "scripts/test-seed-data.sql"
        with open(output_path, "w") as f:
            f.write(sql)

        total_rows = sum(len(rows) for _, _, rows in sections)
        print(f"\nSeed data written to {output_path}")
        print(f"Total: {total_rows} rows across {len(sections)} tables")

        print("\nTable summary:")
        for table, cols, rows in sections:
            status = f"{len(rows)} rows ({len(cols)} cols)" if rows else "EMPTY"
            print(f"  {table}: {status}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
