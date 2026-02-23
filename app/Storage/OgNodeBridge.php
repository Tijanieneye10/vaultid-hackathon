<?php

namespace App\Storage;

use App\Exceptions\OgStorageException;
use Illuminate\Support\Facades\Process;

class OgNodeBridge
{
    /**
     * Execute a command on the Node.js 0G bridge.
     *
     * @param  array<string, mixed>  $args
     * @return array<string, mixed>
     */
    public function call(string $command, array $args = []): array
    {
        $encodedArgs = base64_encode(json_encode($args));
        $scriptPath = base_path('node-scripts/og-bridge.ts');

        $result = Process::timeout(120)
            ->env($this->environment())
            ->run("npx tsx {$scriptPath} {$command} {$encodedArgs}");

        if ($result->failed()) {
            throw new OgStorageException(
                "0G bridge command [{$command}] failed: " . $result->errorOutput()
            );
        }

        $output = json_decode(trim($result->output()), true);

        if (! is_array($output)) {
            throw new OgStorageException(
                "0G bridge returned invalid JSON for [{$command}]"
            );
        }

        if (($output['ok'] ?? false) !== true) {
            throw new OgStorageException(
                $output['error'] ?? "0G bridge command [{$command}] failed"
            );
        }

        return $output['data'] ?? [];
    }

    /**
     * @return array<string, string>
     */
    private function environment(): array
    {
        return array_filter([
            'OG_INDEXER_RPC' => config('zerog.indexer_rpc'),
            'OG_BLOCKCHAIN_RPC' => config('zerog.blockchain_rpc'),
            'OG_PRIVATE_KEY' => config('zerog.private_key'),
            'OG_FLOW_CONTRACT' => config('zerog.flow_contract'),
            'OG_STREAM_ID' => config('zerog.stream_id'),
            'OG_KV_NODE_URL' => config('zerog.kv_node_url'),
        ]);
    }
}
