import { useState, useCallback } from 'react';

interface UseWalletReturn {
    address: string | null;
    connecting: boolean;
    connect: () => Promise<string>;
    sign: (message: string, addr: string) => Promise<string>;
}

export function useWallet(): UseWalletReturn {
    const [address, setAddress] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    const connect = useCallback(async (): Promise<string> => {
        if (!window.ethereum) {
            throw new Error('No wallet detected');
        }
        setConnecting(true);
        try {
            const accounts = (await window.ethereum.request({
                method: 'eth_requestAccounts',
            })) as string[];
            setAddress(accounts[0]);
            return accounts[0];
        } finally {
            setConnecting(false);
        }
    }, []);

    const sign = useCallback(async (message: string, addr: string): Promise<string> => {
        if (!window.ethereum) {
            throw new Error('No wallet detected');
        }
        return (await window.ethereum.request({
            method: 'personal_sign',
            params: [message, addr],
        })) as string;
    }, []);

    return { address, connecting, connect, sign };
}
