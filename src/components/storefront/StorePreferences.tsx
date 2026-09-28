"use client";
import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
type Selection = Record<string, number>;
const Preferences = createContext<[Selection, Dispatch<SetStateAction<Selection>>] | null>(null);
export function StorePreferences({ children }: { children: ReactNode }) {
  const state = useState<Selection>({});
  return <Preferences.Provider value={state}>{children}</Preferences.Provider>;
}
export function useStorePreferences() {
  const context = useContext(Preferences);
  if (!context) throw new Error("StorePreferences provider is missing");
  return context;
}
