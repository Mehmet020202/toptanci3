import { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove, off } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from './useAuth';
import { Trader, Transaction, ProductType } from '../types';

interface AppData {
  traders: Trader[];
  transactions: Transaction[];
  productTypes: ProductType[];
}

// Helper function to safely parse dates
function parseDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  
  // If it's already a Date object, return it
  if (dateValue instanceof Date) return dateValue;
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    // Check if the date is valid
    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date string:', dateValue);
      return new Date(); // Return current date as fallback
    }
    return parsed;
  }
  
  // If it's a number (timestamp), convert it to Date
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  // For any other case, return current date
  console.warn('Unknown date format:', dateValue);
  return new Date();
}

export function useFirebaseData() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>({
    traders: [],
    transactions: [],
    productTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setData({ traders: [], transactions: [], productTypes: [] });
      setLoading(false);
      return;
    }

    const userDataRef = ref(database, `users/${user.uid}`);
    
    const unsubscribe = onValue(userDataRef, (snapshot) => {
      try {
        const data = snapshot.val();
        
        if (data) {
          // Parse traders with safe date parsing
          const traders = Object.values(data.traders || {}).map((trader: any) => {
            // Safe date parsing for lastTransactionDate
            let lastTransactionDate: Date;
            try {
              lastTransactionDate = parseDate(trader.lastTransactionDate);
              if (isNaN(lastTransactionDate.getTime())) {
                console.warn('Invalid lastTransactionDate for trader:', trader.id, trader.lastTransactionDate);
                lastTransactionDate = new Date(); // Fallback to current date
              }
            } catch (error) {
              console.warn('Error parsing lastTransactionDate for trader:', trader.id, error);
              lastTransactionDate = new Date(); // Fallback to current date
            }
            
            return {
              ...trader,
              lastTransactionDate
            };
          });
          
          // Parse transactions with safe date parsing
          const transactions = Object.values(data.transactions || {}).map((transaction: any) => {
            // Safe date parsing for transaction date
            let date: Date;
            try {
              date = parseDate(transaction.date);
              if (isNaN(date.getTime())) {
                console.warn('Invalid date for transaction:', transaction.id, transaction.date);
                date = new Date(); // Fallback to current date
              }
            } catch (error) {
              console.warn('Error parsing date for transaction:', transaction.id, error);
              date = new Date(); // Fallback to current date
            }
            
            return {
              ...transaction,
              date
            };
          });
          
          // Parse product types and ensure they have order property
          const productTypes = Object.values(data.productTypes || {}).map((productType: any, index) => {
            return {
              ...productType,
              order: productType.order ?? index
            };
          });
          
          setData({
            traders,
            transactions,
            productTypes
          });
        } else {
          // Varsayılan ürün türlerini ekle
          const defaultProductTypes: ProductType[] = [
            { id: 'altın', name: 'Altın', unit: 'gram', currentPrice: 1850, order: 1 },
            { id: 'gümüş', name: 'Gümüş', unit: 'gram', currentPrice: 25, order: 2 },
            { id: 'çeyrek', name: 'Çeyrek Altın', unit: 'adet', currentPrice: 4800, order: 3 }
          ];
          
          setData({
            traders: [],
            transactions: [],
            productTypes: defaultProductTypes
          });
        }
      } catch (err) {
        console.error('Veri yüklenirken hata oluştu:', err);
        setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase veri hatası:', error);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
      setLoading(false);
    });

    // Cleanup function
    return () => {
      off(userDataRef, 'value', unsubscribe);
    };
  }, [user]);

  // Toptancı kaydetme
  const saveTrader = async (trader: Trader) => {
    if (!user) return;
    
    try {
      // Create a clean object with only defined values
      const cleanTrader: any = {};
      
      // Process each property explicitly
      Object.entries(trader).forEach(([key, value]) => {
        // Skip undefined values
        if (value !== undefined) {
          cleanTrader[key] = value;
        }
      });
      
      const traderRef = ref(database, `users/${user.uid}/traders/${trader.id}`);
      await set(traderRef, cleanTrader);
    } catch (err) {
      setError('Toptancı kaydedilirken hata oluştu.');
      throw err;
    }
  };

  // Toptancı silme
  const deleteTrader = async (traderId: string) => {
    if (!user) return;
    
    try {
      const traderRef = ref(database, `users/${user.uid}/traders/${traderId}`);
      await remove(traderRef);
      
      // Toptancı ile ilgili tüm işlemleri sil
      const userTransactionsRef = ref(database, `users/${user.uid}/transactions`);
      const snapshot = await new Promise<any>((resolve) => {
        onValue(userTransactionsRef, resolve, { onlyOnce: true });
      });
      
      if (snapshot.exists()) {
        const transactions = snapshot.val();
        const traderTransactionIds = Object.keys(transactions).filter(
          id => transactions[id].traderId === traderId
        );
        
        for (const transactionId of traderTransactionIds) {
          const transactionRef = ref(database, `users/${user.uid}/transactions/${transactionId}`);
          await remove(transactionRef);
        }
      }
    } catch (err) {
      setError('Toptancı silinirken hata oluştu.');
      throw err;
    }
  };

  // İşlem kaydetme
  const saveTransaction = async (transaction: Transaction) => {
    if (!user) return;
    
    try {
      // Create a clean object with only defined values
      const cleanTransaction: any = {};
      
      // Process each property explicitly
      Object.entries(transaction).forEach(([key, value]) => {
        // Skip undefined values
        if (value !== undefined) {
          // Special handling for date
          if (key === 'date') {
            cleanTransaction[key] = value instanceof Date ? value.toISOString() : new Date().toISOString();
          } else {
            cleanTransaction[key] = value;
          }
        }
      });
      
      const transactionRef = ref(database, `users/${user.uid}/transactions/${transaction.id}`);
      await set(transactionRef, cleanTransaction);
      
      // Toptancının son işlem tarihini güncelle
      const trader = data.traders.find(t => t.id === transaction.traderId);
      if (trader) {
        const updatedTrader = { ...trader, lastTransactionDate: new Date() };
        await saveTrader(updatedTrader);
      }
    } catch (err) {
      setError('İşlem kaydedilirken hata oluştu.');
      throw err;
    }
  };

  // İşlem silme
  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;
    
    try {
      const transactionRef = ref(database, `users/${user.uid}/transactions/${transactionId}`);
      await remove(transactionRef);
    } catch (err) {
      setError('İşlem silinirken hata oluştu.');
      throw err;
    }
  };

  // Ürün türü kaydetme
  const saveProductType = async (productType: ProductType) => {
    if (!user) return;
    
    try {
      // Create a clean object with only defined values
      const cleanProductType: any = {};
      
      // Process each property explicitly
      Object.entries(productType).forEach(([key, value]) => {
        // Skip undefined values
        if (value !== undefined) {
          cleanProductType[key] = value;
        }
      });
      
      const productTypeRef = ref(database, `users/${user.uid}/productTypes/${productType.id}`);
      await set(productTypeRef, cleanProductType);
    } catch (err) {
      setError('Ürün türü kaydedilirken hata oluştu.');
      throw err;
    }
  };

  // Ürün türü silme  
  const deleteProductType = async (productTypeId: string) => {
    if (!user) return;
    
    try {
      const productTypeRef = ref(database, `users/${user.uid}/productTypes/${productTypeId}`);
      await remove(productTypeRef);
    } catch (err) {
      setError('Ürün türü silinirken hata oluştu.');
      throw err;
    }
  };

  // Toplu ürün türü kaydetme (ilk kurulum için)
  const saveProductTypes = async (productTypes: ProductType[]) => {
    if (!user) return;
    
    try {
      for (const productType of productTypes) {
        await saveProductType(productType);
      }
    } catch (err) {
      setError('Ürün türleri kaydedilirken hata oluştu.');
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    saveTrader,
    deleteTrader,
    saveTransaction,
    deleteTransaction,
    saveProductType,
    deleteProductType,
    setError
  };
}