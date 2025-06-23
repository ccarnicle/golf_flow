import { useFlowMutate } from "@onflow/kit";
import * as fcl from "@onflow/fcl";
import { commitWagerScript } from "../transactions/commitWager";

interface UseCommitWagerProps {
    onTransactionSubmitted: (txId: string) => void;
    onTransactionSealed: (sealedTx: any) => void;
    onTransactionError: (error: Error) => void;
}

export const useCommitWager = ({ 
    onTransactionSubmitted, 
    onTransactionSealed, 
    onTransactionError 
}: UseCommitWagerProps) => {
  const { mutate, isPending, error, data: txId } = useFlowMutate({
    mutation: {
      onSuccess: async (txId) => {
        console.log("Transaction Submitted:", txId);
        onTransactionSubmitted(txId);
        try {
          const sealedTx = await fcl.tx(txId).onceSealed();
          console.log("Transaction Sealed:", sealedTx);
          onTransactionSealed(sealedTx);
        } catch (err) {
          console.error("Error while waiting for transaction to seal:", err);
          onTransactionError(err as Error);
        }
      },
      onError: (error) => {
        console.error("Transaction Error:", error);
        onTransactionError(error);
      }
    },
  });

  const commitWager = (amount: string) => {
    mutate({
      cadence: commitWagerScript,
      args: (arg, t) => [
        arg(amount, t.UFix64),
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });
  };

  return {
    commitWager,
    isCommitting: isPending,
    error,
    txId,
  };
}; 