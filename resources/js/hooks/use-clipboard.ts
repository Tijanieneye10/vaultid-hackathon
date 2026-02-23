import { useState, useCallback } from 'react';

interface UseClipboardReturn {
    copied: boolean;
    copy: (text: string) => Promise<void>;
}

export function useClipboard(timeout = 2000): UseClipboardReturn {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(
        async (text: string): Promise<void> => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), timeout);
        },
        [timeout],
    );

    return { copied, copy };
}
