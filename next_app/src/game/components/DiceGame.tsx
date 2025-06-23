import React, { useEffect } from 'react';
import { useCurrentFlowUser } from '@onflow/kit';
import { useRevealWager } from '../../lib/flow/hooks/useRevealWager';

interface DiceGameProps {
  scene: any; // This will be your Phaser scene instance
}

export const DiceGame: React.FC<DiceGameProps> = ({ scene }) => {
  const { user } = useCurrentFlowUser();
  const { revealWager, isRevealing, error: txError, txId } = useRevealWager();

  // Listen for dice roll started event to send transaction
  useEffect(() => {
    if (scene) {
      console.log('Setting up dice roll started listener');
      const onDiceRollStarted = () => {
        if (user?.loggedIn && user.addr) {
          console.log('Dice roll started, sending transaction...');
          revealWager(user.addr);
        } else {
          console.log("User not logged in, can't start wager.")
        }
      };

      scene.events.on('diceRollStarted', onDiceRollStarted);

      return () => {
        console.log('Cleaning up dice roll started listener');
        scene.events.off('diceRollStarted', onDiceRollStarted);
      };
    }
  }, [scene, revealWager, user]);

  useEffect(() => {
    if (scene?.scoreText) {
      if (isRevealing) {
        scene.updateScoreText('Revealing...');
      } else if (txError) {
        scene.updateScoreText('Error!');
      } else if (txId) {
        scene.updateScoreText('Wager Revealed!');
      }
    }
  }, [scene, isRevealing, txError, txId]);

  return null; // This component doesn't render anything directly
}; 