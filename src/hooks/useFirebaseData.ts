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
          setData({
            traders: Object.values(data.traders || {}),
            transactions: Object.values(data.transactions || {}),
            productTypes: Object.values(data.productTypes || {})
          });
        } else {
          // Varsayılan ürün türlerini ekle
          const defaultProductTypes: ProductType[] = [
            {
              id: 'altin',
              name: 'Altın',
              unit: 'gram' as const,
              currentPrice: 2500
            },
            {
              id: 'hurda',
              name: 'Hurda',
              unit: 'gram' as const,
              currentPrice: 2300
            }
          ];
          
          setData({
            traders: [],
            transactions: [],
            productTypes: defaultProductTypes
          });
          
          // Varsayılan ürün türlerini kaydet
          saveProductTypes(defaultProductTypes);
        }
        
        setError(null);
      } catch (err) {
        setError('Veriler yüklenirken hata oluştu.');
        console.error('Firebase data error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      off(userDataRef);
      unsubscribe();
    };
  }, [user]);

  // Toptancı kaydetme
  const saveTrader = async (trader: Trader) => {
    if (!user) return;
    
    try {
      const traderRef = ref(database, `users/${user.uid}/traders/${trader.id}`);
      await set(traderRef, trader);
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
      const transactionRef = ref(database, `users/${user.uid}/transactions/${transaction.id}`);
      await set(transactionRef, {
        ...transaction,
        date: transaction.date.toISOString() // Date objesini string'e çevir
      });
      
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
      const productTypeRef = ref(database, `users/${user.uid}/productTypes/${productType.id}`);
      await set(productTypeRef, productType);
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