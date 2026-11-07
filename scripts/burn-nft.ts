import { readFileSync, writeFileSync } from "node:fs";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  burn,
  fetchAsset,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import { loadConfig } from "./config.js";

async function main() {
  const { connection, wallet, recipient } = await loadConfig();

  const recipientWallet = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(readFileSync("wallets/recipient.json", "utf8"))
    )
  );

  if (!recipientWallet.publicKey.equals(recipient)) {
    throw new Error("Recipient wallet file does not match RECIPIENT_ADDRESS");
  }

  const creation = JSON.parse(
    readFileSync("nft-result.json", "utf8")
  );

  const assetAddress = publicKey(creation.asset);
  const web3AssetAddress = new PublicKey(creation.asset);

  const before = await connection.getAccountInfo(
    web3AssetAddress,
    "confirmed"
  );

  if (!before || before.data.length <= 1) {
    throw new Error("Asset is missing or already burned");
  }

  const umi = createUmi(connection.rpcEndpoint).use(mplCore());

  // The NFT's current owner authorizes the burn.
  const ownerIdentity = umi.eddsa.createKeypairFromSecretKey(
    recipientWallet.secretKey
  );

  umi.use(keypairIdentity(ownerIdentity));

  // The original wallet pays fees and receives refundable rent.
  umi.payer = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(wallet.secretKey)
  );

  const asset = await fetchAsset(umi, assetAddress);

  if (asset.owner !== ownerIdentity.publicKey) {
    throw new Error("Recipient wallet is not the current NFT owner");
  }

  console.log("Asset:", assetAddress);
  console.log("Burn authority:", ownerIdentity.publicKey);
  console.log("Payer and rent recipient:", umi.payer.publicKey);

  const transaction = await burn(umi, {
    asset,
    authority: umi.identity,
    payer: umi.payer,
  }).sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  const signature = base58.deserialize(transaction.signature)[0];

  const result = {
    asset: assetAddress,
    signature,
    burnAuthority: ownerIdentity.publicKey,
    payer: umi.payer.publicKey,
    assetLamportsBefore: before.lamports,
  };

  // Preserve the signature even if the following verification fails.
  writeFileSync(
    "nft-burn-result.json",
    JSON.stringify(result, null, 2) + "\n"
  );

  console.log("Transaction signature:", signature);
  console.log(
    "Explorer:",
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  const after = await connection.getAccountInfo(
    web3AssetAddress,
    "confirmed"
  );

  if (!after || after.data.length !== 1 || after.data[0] !== 0) {
    throw new Error(
      "Transaction confirmed, but burn verification needs investigation."
    );
  }

  const recoveredLamports = before.lamports - after.lamports;

  writeFileSync(
    "nft-burn-result.json",
    JSON.stringify(
      {
        ...result,
        assetLamportsAfter: after.lamports,
        recoveredLamports,
        remainingDataBytes: after.data.length,
        verified: true,
      },
      null,
      2
    ) + "\n"
  );

  console.log("Verified burned account marker");
  console.log("Recovered lamports:", recoveredLamports);
  console.log("Remaining account lamports:", after.lamports);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});