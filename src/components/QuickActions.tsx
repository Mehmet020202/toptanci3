import { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, CreditCard, Package, Scale, Tag, FileText, Save, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Trader, Transaction, ProductType, TransactionType } from '../types';
import { formatMoney } from '../utils/calculations';
import { transactionTypeLabels } from '../data/defaultData';
import { useResponsive } from '../hooks/usePerformanceOptimization';
import { useTheme } from '../contexts/ThemeContext';

interface QuickActionsProps {
  traders: Trader[];
  productTypes: ProductType[];
  onSaveTransaction: (transactionData: Omit<Transaction, 'id'>) => void;
}

type QuickActionType = 'alim' | 'satim' | 'payment';

export default function QuickActions({
  traders,
  productTypes,
  onSaveTransaction
}: QuickActionsProps) {
  const { isMobile, isTablet, isTouchDevice } = useResponsive();
  const { currentTheme } = useTheme();
  
  const [selectedTrader, setSelectedTrader] = useState<string>('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType>('odeme_yapildi');
  const [quickAction, setQuickAction] = useState<QuickActionType>('payment');
  const [showForm, setShowForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(isMobile); // Collapse on mobile by default

  // Set default unit price when product type is selected
  useEffect(() => {
    if (selectedProductType && productTypes.length > 0 && quickAction !== 'payment') {
      const product = productTypes.find(pt => pt.id === selectedProductType);
      if (product) {
        setUnitPrice(product.currentPrice.toString());
      }
    }
  }, [selectedProductType, productTypes, quickAction]);

  const getTransactionType = (): TransactionType => {
    switch (quickAction) {
      case 'alim': return 'mal_alimi';
      case 'satim': return 'mal_satisi';
      case 'payment': return selectedTransactionType;
      default: return 'mal_alimi';
    }
  };

  const needsProduct = ['mal_alimi', 'mal_satisi', 'urun_ile_odeme_yapildi', 'urun_ile_odeme_alindi', 'urun_ile_borc_verme', 'urun_ile_borc_alma'].includes(quickAction === 'payment' ? selectedTransactionType : getTransactionType());
  const needsUnitPrice = ['mal_alimi', 'mal_satisi'].includes(quickAction === 'payment' ? selectedTransactionType : getTransactionType());
  const needsCalculatedAmount = !['urun_ile_borc_verme', 'urun_ile_borc_alma', 'urun_ile_odeme_yapildi', 'urun_ile_odeme_alindi'].includes(quickAction === 'payment' ? selectedTransactionType : getTransactionType());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTrader) return;
    
    const transactionType = getTransactionType();
    
    // Safe date creation
    let transactionDate: Date;
    try {
      transactionDate = new Date();
      if (isNaN(transactionDate.getTime())) {
        transactionDate = new Date(); // Fallback to current date
      }
    } catch (error) {
      console.warn('Error creating transaction date:', error);
      transactionDate = new Date(); // Fallback to current date
    }
    
    if (quickAction === 'payment') {
      // Payment transaction - handle different types
      if (needsProduct) {
        // Product-based payment transaction
        if (!selectedProductType || !quantity) return;
        
        const calculatedAmount = needsUnitPrice && unitPrice && needsCalculatedAmount ? 
          parseFloat(quantity) * parseFloat(unitPrice) : 
          0; // For product transactions without unit price or debt transactions
        
        const transactionData: Omit<Transaction, 'id'> = {
          traderId: selectedTrader,
          date: transactionDate,
          type: transactionType,
          productType: selectedProductType,
          quantity: parseFloat(quantity),
          unitPrice: needsUnitPrice && unitPrice ? parseFloat(unitPrice) : undefined,
          amount: calculatedAmount,
          notes
        };
        
        onSaveTransaction(transactionData);
      } else {
        // Money-only payment transaction
        if (!unitPrice && needsCalculatedAmount) return;
        
        const transactionData: Omit<Transaction, 'id'> = {
          traderId: selectedTrader,
          date: transactionDate,
          type: transactionType,
          amount: needsCalculatedAmount ? parseFloat(unitPrice) : 0,
          notes
        };
        
        onSaveTransaction(transactionData);
      }
    } else {
      // Buy/Sell transaction - product information needed
      if (!selectedProductType || !quantity || !unitPrice) return;
      
      const calculatedAmount = parseFloat(quantity) * parseFloat(unitPrice);
      
      const transactionData: Omit<Transaction, 'id'> = {
        traderId: selectedTrader,
        date: transactionDate,
        type: getTransactionType(),
        productType: selectedProductType,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        amount: calculatedAmount,
        notes
      };
      
      onSaveTransaction(transactionData);
    }

    // Clear form
    setSelectedProductType('');
    setQuantity('');
    setUnitPrice('');
    setNotes('');
    setShowForm(false);
  };

  const quickActions = [
    {
      id: 'alim' as QuickActionType,
      label: isMobile ? 'Alım' : 'Alım',
      icon: ShoppingCart,
      color: 'bg-blue-600 hover:bg-blue-700',
      activeColor: 'bg-blue-700'
    },
    {
      id: 'satim' as QuickActionType,
      label: isMobile ? 'Satım' : 'Satım',
      icon: TrendingUp,
      color: 'bg-green-600 hover:bg-green-700',
      activeColor: 'bg-green-700'
    },
    {
      id: 'payment' as QuickActionType,
      label: isMobile ? 'Ödeme' : 'Ödemeler',
      icon: CreditCard,
      color: 'bg-purple-600 hover:bg-purple-700',
      activeColor: 'bg-purple-700'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'} mb-4`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 flex items-center leading-tight`}>
          <Zap className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} style={{ color: currentTheme.primary }} />
          Hızlı İşlemler
        </h2>
        {isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={isCollapsed ? 'Genişlet' : 'Daralt'}
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      {(!isMobile || !isCollapsed) && (
        <div className="space-y-4">
          <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-3 gap-3'}`}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isActive = quickAction === action.id;
              
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    setQuickAction(action.id);
                    setShowForm(true);
                  }}
                  className={`flex ${isMobile ? 'flex-col items-center' : 'items-center justify-center'} space-${isMobile ? 'y' : 'x'}-2 ${isMobile ? 'py-3 px-2' : 'py-3 px-4'} rounded-lg text-white font-semibold transition-all ${
                    isActive ? action.activeColor : action.color
                  } ${isTouchDevice ? 'active:scale-95' : 'hover:scale-105'} leading-tight`}
                  style={{ 
                    backgroundColor: isActive ? currentTheme.primary : currentTheme.primaryDark,
                    ...(isActive ? {} : { filter: 'brightness(0.9)' })
                  }}
                >
                  <Icon className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${isMobile ? 'text-center' : ''} font-semibold leading-tight`}>{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Transaction Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className={`space-y-${isMobile ? '3' : '4'} mt-4`}>
          <div>
            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Toptancı *
            </label>
            <select
              value={selectedTrader}
              onChange={(e) => setSelectedTrader(e.target.value)}
              className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isTouchDevice ? 'text-base' : ''}`}
              required
            >
              <option value="">Seçiniz...</option>
              {traders.map(trader => (
                <option key={trader.id} value={trader.id}>
                  {trader.name}
                </option>
              ))}
            </select>
          </div>

          {quickAction === 'payment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşlem Türü *
              </label>
              <select
                value={selectedTransactionType}
                onChange={(e) => setSelectedTransactionType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {Object.entries(transactionTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {needsProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Ürün Türü *
              </label>
              <select
                value={selectedProductType}
                onChange={(e) => setSelectedProductType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seçiniz...</option>
                {productTypes.map(pt => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} ({pt.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          {needsProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Scale className="w-4 h-4 mr-2" />
                Miktar *
              </label>
              <input
                type="number"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`${productTypes.find(pt => pt.id === selectedProductType)?.unit || ''} cinsinden`}
                required
              />
            </div>
          )}

          {/* Amount/Price Input - Hidden for debt transactions */}
          {(quickAction !== 'payment' || (quickAction === 'payment' && needsCalculatedAmount)) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                {quickAction === 'payment' && !needsProduct ? 'Tutar (₺)' : 
                 quickAction === 'payment' && needsProduct && !needsUnitPrice ? 'Toplam Tutar (₺)' :
                 'Birim Fiyat (₺)'} *
              </label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={quickAction === 'payment' && !needsProduct ? 'Tutar girin' : 
                            quickAction === 'payment' && needsProduct && !needsUnitPrice ? 'Toplam tutarı girin' :
                            'Birim fiyatı girin'}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Açıklama
              <span className="text-gray-500 text-xs ml-1">(Opsiyonel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="İsteğe bağlı açıklama..."
            />
          </div>

          {/* Calculated Total */}
          {quickAction !== 'payment' && quantity && unitPrice && needsCalculatedAmount && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: currentTheme.primaryLight, borderColor: `${currentTheme.primary}40` }}>
              <div className="text-center">
                <span className="text-sm text-gray-600">Hesaplanan Toplam: </span>
                <span className="font-bold text-lg" style={{ color: currentTheme.primary }}>
                  {formatMoney(parseFloat(quantity) * parseFloat(unitPrice))}
                </span>
              </div>
            </div>
          )}

          {/* Calculated Total for Payment with Product and Unit Price */}
          {quickAction === 'payment' && needsProduct && needsUnitPrice && quantity && unitPrice && needsCalculatedAmount && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: currentTheme.primaryLight, borderColor: `${currentTheme.primary}40` }}>
              <div className="text-center">
                <span className="text-sm text-gray-600">Hesaplanan Toplam: </span>
                <span className="font-bold text-lg" style={{ color: currentTheme.primary }}>
                  {formatMoney(parseFloat(quantity) * parseFloat(unitPrice))}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 text-white py-3 px-4 rounded-md font-medium transition-colors"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <Save className="w-5 h-5" />
            <span>
              {quickAction === 'alim' ? 'Alım İşlemi Kaydet' :
               quickAction === 'satim' ? 'Satım İşlemi Kaydet' :
               'İşlem Kaydet'}
            </span>
          </button>
        </form>
      )}
        </div>
      )}
    </div>
  );
}