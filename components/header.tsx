import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";

export function Header() {
  return (
    <div>
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Scaffold IE Interface
          </h1>
          <ConnectButton />
        </div>
      </header>

			
    </div>
  );
}
