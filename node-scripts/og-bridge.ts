import { Indexer, KvClient, Batcher } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";

interface KvPutArgs {
    key: string;
    value: string;
}

interface KvGetArgs {
    key: string;
}

interface KvVerifyArgs {
    merkle_root: string;
}

type BridgeResult =
    | { ok: true; data: Record<string, unknown> }
    | { ok: false; error: string };

function env(name: string): string {
    const val = process.env[name];
    if (!val) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return val;
}

async function kvPut(args: KvPutArgs): Promise<BridgeResult> {
    const indexerRpc = env("OG_INDEXER_RPC");
    const blockchainRpc = env("OG_BLOCKCHAIN_RPC");
    const privateKey = env("OG_PRIVATE_KEY");
    const flowContract = env("OG_FLOW_CONTRACT");
    const streamId = env("OG_STREAM_ID");

    const provider = new ethers.JsonRpcProvider(blockchainRpc);
    const signer = new ethers.Wallet(privateKey, provider);
    const indexer = new Indexer(indexerRpc);

    const [nodes, selectErr] = await indexer.selectNodes(1);
    if (selectErr !== null) {
        return { ok: false, error: `Node selection failed: ${selectErr}` };
    }

    const batcher = new Batcher(1, nodes, flowContract, blockchainRpc);

    const keyBytes = Uint8Array.from(Buffer.from(args.key, "utf-8"));
    const valueBytes = Uint8Array.from(Buffer.from(args.value, "base64"));

    batcher.streamDataBuilder.set(streamId, keyBytes, valueBytes);

    const [tx, batchErr] = await batcher.exec();
    if (batchErr !== null) {
        return { ok: false, error: `Batch exec failed: ${batchErr}` };
    }

    return {
        ok: true,
        data: {
            tx_hash: tx ?? "",
            merkle_root: "",
        },
    };
}

async function kvGet(args: KvGetArgs): Promise<BridgeResult> {
    const kvNodeUrl = env("OG_KV_NODE_URL");
    const streamId = env("OG_STREAM_ID");

    const kvClient = new KvClient(kvNodeUrl);
    const keyBytes = Uint8Array.from(Buffer.from(args.key, "utf-8"));
    const encodedKey = ethers.encodeBase64(keyBytes);

    const value = await kvClient.getValue(streamId, encodedKey);

    return {
        ok: true,
        data: {
            value: value !== null ? String(value) : "",
        },
    };
}

async function kvVerify(args: KvVerifyArgs): Promise<BridgeResult> {
    const indexerRpc = env("OG_INDEXER_RPC");
    const indexer = new Indexer(indexerRpc);

    try {
        const info = await indexer.getFileInfo(args.merkle_root);
        return {
            ok: true,
            data: {
                valid: info !== null,
            },
        };
    } catch {
        return {
            ok: true,
            data: {
                valid: false,
            },
        };
    }
}

async function main(): Promise<void> {
    const [command, encodedArgs] = process.argv.slice(2);

    if (!command) {
        console.log(JSON.stringify({ ok: false, error: "No command provided" }));
        process.exit(1);
    }

    let args: Record<string, unknown> = {};
    if (encodedArgs) {
        args = JSON.parse(Buffer.from(encodedArgs, "base64").toString("utf-8"));
    }

    let result: BridgeResult;

    switch (command) {
        case "kv-put":
            result = await kvPut(args as unknown as KvPutArgs);
            break;
        case "kv-get":
            result = await kvGet(args as unknown as KvGetArgs);
            break;
        case "kv-verify":
            result = await kvVerify(args as unknown as KvVerifyArgs);
            break;
        default:
            result = { ok: false, error: `Unknown command: ${command}` };
    }

    console.log(JSON.stringify(result));
}

main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ ok: false, error: message }));
    process.exit(1);
});
