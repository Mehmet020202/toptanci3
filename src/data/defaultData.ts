import { ProductType } from '../types';

export const defaultProductTypes: ProductType[] = [
  { id: 'altin', name: 'Altın', unit: 'gram', currentPrice: 3500 },
  { id: 'ceyrek', name: 'Çeyrek', unit: 'adet', currentPrice: 6500 },
  { id: 'yarim', name: 'Yarım', unit: 'adet', currentPrice: 13000 },
  { id: 'tam', name: 'Tam Altın', unit: 'adet', currentPrice: 26000 },
  { id: 'ata', name: 'Ata Lira', unit: 'adet', currentPrice: 28000 },
  { id: 'resat', name: 'Reşat', unit: 'adet', currentPrice: 29000 },
  { id: 'hurda', name: 'Hurda', unit: 'gram', currentPrice: 3400 },
  { id: 'dolar', name: 'Dolar', unit: 'adet', currentPrice: 34 },
  { id: 'euro', name: 'Euro', unit: 'adet', currentPrice: 36 }
];

export const transactionTypeLabels = {
  mal_alimi: 'Mal Alımı',
  mal_satisi: 'Mal Satışı',
  odeme_yapildi: 'Nakit Ödeme Yaptım',
  tahsilat: 'Nakit Tahsilat Yaptım (Borcum Arttı)',
  nakit_borc: 'Nakit Borç Verdim',
  nakit_tahsilat: 'Nakit Tahsilat Yaptım (Borcum Arttı)',
  urun_ile_odeme_yapildi: 'Ürün ile Ödeme Yaptım (Borcum Azaldı)',
  urun_ile_odeme_alindi: 'Ürün ile Ödeme Aldım (Alacağım Azaldı)',
  urun_ile_borc_verme: 'Ürün ile Borç Verdim (Alacak Oluştu)',
  urun_ile_borc_alma: 'Ürün ile Borç Aldım (Borç Oluştu)'
};