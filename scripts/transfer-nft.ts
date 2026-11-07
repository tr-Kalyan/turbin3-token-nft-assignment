import { readFileSync, writeFileSync } from "node:fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  fetchAsset,
  mplCore,
  transfer,
} from "@metaplex-foundation/mpl-core";
import { loadConfig } from "./config.js";

async function main() {
  const { connection, wallet, recipient } = await loadConfig();

  const creation = JSON.parse(
    readFileSync("nft-result.json", "utf8")
  );

  const umi = createUmi(connection.rpcEndpoint).use(mplCore());

  const identity = umi.eddsa.createKeypairFromSecretKey(
    wallet.secretKey
  );

  umi.use(keypairIdentity(identity));

  const assetAddress = publicKey(creation.asset);
  const newOwner = publicKey(recipient.toBase58());
  const asset = await fetchAsset(umi, assetAddress);

  console.log("Current owner:", asset.owner);
  console.log("Recipient:", newOwner);

  if (asset.owner === newOwner) {
    console.log("NFT already belongs to the recipient.");
    return;
  }

  if (asset.owner !== identity.publicKey) {
    throw new Error("Configured wallet is not the NFT owner");
  }

  const transaction = await transfer(umi, {
    asset,
    newOwner,
  }).sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  const signature = base58.deserialize(transaction.signature)[0];

  writeFileSync(
    "nft-transfer-result.json",
    JSON.stringify(
      {
        asset: assetAddress,
        previousOwner: asset.owner,
        newOwner,
        signature,
      },
      null,
      2
    ) + "\n"
  );

  console.log("Transaction signature:", signature);
  console.log(
    "Explorer:",
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  const transferred = await fetchAsset(umi, assetAddress);

  if (transferred.owner !== newOwner) {
    throw new Error(
      "Transaction confirmed, but ownership verification failed."
    );
  }

  console.log("Verified new owner:", transferred.owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});