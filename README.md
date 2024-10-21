# BITCOIN STAMPS EXPLORER AND API

This is the API for https://stampchain.io/ and the open source block explorer
for Bitcoin Stamps. It is intended to be run concurrently with the Bitcoin
Stamps Indexer https://github.com/stampchain-io/btc_stamps

## Installation Instructions

### Prerequisites

- [Deno](https://deno.land/#installation) (Ensure you have Deno installed)

### Steps

1. **Clone the repository:**
   ```sh
   git clone https://github.com/stampchain-io/bitcoin-stamps-explorer.git
   cd bitcoin-stamps-explorer
   ```

2. **Run the project:**
   ```sh
   deno run -A main.ts
   ```

### Environment Variables

Ensure the following environment variables are set:

- `DB_USER`: The database user with read permissions.

### Additional Resources

- [Bitcoin Stamps Indexer Database](https://github.com/stampchain-io/btc_stamps)
- [API Documentation](https://stampchain.io/docs)
- [Bitcoin Stamps Discussion Board](https://github.com/orgs/stampchain-io/discussions)
