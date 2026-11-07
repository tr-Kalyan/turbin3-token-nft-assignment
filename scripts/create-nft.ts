import { existsSync, writeFileSync } from "node:fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  create,
  fetchAsset,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import { loadConfig } from "./config.js";

async function main() {
  // Keep one NFT for this assignment.
  if (existsSync("nft-result.json")) {
    throw new Error(
      "nft-result.json already exists. Inspect it before creating another NFT."
    );
  }

  const { connection, wallet } = await loadConfig();

  const uri = process.env.NFT_URI?.trim();

  if (!uri) {
    throw new Error("Set NFT_URI in .env");
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Metadata request failed: ${response.status}`);
  }

  const metadata = await response.json();

  if (
    typeof metadata.name !== "string" ||
    typeof metadata.image !== "string"
  ) {
    throw new Error("Metadata must contain a name and image URL");
  }

  const umi = createUmi(connection.rpcEndpoint).use(mplCore());

  const identity = umi.eddsa.createKeypairFromSecretKey(
    wallet.secretKey
  );

  umi.use(keypairIdentity(identity));

  const asset = generateSigner(umi);

  // Save the address before sending, so a timeout can be investigated.
  const result = {
    asset: asset.publicKey,
    name: metadata.name,
    uri,
    status: "pending",
    signature: "",
  };

  const save = () => {
    writeFileSync(
      "nft-result.json",
      JSON.stringify(result, null, 2) + "\n"
    );
  };

  save();

  console.log("Creating NFT:", asset.publicKey);

  const transaction = await create(umi, {
    asset,
    name: metadata.name,
    uri,
    owner: identity.publicKey,
    updateAuthority: identity.publicKey,
  }).sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  result.signature = base58.deserialize(transaction.signature)[0];
  result.status = "confirmed";
  save();

  console.log("Asset address:", result.asset);
  console.log("Transaction signature:", result.signature);
  console.log(
    "Explorer:",
    `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`
  );

  const created = await fetchAsset(umi, asset.publicKey);

  if (
    created.owner !== identity.publicKey ||
    created.name !== metadata.name ||
    created.uri !== uri
  ) {
    throw new Error("NFT created, but verification needs investigation");
  }

  console.log("Verified owner:", created.owner);
  console.log("Verified name:", created.name);
  console.log("Verified metadata URI:", created.uri);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});