import { useFlowMutate } from "@onflow/kit";
import * as fcl from "@onflow/fcl";
import { buyABatTransaction } from "../transactions/buyABat";

interface UseBuyBatProps {
    onTransactionSubmitted: (txId: string) => void;
    onTransactionSealed: (sealedTx: any) => void;
    onTransactionError: (error: Error) => void;
}

export const useBuyBat = ({ 
    onTransactionSubmitted, 
    onTransactionSealed, 
    onTransactionError 
}: UseBuyBatProps) => {
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

  const buyBat = (tier: string, amount: string) => {
    mutate({
      cadence: buyABatTransaction,
      args: (arg, t) => [
        arg(tier, t.String),
        arg(amount, t.UFix64),
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });
  };

  return {
    buyBat,
    isBuying: isPending,
    error,
    txId,
  };
}; 