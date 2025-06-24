import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';
import { FlowProvider } from './lib/flow/FlowProvider';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import AppLayout from './components/AppLayout';
import { useCommitWager } from './lib/flow/hooks/useCommitWager';
import { useCurrentFlowUser } from '@onflow/kit';
import { useUserBats } from './lib/flow/hooks/useUserBats';
import { EventBus } from './game/EventBus';
import { useFlowBalance } from './lib/flow/hooks/useFlowBalance';
import { useBuyBat } from './lib/flow/hooks/useBuyBat';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [currentSceneKey, setCurrentSceneKey] = useState<string | null>(null);

    const { user } = useCurrentFlowUser();
    console.log('[App.tsx] User:', user?.addr);

    const { userBat } = useUserBats(user?.addr);
    console.log('[App.tsx] User Bat:', userBat);

    const flowBalance = useFlowBalance(user);
    console.log('[App.tsx] Flow Balance from hook:', flowBalance);
    
    const { commitWager } = useCommitWager({
        onTransactionSubmitted: (txId) => {
            EventBus.emit('transaction-submitted', txId);
        },
        onTransactionSealed: (sealedTx) => {
            EventBus.emit('transaction-sealed', sealedTx);
            EventBus.emit('refresh-flow-balance');
        },
        onTransactionError: (error) => {
            // We could emit an error event to the game here if needed
            console.error("Transaction Error from hook:", error);
        }
    });

    const { buyBat } = useBuyBat({
        onTransactionSubmitted: (txId) => {
            EventBus.emit('transaction-submitted', txId);
        },
        onTransactionSealed: (sealedTx) => {
            EventBus.emit('transaction-sealed', sealedTx);
        },
        onTransactionError: (error) => {
            // We could emit an error event to the game here if needed
            console.error("Transaction Error from hook:", error);
        }
    });

    useEffect(() => {
        if (userBat) {
            console.log("User bat from hook:", userBat);
            EventBus.emit('user-bat-updated', userBat);
        }
    }, [userBat]);

    useEffect(() => {
        const sceneReadyHandler = () => {
            if (userBat) {
                EventBus.emit('user-bat-updated', userBat);
            }
        };
        EventBus.on('bat-sales-scene-ready', sceneReadyHandler);
        return () => {
            EventBus.off('bat-sales-scene-ready', sceneReadyHandler);
        }
    }, [userBat]);

    useEffect(() => {
        const handlePlayGame = ({ amount }: { amount: string }) => {
            const formattedAmount = `${amount}.0`;
            commitWager(formattedAmount);
        };

        EventBus.on('play-game-clicked', handlePlayGame);

        return () => {
            EventBus.removeListener('play-game-clicked', handlePlayGame);
        }
    }, [commitWager]);

    useEffect(() => {
        const handleBuyBat = ({ tier, amount }: { tier: string, amount: string }) => {
            buyBat(tier, amount);
        };

        EventBus.on('buy-bat-clicked', handleBuyBat);

        return () => {
            EventBus.removeListener('buy-bat-clicked', handleBuyBat);
        }
    }, [buyBat]);

    useEffect(() => {
        console.log(`[App.tsx] Balance/SceneKey Effect. Scene: ${currentSceneKey}, Balance: ${flowBalance}`);
        if (currentSceneKey === 'TicketCounterScene' && flowBalance) {
            console.log(`[App.tsx] Emitting flow-balance-updated (${flowBalance}) to scene ${currentSceneKey}`);
            EventBus.emit('flow-balance-updated', flowBalance);
        }
    }, [currentSceneKey, flowBalance]);

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        console.log('[App.tsx] Current scene changed to:', scene.scene.key);
        setCurrentSceneKey(scene.scene.key);
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <FlowProvider>
                <AppLayout>
                    <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
                </AppLayout>
            </FlowProvider>
        </ThemeProvider>
    );
}

export default App
