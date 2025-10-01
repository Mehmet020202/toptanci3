export interface Trader {
  id: string;
  name: string;
  phone: string;
  notes: string;
  moneyBalance: number; // + alacak, - borç
  productBalances: Record<string, number>; // ürün türüne göre bakiye
  lastTransactionDate: Date;
}

export interface Transaction {
  id: string;
  traderId: string;
  date: Date;
  type: TransactionType;
  productType?: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  notes: string;
}

export type TransactionType = 
  | 'mal_alimi'           // Ürün alma
  | 'mal_satisi'          // Ürün satma
  | 'odeme_yapildi'       // Nakit ödeme
  | 'tahsilat'            // Nakit tahsilat
  | 'nakit_borc'          // Nakit borç verme
  | 'nakit_tahsilat'      // Nakit tahsilat
  | 'urun_ile_odeme_yapildi'  // Ürün ile ödeme yapma
  | 'urun_ile_odeme_alindi'   // Ürün ile ödeme alma
  | 'urun_ile_borc_verme'     // Ürün ile borç verme
  | 'urun_ile_borc_alma';     // Ürün ile borç alma

export interface ProductType {
  id: string;
  name: string;
  unit: 'gram' | 'adet';
  currentPrice: number;
  order?: number; // For custom ordering
}

export interface AppData {
  traders: Trader[];
  transactions: Transaction[];
  productTypes: ProductType[];
}