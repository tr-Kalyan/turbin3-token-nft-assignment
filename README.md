# Turbin3 Token and NFT Assignment

A TypeScript project demonstrating SPL token operations and the Metaplex Core NFT lifecycle on Solana devnet.

## Completed tasks

- Created an SPL token mint with 6 decimals.
- Created associated token accounts.
- Minted 1,000 tokens and transferred 50 to a second wallet.
- Created a Metaplex Core NFT.
- Updated its on-chain name and metadata URI.
- Transferred ownership to a second wallet.
- Burned the NFT with the new owner's signature and measured lamport recovery.

## Setup

Requirements: Node.js 22+, npm, Git and Solana CLI.

```bash
npm ci
```

Create a local `.env` file:

```env
RPC_URL=https://api.devnet.solana.com
WALLET_PATH=/absolute/path/to/your/devnet-wallet.json
TOKEN_MINT=YOUR_DEVNET_MINT_ADDRESS
RECIPIENT_ADDRESS=YOUR_RECIPIENT_PUBLIC_ADDRESS
NFT_URI=https://raw.githubusercontent.com/tr-Kalyan/turbin3-token-nft-assignment/main/assets/metadata.json
UPDATED_NFT_URI=https://raw.githubusercontent.com/tr-Kalyan/turbin3-token-nft-assignment/main/assets/metadata-updated.json
```

The wallet must have devnet SOL for account creation and fees.

For the burn script, the recipient keypair must be available at `wallets/recipient.json` and match `RECIPIENT_ADDRESS`.

Private keys, wallet files and `.env` are excluded from Git.

## Scripts

Check types:

```bash
npm run check
```

Read the configured wallet's balance:

```bash
npm run wallet
```

SPL token operations:

```bash
npx tsx scripts/create-mint.ts
# Set TOKEN_MINT in .env to the printed mint address.

npx tsx scripts/create-ata.ts
npx tsx scripts/mint-tokens.ts
npx tsx scripts/transfer-tokens.ts
```

Core NFT operations:

```bash
npx tsx scripts/create-nft.ts
npx tsx scripts/update-nft.ts
npx tsx scripts/transfer-nft.ts
npx tsx scripts/burn-nft.ts
```

These scripts send real devnet transactions. Mint creation generates a new mint on each successful run, and minting tokens increases supply each time. Inspect transaction results before retrying after an error.

NFT scripts use the asset address recorded in `nft-result.json`. The completed demonstration NFT has already been burned; its lifecycle cannot be rerun. To create your own demonstration, use a fresh working copy without the existing NFT result files.

## Devnet addresses

| Item | Address |
|---|---|
| Original wallet | `6hMkxkhp9seNsG5bjDMGcgvmgVzsqUVyDBdCd4JFoEA` |
| Recipient wallet | `6AhnETMDpaiZPRCzbMjsFPaPLZRc9QTPUjLDP5rXijqK` |
| SPL mint | `H2CYwdbsJjFABR2bLRqDSMTQvfYK2rieHQXerSPT7Hbr` |
| Sender ATA | `BDvcZmjpXx7TJfkH992n5XXiacWiqUYn4CZHfAqXhREX` |
| Recipient ATA | `E6tiQJGQrsDhbT9GhjkrJxEsYQYj2RXYCeA6Vk7RKFMX` |
| Core asset, now burned | `4jYekTUT5WpJ4cL7U45JfbskXGYdr21bmtoDRFPKU4QY` |

## Transaction evidence

| Operation | Explorer |
|---|---|
| Mint 1,000 SPL tokens | [Transaction](https://explorer.solana.com/tx/Zj24e7889d59RpMunjt2RTfqJQubiqNvVkosQWjnf8RiKRPECwEw7iXTQgJokRXTgz4VMaQP5utGxQ6CbNaiF37?cluster=devnet) |
| Transfer 50 SPL tokens | [Transaction](https://explorer.solana.com/tx/546PPmgEGJWcyTVucECF8fhtFhiHW9QMyPFfAwnEBbTzqp4Bpau8pKnbDnbWsDyER5yZYWyaXz5kDUvFSMcV2iTQ?cluster=devnet) |
| Create Core NFT | [Transaction](https://explorer.solana.com/tx/5gQuTZuFhwqbT7svsGnwCCnokZx7DTWCpaHPaQGsRDsLSH6LTiDCEnNfTu5E6kXNfKtJmmwkzq4c721Rpb6F545T?cluster=devnet) |
| Update name and URI | [Transaction](https://explorer.solana.com/tx/5Sr6CbMQFnJwxS8XbFeXWerB8L2tjNUT9T2p719usUdn6jPdup5jvLJExMFCz2ZebDpSxwHn4K18quHbUPMdBnBU?cluster=devnet) |
| Transfer Core NFT | [Transaction](https://explorer.solana.com/tx/1RYs8XtCtLQKiY2iJ7mMRWfCfaCdDXzU6euzkNAcsqjC8h1kxZkKCSvQnjCQVo8RxPubGXRg6gwzu3s5Qhg5Lj6?cluster=devnet) |
| Burn Core NFT | [Transaction](https://explorer.solana.com/tx/47Fy9jfbXFKLyAbjFzQe1gXuzmKjbTaQKJiWXQXPVxWuYxLRgQxAN6DGEyPBYtBpDCzB4SjZvy89J5oWoYmxj9MX?cluster=devnet) |

Additional evidence is recorded in `evidence.json` and the `nft-*-result.json` files.

## Verified results

- SPL sender balance after transfer: 950 tokens.
- SPL recipient balance after transfer: 50 tokens.
- NFT name updated to `Kalyan's Turbin3 Builder NFT V2`.
- NFT ownership transferred to the recipient wallet.
- Burned asset verified as a one-byte zeroed account marker.
- Asset account lamport decrease during burn: 1,071,880 lamports, or 0.00107188 SOL.
- Remaining asset account balance: 2,155,320 lamports.

The lamport decrease is measured separately from transaction fees. The burn did not reclaim the entire asset account balance.

## What I learned

An SPL mint defines a token's supply, decimals and authorities. Individual balances live in token accounts. An ATA is the conventional deterministic token account for a wallet and mint under a particular token program.

Core NFTs use asset accounts rather than an SPL mint and ATA for each NFT. NFT ownership and update authority are separate roles.

The fee payer and operation authority can also be different wallets. During the burn, the recipient authorized destruction as the current owner, while the original wallet paid fees and received refundable rent. Explicitly passing both authority and payer resolved an initial simulation failure.

Updating a metadata URI changes the on-chain reference. It does not upload or modify the hosted JSON itself. This assignment uses mutable GitHub-hosted metadata.

## Limitations

This is an educational devnet project. Earlier SPL scripts duplicate wallet setup; later scripts use shared configuration with devnet verification. Retry protection varies by script.

npm audit reported dependency vulnerabilities during setup. They have not yet been fully assessed or resolved; no forced dependency downgrade or major upgrade was applied.