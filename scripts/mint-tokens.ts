import "dotenv/config";
import { readFileSync } from "node:fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  mintToChecked,
} from "@solana/spl-token";

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const walletPath = process.env.WALLET_PATH;
  const mintAddress = process.env.TOKEN_MINT;

  if (!rpcUrl || !walletPath || !mintAddress) {
    throw new Error("Set RPC_URL, WALLET_PATH and TOKEN_MINT in .env");
  }

  const walletBytes = JSON.parse(
    readFileSync(walletPath, "utf8")
  );

  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(walletBytes)
  );

  const connection = new Connection(rpcUrl, "confirmed");
  const mint = new PublicKey(mintAddress);

  const ata = await getAssociatedTokenAddress(
    mint,
    wallet.publicKey
  );

  const signature = await mintToChecked(
    connection,
    wallet,           // Pays transaction fees
    mint,             // Token whose supply increases
    ata,              // Account receiving the tokens
    wallet,           // Mint authority signing approval
    1_000_000_000n,    // 1,000 tokens in base units
    6                 // Expected mint decimals
  );

  console.log("Transaction signature:", signature);
  console.log(
    "Explorer:",
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  const tokenAccount = await getAccount(
    connection,
    ata,
    "confirmed"
  );

  console.log("Balance in base units:", tokenAccount.amount.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});