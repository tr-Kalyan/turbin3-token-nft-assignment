import "dotenv/config";
import { readFileSync } from "node:fs";
import { Connection, Keypair } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const walletPath = process.env.WALLET_PATH;

  if (!rpcUrl || !walletPath) {
    throw new Error("Set RPC_URL and WALLET_PATH in .env");
  }

  const walletBytes = JSON.parse(
    readFileSync(walletPath, "utf8")
  );

  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(walletBytes)
  );

  const connection = new Connection(rpcUrl, "confirmed");

  console.log("Wallet:", wallet.publicKey.toBase58());
  console.log("Creating token mint...");

  const mint = await createMint(
    connection,
    wallet,
    wallet.publicKey,
    null,
    6
  );

  console.log("Token mint address:", mint.toBase58());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});