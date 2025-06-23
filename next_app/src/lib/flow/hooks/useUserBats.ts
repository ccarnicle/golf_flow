import { useFlowQuery } from "@onflow/kit";
import { getUserBats } from "../scripts/getUserBats";
import * as t from "@onflow/types";

export const useUserBats = (address: string | null | undefined) => {
  const { data, isLoading, error } = useFlowQuery({
    cadence: getUserBats,
    args: (arg, t) => [
      arg(address ?? "", t.Address),
    ],
    query: {
      enabled: !!address,
      retry: false,
    }
  });

  return {
    userBat: data as string | null,
    isLoading,
    error,
  };
}; 