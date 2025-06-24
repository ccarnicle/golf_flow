import { useFlowMutate } from "@onflow/kit";
import * as fcl from "@onflow/fcl";
import { revealWagerTransaction } from "../transactions/revealWager";
import { EventBus } from "@/game/EventBus";

export const useRevealWager = () => {
  const { mutate, isPending, error, data: txId } = useFlowMutate({
    mutation: {
      onSuccess: async (txId) => {
        console.log("Transaction Submitted:", txId);
        EventBus.emit('wager-reveal-submitted', txId);
        try {
          const sealedTx = await fcl.tx(txId).onceSealed();
          console.log("Transaction Sealed:", sealedTx);

          const wagerRevealedEvent = sealedTx.events.find(
            (event: any) => event.type.includes("WagerRevealed")
          );

          if (wagerRevealedEvent) {
            const payoutAmount = parseFloat(wagerRevealedEvent.data.payoutAmount);
            EventBus.emit('wager-reveal-sealed', payoutAmount);
          } else {
            EventBus.emit('wager-reveal-sealed', 0);
            console.error("WagerRevealed event not found in transaction");
          }
        } catch (err) {
          console.error("Error while waiting for transaction to seal:", err);
        }
      },
      onError: (error) => {
        console.error("Transaction Error:", error);
      }
    },
  });

  const revealWager = (recipient: string) => {
    mutate({
      cadence: revealWagerTransaction,
      args: (arg, t) => [
        arg(recipient, t.Address),
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });
  };

  return {
    revealWager,
    isRevealing: isPending,
    error,
    txId,
  };
}; 