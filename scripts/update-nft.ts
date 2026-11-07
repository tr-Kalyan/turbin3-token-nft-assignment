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
  update,
} from "@metaplex-foundation/mpl-core";
import { loadConfig } from "./config.js";

async function main() {
  const { connection, wallet } = await loadConfig();

  const uri = process.env.UPDATED_NFT_URI?.trim();

  if (!uri) {
    throw new Error("Set UPDATED_NFT_URI in .env");
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Metadata request failed: ${response.status}`);
  }

  const metadata = await response.json();

  if (typeof metadata.name !== "string" || !metadata.name.trim()) {
    throw new Error("Metadata must contain a non-empty name");
  }

  const creation = JSON.parse(
    readFileSync("nft-result.json", "utf8")
  );

  const umi = createUmi(connection.rpcEndpoint).use(mplCore());

  const identity = umi.eddsa.createKeypairFromSecretKey(
    wallet.secretKey
  );

  umi.use(keypairIdentity(identity));

  const assetAddress = publicKey(creation.asset);
  const asset = await fetchAsset(umi, assetAddress);

  console.log("Current name:", asset.name);
  console.log("Current URI:", asset.uri);

  if (asset.name === metadata.name && asset.uri === uri) {
    console.log("NFT already has the requested name and URI.");
    return;
  }

  const transaction = await update(umi, {
    asset,
    name: metadata.name,
    uri,
  }).sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  const signature = base58.deserialize(transaction.signature)[0];

  // Save transaction evidence before making another RPC request.
  writeFileSync(
    "nft-update-result.json",
    JSON.stringify(
      {
        asset: assetAddress,
        previousName: asset.name,
        previousUri: asset.uri,
        name: metadata.name,
        uri,
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

  const updated = await fetchAsset(umi, assetAddress);

  if (updated.name !== metadata.name || updated.uri !== uri) {
    throw new Error(
      "Transaction confirmed, but verification needs investigation."
    );
  }

  console.log("Verified name:", updated.name);
  console.log("Verified metadata URI:", updated.uri);
  console.log("Owner:", updated.owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});