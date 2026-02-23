<?php

return [
    'indexer_rpc' => env('OG_INDEXER_RPC', 'https://indexer-storage-testnet.0g.ai'),
    'blockchain_rpc' => env('OG_BLOCKCHAIN_RPC', 'https://evmrpc-testnet.0g.ai'),
    'private_key' => env('OG_PRIVATE_KEY'),
    'flow_contract' => env('OG_FLOW_CONTRACT'),
    'stream_id' => env('OG_STREAM_ID'),
    'kv_node_url' => env('OG_KV_NODE_URL'),
    'encryption_key' => env('OG_ENCRYPTION_KEY') ? base64_decode(env('OG_ENCRYPTION_KEY')) : null,
];
