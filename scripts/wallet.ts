import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

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

  console.log("Wallet loaded:", wallet.publicKey.toBase58());
  console.log("Requesting balance from:", rpcUrl);

  const connection = new Connection(rpcUrl, "confirmed");
  const balance = await connection.getBalance(wallet.publicKey);

  console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});