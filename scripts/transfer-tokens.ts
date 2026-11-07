import {
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
import { loadConfig } from "./config.js";

async function main() {
  const { connection, wallet, mint, recipient } = await loadConfig();

  const mintInfo = await getMint(connection, mint);

  if (mintInfo.decimals !== 6) {
    throw new Error("Expected a mint with 6 decimals");
  }

  const senderATA = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey
  );

  const recipientATA = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    recipient
  );

  const amount = 50_000_000n; // 50 tokens with 6 decimals

  // This assignment expects exactly one transfer from the initial balances.
  if (
    senderATA.amount !== 1_000_000_000n ||
    recipientATA.amount !== 0n
  ) {
    throw new Error(
      "Expected sender balance of 1,000 and recipient balance of 0. " +
      "Inspect balances before retrying."
    );
  }

  console.log("Sender ATA:", senderATA.address.toBase58());
  console.log("Recipient ATA:", recipientATA.address.toBase58());

  const signature = await transferChecked(
    connection,
    wallet,                  // Pays transaction fees
    senderATA.address,       // Source token account
    mint,                    // Token mint
    recipientATA.address,    // Destination token account
    wallet,                  // Source account authority
    amount,
    mintInfo.decimals
  );

  console.log("Transaction signature:", signature);
  console.log(
    "Explorer:",
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  const senderAfter = await getAccount(
    connection,
    senderATA.address,
    "confirmed"
  );

  const recipientAfter = await getAccount(
    connection,
    recipientATA.address,
    "confirmed"
  );

  if (
    senderAfter.amount !== 950_000_000n ||
    recipientAfter.amount !== 50_000_000n
  ) {
    throw new Error(
      "Transaction confirmed, but balances differ from expectations. " +
      "Inspect the transaction before retrying."
    );
  }

  console.log("Verified sender balance: 950 tokens");
  console.log("Verified recipient balance: 50 tokens");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});