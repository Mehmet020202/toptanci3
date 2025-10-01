import React, { useState, useEffect } from 'react';
import { Save, X, Calculator } from 'lucide-react';
import { Transaction, TransactionType, ProductType, Trader } from '../types';
import { transactionTypeLabels } from '../data/defaultData';
import { useTheme } from '../contexts/ThemeContext';

interface TransactionFormProps {
  transaction?: Transaction;
  traders: Trader[];
  productTypes: ProductType[];
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  selectedTraderId?: string;
}

export default function TransactionForm({
  transaction,
  traders,
  productTypes,
  onSave,
  onCancel,
  selectedTraderId
}: TransactionFormProps) {
  const { currentTheme } = useTheme();

  // Safe date initialization
  const getInitialDate = () => {
    try {
      if (transaction?.date) {
        const dateStr = transaction.date.toISOString().slice(0, 16);
        // Validate the date string
        const testDate = new Date(dateStr);
        if (!isNaN(testDate.getTime())) {
          return dateStr;
        }
      }
      return new Date().toISOString().slice(0, 16);
    } catch (error) {
      console.warn('Error initializing date:', error);
      return new Date().toISOString().slice(0, 16);
    }
  };

  const [traderId, setTraderId] = useState(transaction?.traderId || selectedTraderId || '');
  const [date, setDate] = useState(getInitialDate());
  const [type, setType] = useState<TransactionType>(transaction?.type || 'mal_alimi');
  const [productType, setProductType] = useState(transaction?.productType || '');
  const [quantity, setQuantity] = useState(transaction?.quantity?.toString() || '');
  const [unitPrice, setUnitPrice] = useState(transaction?.unitPrice?.toString() || '');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [showProductFields, setShowProductFields] = useState(false);

  const needsProduct = ['mal_alimi', 'mal_satisi', 'urun_ile_odeme_yapildi', 'urun_ile_odeme_alindi', 'urun_ile_borc_verme', 'urun_ile_borc_alma'].includes(type);
  const needsAmount = ['odeme_yapildi', 'tahsilat', 'nakit_borc', 'nakit_tahsilat'].includes(type);
  const needsUnitPrice = ['mal_alimi', 'mal_satisi'].includes(type); // Sadece mal alımı ve satışında birim fiyat gerekli
  const needsCalculatedAmount = !['urun_ile_borc_verme', 'urun_ile_borc_alma', 'urun_ile_odeme_yapildi', 'urun_ile_odeme_alindi'].includes(type); // Ürün ile borç/ödeme işlemlerinde tutar hesaplanmaz

  // Yeni işlem için tarih ve saati sürekli güncelle
  useEffect(() => {
    if (!transaction) {
      const updateTime = () => {
        setDate(new Date().toISOString().slice(0, 16));
      };
      updateTime(); // İlk yüklenmede
      const interval = setInterval(updateTime, 1000); // Her saniye güncelle
      return () => clearInterval(interval);
    }
  }, [transaction]);

  useEffect(() => {
    setShowProductFields(needsProduct);
    if (!needsProduct) {
      setProductType('');
      setQuantity('');
      setUnitPrice('');
    }
    if (!needsAmount && needsProduct) {
      // Ürün işlemleri için miktarı sıfırla ama hesaplama yapılacak
      setAmount('');
    }
    // Ürün ile borç işlemlerinde tutarı 0 yap
    if (['urun_ile_borc_verme', 'urun_ile_borc_alma'].includes(type)) {
      setAmount('0');
    }
    // Birim fiyatı temizleme - kullanıcı manuel yazmalı bu yüzden temizlemeyelim
  }, [type, needsProduct, needsAmount, needsUnitPrice, transaction]);

  useEffect(() => {
    if (needsProduct && productType && quantity && needsUnitPrice && unitPrice && needsCalculatedAmount) {
      const calculatedAmount = parseFloat(quantity) * parseFloat(unitPrice);
      setAmount(calculatedAmount.toString());
    }
  }, [productType, quantity, unitPrice, needsProduct, needsUnitPrice, needsCalculatedAmount]);

  useEffect(() => {
    if (productType && productTypes.length > 0 && needsUnitPrice) {
      const product = productTypes.find(pt => pt.id === productType);
      if (product) {
        // Sadece düzenleme modunda değilsek ve birim fiyat hiç girilmemişse varsayılan fiyatı göster
        // Ancak kullanıcı manuel olarak yazmalı
        if (!transaction && (!unitPrice || unitPrice === '')) {
          setUnitPrice(product.currentPrice.toString());
        }
      }
    }
  }, [productType, productTypes, needsUnitPrice, transaction, unitPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ürün ile borç işlemlerinde amount kontrolü yok
    if (!traderId || (!amount && needsCalculatedAmount)) return;

    // Safe date creation
    let transactionDate: Date;
    try {
      transactionDate = new Date(); // Her zaman şu anki gerçek tarih ve saat
      if (isNaN(transactionDate.getTime())) {
        transactionDate = new Date(); // Fallback to current date
      }
    } catch (error) {
      console.warn('Error creating transaction date:', error);
      transactionDate = new Date(); // Fallback to current date
    }

    const transactionData: Omit<Transaction, 'id'> = {
      traderId,
      date: transactionDate,
      type,
      amount: needsCalculatedAmount ? parseFloat(amount) : 0,
      notes,
    };

    if (needsProduct && productType) {
      transactionData.productType = productType;
      transactionData.quantity = parseFloat(quantity);
      if (needsUnitPrice && unitPrice) {
        transactionData.unitPrice = parseFloat(unitPrice);
      }
    }

    onSave(transactionData);
  };

  const selectedProduct = productTypes.find(pt => pt.id === productType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {transaction ? 'İşlem Düzenle' : 'Yeni İşlem Ekle'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toptancı *
              </label>
              <select
                value={traderId}
                onChange={(e) => setTraderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seçin...</option>
                {traders.map(trader => (
                  <option key={trader.id} value={trader.id}>
                    {trader.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih ve Saat
              </label>
              <input
                type="datetime-local"
                value={date}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Otomatik olarak şu anki tarih ve saat eklenir
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşlem Türü *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(transactionTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {showProductFields && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Türü *
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seçin...</option>
                  {productTypes.map(pt => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.unit})
                    </option>
                  ))}
                </select>
              </div>

              {productType && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Miktar Hesaplama</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Miktar ({selectedProduct?.unit}) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`${selectedProduct?.unit} cinsinden`}
                        required
                      />
                    </div>

                    {needsUnitPrice && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Birim Fiyat (TL) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Birim fiyatı girin"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {quantity && needsUnitPrice && unitPrice && needsCalculatedAmount && (
                    <div className="text-center p-2 bg-white rounded border">
                      <span className="text-sm text-gray-600">Hesaplanan Toplam: </span>
                      <span className="font-bold text-lg text-blue-600">
                        {(parseFloat(quantity) * parseFloat(unitPrice)).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {needsAmount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tutar (TL) *
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          )}

          {!needsAmount && showProductFields && needsCalculatedAmount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toplam Tutar (TL)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Otomatik hesaplanacak"
                readOnly={!!(quantity && needsUnitPrice && unitPrice)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="İşlem notları..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 text-white py-3 px-4 rounded-md transition-colors"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Save className="w-4 h-4" />
              <span>Kaydet</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>İptal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}