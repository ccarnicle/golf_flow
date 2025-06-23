import { useFlowMutate } from "@onflow/kit";
import * as fcl from "@onflow/fcl";
import { diceRollScript } from "../transactions/diceRoll";

export const useDiceRoll = () => {
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
          // Optionally, you can call your onError logic here manually
          // onError(err);
        }
      },
      onError: (error) => {
        console.error("Transaction Error:", error);
      }
    },
  });

  const rollDice = () => {
    mutate({
      cadence: diceRollScript,
      args: (arg, t) => [
        arg("FIELD", t.String), // hardcoded betName
        arg("10.0", t.UFix64), // hardcoded amount
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });
  };

  return {
    rollDice,
    isRolling: isPending,
    error,
    txId,
  };
}; 