import { Transaction, Trader } from '../types';

// Helper function to fix floating point precision issues
function roundToPrecision(num: number, decimals: number = 3): number {
  return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function calculateBalances(trader: Trader, transactions: Transaction[]) {
  const traderTransactions = transactions.filter(t => t.traderId === trader.id);
  
  // moneyBalance: Positive = Toptancı bize borçlu, Negative = Biz toptancıya borçluyuz
  let moneyBalance = 0;
  const productBalances: Record<string, number> = {};

  traderTransactions.forEach(transaction => {
    switch (transaction.type) {
      case 'mal_alimi': // Ürün aldık, para borcu oluşturduk
        moneyBalance -= transaction.amount;
        if (transaction.productType && transaction.quantity) {
          productBalances[transaction.productType] = (productBalances[transaction.productType] || 0) + transaction.quantity;
        }
        break;

      case 'mal_satisi': // Ürün sattık, para alacağı oluşturduk
        moneyBalance += transaction.amount;
        if (transaction.productType && transaction.quantity) {
          productBalances[transaction.productType] = (productBalances[transaction.productType] || 0) - transaction.quantity;
        }
        break;

      case 'odeme_yapildi': // Para ödedik - toptancıya olan borcumuz azalır
        moneyBalance += transaction.amount; // Borcumuz azalır (daha az negatif veya pozitife çıkar)
        break;

      case 'tahsilat': // Para tahsil ettik - toptancıdan para aldık, ona olan borcumuz arttı
        moneyBalance -= transaction.amount; // Borç arttı (daha negatif oldu)
        break;

      case 'nakit_borc': // Nakit borç verdik - toptancıya alacağımız oluştu
        moneyBalance += transaction.amount;
        break;

      case 'nakit_tahsilat': // Nakit tahsil ettik - toptancıdan para aldık, ona olan borcumuz arttı
        moneyBalance -= transaction.amount; // Borç arttı (daha negatif oldu)
        break;

      case 'urun_ile_odeme_yapildi': // Ürün ile ödeme yaptık - toptancıya olan borcumuz azaldı
        // Ürün verdik, karşılığında para borcu azaldı (para almış gibi)
        moneyBalance += transaction.amount; 
        if (transaction.productType && transaction.quantity) {
          // Borcu azaltmak için quantity'yi ekleriz (negatif değere pozitif eklenir)
          productBalances[transaction.productType] = (productBalances[transaction.productType] || 0) + transaction.quantity;
        }
        break;

      case 'urun_ile_odeme_alindi': // Ürün ile ödeme aldık - toptancının bize olan borcu azaldı
        // Ürün aldık, karşılığında para alacağı azaldı (para vermiş gibi)
        moneyBalance -= transaction.amount;
        if (transaction.productType && transaction.quantity) {
          // Alacaklı ürünümüzle ödeme aldık = Ürün alacağımız azaldı
          productBalances[transaction.productType] = (productBalances[transaction.productType] || 0) - transaction.quantity;
        }
        break;

      case 'urun_ile_borc_verme': // Ürün ile borç verdik - toptancıya alacağımız oluştu
        // Ürün verdik, karşılığında para alacağı oluştu
        moneyBalance += transaction.amount;
        if (transaction.productType && transaction.quantity) {
          // Toptancıya ürün verdik = Bizim ürün alacağımız arttı
          productBalances[transaction.productType] = (productBalances[transaction.productType] || 0) + transaction.quantity;
        }
        break;

      case 'urun_ile_borc_alma': // Ürün ile borç aldık - toptancıya borcumuz oluştu
        // Ürün aldık, karşılığında para borcu oluştu
        moneyBalance -= transaction.amount;
        if (transaction.productType && transaction.quantity) {
          // Toptancıdan ürün aldık = Bizim ürün borcumuz arttı
          productBalances[transaction.productType] = (productBalances[transaction.productType] || 0) - transaction.quantity;
        }
        break;
    }
  });

  // Apply precision rounding to all product balances
  const roundedProductBalances: Record<string, number> = {};
  Object.keys(productBalances).forEach(productType => {
    roundedProductBalances[productType] = roundToPrecision(productBalances[productType], 3);
  });

  return { moneyBalance: roundToPrecision(moneyBalance, 2), productBalances: roundedProductBalances };
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
}

export function formatDate(date: Date): string {
  // Safe date formatting
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date for formatting:', date);
      return new Date().toLocaleDateString('tr-TR');
    }
    
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return new Date().toLocaleDateString('tr-TR'); // Fallback to current date
  }
}

export function formatDateTime(date: Date): string {
  // Safe date-time formatting
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date for formatting:', date);
      return new Date().toLocaleString('tr-TR');
    }
    
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.warn('Error formatting date time:', date, error);
    return new Date().toLocaleString('tr-TR'); // Fallback to current date
  }
}