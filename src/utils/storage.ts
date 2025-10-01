import { AppData } from '../types';
import { defaultProductTypes } from '../data/defaultData';

const STORAGE_KEY = 'toptanci_takip_data';

export function saveToStorage(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Veri kaydedilemedi:', error);
  }
}

// Safe date parsing function
function safeParseDateString(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? new Date() : dateString;
  }
  
  if (typeof dateString === 'string') {
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  return new Date();
}

export function loadFromStorage(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Tarihleri Date objesine çevir
      data.traders.forEach((trader: { lastTransactionDate: string | Date }) => {
        trader.lastTransactionDate = safeParseDateString(trader.lastTransactionDate);
      });
      data.transactions.forEach((transaction: { date: string | Date }) => {
        transaction.date = safeParseDateString(transaction.date);
      });
      return data;
    }
  } catch (error) {
    console.error('Veri yüklenemedi:', error);
  }
  
  return {
    traders: [],
    transactions: [],
    productTypes: defaultProductTypes
  };
}

export function exportToJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importFromJSON(jsonString: string): AppData {
  const data = JSON.parse(jsonString);
  // Tarihleri Date objesine çevir
  data.traders.forEach((trader: { lastTransactionDate: string | Date }) => {
    trader.lastTransactionDate = safeParseDateString(trader.lastTransactionDate);
  });
  data.transactions.forEach((transaction: { date: string | Date }) => {
    transaction.date = safeParseDateString(transaction.date);
  });
  return data;
}