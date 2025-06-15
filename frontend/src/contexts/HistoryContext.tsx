// src/contexts/HistoryContext.tsx

"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type HistoryItem = {
  minutes_id: number | string;
  title: string;
  image_url: string;
  created_at: string;
};

type HistoryContextType = {
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  addHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
  
    const addHistory = (item: HistoryItem) => {
      setHistory(prev => [item, ...prev]);
    };
  
    const clearHistory = () => setHistory([]);
  
    return (
      <HistoryContext.Provider value={{ history, setHistory, addHistory, clearHistory }}>
        {children}
      </HistoryContext.Provider>
    );
  };

export const useHistory = () => {
const context = useContext(HistoryContext);
if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
}
return context;
};