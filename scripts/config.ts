import "dotenv/config";
import { readFileSync } from "node:fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name} in .env`);
  }

  return value;
}

export async function loadConfig() {
  const connection = new Connection(
    requiredEnv("RPC_URL"),
    "confirmed"
  );

  // Verify the actual network before allowing a script to proceed.
  const genesisHash = await connection.getGenesisHash();

  const DEVNET_GENESIS_HASH =
    "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

  if (genesisHash !== DEVNET_GENESIS_HASH) {
    throw new Error("This assignment must run on Solana devnet");
  }

  const walletBytes = JSON.parse(
    readFileSync(requiredEnv("WALLET_PATH"), "utf8")
  );

  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(walletBytes)
  );

  const mint = new PublicKey(requiredEnv("TOKEN_MINT"));
  const recipient = new PublicKey(requiredEnv("RECIPIENT_ADDRESS"));

  if (wallet.publicKey.equals(recipient)) {
    throw new Error("Recipient must differ from the sender");
  }

  return { connection, wallet, mint, recipient };
}