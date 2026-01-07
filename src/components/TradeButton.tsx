"use client";
import { useState } from "react";

interface TradeButtonProps {
  onFinalizeTrade: () => Promise<void>;
}

export default function TradeButton({ onFinalizeTrade }: TradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onFinalizeTrade();
      alert("Trade offer sent successfully!");
    } catch (error) {
      console.error("Failed to finalize trade:", error);
      alert("Failed to send trade offer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Sending...</span>
        </div>
      ) : (
        "Finalize Trade"
      )}
    </button>
  );
}