import { createContext, useContext, useState, ReactNode } from "react";

type Currency = "BDT" | "USDT";

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  formatPrice: (bdtPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const BDT_TO_USDT_RATE = 130;

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>("BDT");

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "BDT" ? "USDT" : "BDT"));
  };

  const formatPrice = (bdtPrice: number): string => {
    if (currency === "BDT") {
      return `৳${bdtPrice.toFixed(2)}`;
    }
    const usdt = bdtPrice / BDT_TO_USDT_RATE;
    return `$${usdt.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
};
