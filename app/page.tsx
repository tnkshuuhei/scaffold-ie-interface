"use client";

import { SplitsClient } from "@0xsplits/splits-sdk";
import { getPublicClient } from "@wagmi/core";
import { config } from "./provider";
import { useQuery } from "@tanstack/react-query";
import { FlowVisualization } from "../components/flow-visualization";
import { formatEther } from "viem";

interface Route {
  id: `0x${string}`;
  rootSplits: `0x${string}`;
  routes: `0x${string}`[];
  allocations: number[];
}

export default function Home() {
  const { data: routes } = useQuery<Route[]>({
    queryKey: ["routes"],
    queryFn: async () => {
      const response = await fetch("http://localhost:42069/routes");
      const data = await response.json();
      return data;
    },
  });

  const {
    data: splitBalance,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["split-balance"],
    queryFn: async () => {
      const client = getPublicClient(config);
      const splitsClient = new SplitsClient({
        chainId: 11155111,
        publicClient: client,
      }).splitV1;

      const args = {
        splitAddress: routes?.[0]?.rootSplits as string,
      };
      const result = await splitsClient.getSplitBalance(args);
      return result;
    },

    enabled: !!routes,
  });

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-white">Loading...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-red-400">Error: {error.message}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Flow Visualization */}
      <div className="lg:col-span-2">
        {routes && routes[0] && (
          <FlowVisualization
            recipients={routes[0].routes}
            totalBalance={formatEther(splitBalance?.balance as bigint)}
            allocations={routes[0].allocations}
            rootSplits={routes[0].rootSplits as string}
          />
        )}
      </div>
    </main>
  );
}
