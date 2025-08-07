import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Users } from "lucide-react";
import React from "react";

export function Header() {
  return (
    <div>
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-green-400" />
                Scaffold IE Interface
              </h1>
              <p className="text-gray-400 mt-1">
                Create Impact Evaluators using Scaffold IE
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
