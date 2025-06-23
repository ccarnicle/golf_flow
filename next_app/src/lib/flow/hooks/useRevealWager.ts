import { useFlowMutate } from "@onflow/kit";
import * as fcl from "@onflow/fcl";
import { revealWagerTransaction } from "../transactions/revealWager";

export const useRevealWager = () => {
  const { mutate, isPending, error, data: txId } = useFlowMutate({
    mutation: {
      onSuccess: async (txId) => {
        console.log("Transaction Submitted:", txId);
        try {
          const sealedTx = await fcl.tx(txId).onceSealed();
          console.log("Transaction Sealed:", sealedTx);
          // More logic here
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