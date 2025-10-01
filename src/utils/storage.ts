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
  try {
    if (dateString instanceof Date) {
      return isNaN(dateString.getTime()) ? new Date() : dateString;
    }
    
    if (typeof dateString === 'string') {
      // Handle empty or invalid strings
      if (!dateString || dateString.trim() === '') {
        return new Date();
      }
      
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    // For any other case, return current date
    return new Date();
  } catch (error) {
    console.warn('Error parsing date string:', dateString, error);
    return new Date(); // Fallback to current date
  }
}

export function loadFromStorage(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Validate and parse traders with safe date parsing
      if (data.traders && Array.isArray(data.traders)) {
        data.traders.forEach((trader: { lastTransactionDate: string | Date }) => {
          try {
            trader.lastTransactionDate = safeParseDateString(trader.lastTransactionDate);
          } catch (error) {
            console.warn('Error parsing trader lastTransactionDate:', trader, error);
            trader.lastTransactionDate = new Date(); // Fallback to current date
          }
        });
      }
      
      // Validate and parse transactions with safe date parsing
      if (data.transactions && Array.isArray(data.transactions)) {
        data.transactions.forEach((transaction: { date: string | Date }) => {
          try {
            transaction.date = safeParseDateString(transaction.date);
          } catch (error) {
            console.warn('Error parsing transaction date:', transaction, error);
            transaction.date = new Date(); // Fallback to current date
          }
        });
      }
      
      // Validate and parse product types with order property
      if (data.productTypes && Array.isArray(data.productTypes)) {
        data.productTypes.forEach((productType: { order?: number }, index: number) => {
          if (productType.order === undefined) {
            productType.order = index;
          }
        });
      }
      
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
  try {
    const data = JSON.parse(jsonString);
    
    // Validate and parse traders with safe date parsing
    if (data.traders && Array.isArray(data.traders)) {
      data.traders.forEach((trader: { lastTransactionDate: string | Date }) => {
        try {
          trader.lastTransactionDate = safeParseDateString(trader.lastTransactionDate);
        } catch (error) {
          console.warn('Error parsing trader lastTransactionDate:', trader, error);
          trader.lastTransactionDate = new Date(); // Fallback to current date
        }
      });
    }
    
    // Validate and parse transactions with safe date parsing
    if (data.transactions && Array.isArray(data.transactions)) {
      data.transactions.forEach((transaction: { date: string | Date }) => {
        try {
          transaction.date = safeParseDateString(transaction.date);
        } catch (error) {
          console.warn('Error parsing transaction date:', transaction, error);
          transaction.date = new Date(); // Fallback to current date
        }
      });
    }
    
    // Validate and parse product types with order property
    if (data.productTypes && Array.isArray(data.productTypes)) {
      data.productTypes.forEach((productType: { order?: number }, index: number) => {
        if (productType.order === undefined) {
          productType.order = index;
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error('JSON içe aktarılamadı:', error);
    throw new Error('Geçersiz JSON formatı');
  }
}