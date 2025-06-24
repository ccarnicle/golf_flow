import { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { getFlowBalance } from '../scripts/getFlowBalance';
import { EventBus } from '@/game/EventBus';

export const useFlowBalance = (user: any) => {
    const [balance, setBalance] = useState<string | null>(null);

    const fetchBalance = async () => {
        if (user?.addr) {
            try {
                const result = await fcl.query({
                    cadence: getFlowBalance,
                    args: (arg, t) => [arg(user.addr, t.Address)],
                });
                setBalance(result);
                EventBus.emit('flow-balance-updated', result);
            } catch (error) {
                console.error("Error fetching user's FLOW balance:", error);
                setBalance(null);
            }
        }
    };

    useEffect(() => {
        if (user?.addr) {
            fetchBalance();
        }

        // Listen for an event to refetch the balance
        const handleRefresh = () => fetchBalance();
        EventBus.on('refresh-flow-balance', handleRefresh);

        return () => {
            EventBus.off('refresh-flow-balance', handleRefresh);
        };
    }, [user]);

    return balance;
}; 