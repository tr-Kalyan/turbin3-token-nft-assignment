import "dotenv/config";
import { readFileSync } from "node:fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

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

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey
  );

  console.log("Token mint:", tokenAccount.mint.toBase58());
  console.log("Token owner:", tokenAccount.owner.toBase58());
  console.log("ATA address:", tokenAccount.address.toBase58());
  console.log("Balance in base units:", tokenAccount.amount.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});