import { useState } from 'react';
import { ArrowLeft, Plus, CreditCard as Edit, Trash2, FileText, User, Phone, Calendar, Calculator, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Trader, Transaction, ProductType } from '../types';
import { calculateBalances, formatMoney, formatDate, formatDateTime } from '../utils/calculations';
import { transactionTypeLabels } from '../data/defaultData';
import { generatePDFContent, downloadPDF } from '../utils/pdfGenerator';
import { useResponsive, usePaginatedData } from '../hooks/usePerformanceOptimization';
import { useTheme } from '../contexts/ThemeContext';
import DebtCalculator from './DebtCalculator';

interface TraderDetailProps {
  trader: Trader;
  transactions: Transaction[];
  productTypes: ProductType[];
  onBack: () => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onConvertDebt: (conversionData: {
    debtProductId: string;
    debtAmount: number;
    receivableProductId: string;
    receivableAmount: number;
    multiplier: number;
  }) => void;
}

export default function TraderDetail({
  trader,
  transactions: allTransactions,
  productTypes,
  onBack,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onConvertDebt
}: TraderDetailProps) {
  const { isMobile, isTablet, isTouchDevice } = useResponsive();
  const { currentTheme } = useTheme();
  
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDebtCalculator, setShowDebtCalculator] = useState(false);
  const [showPDFSettings, setShowPDFSettings] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState<string>('');
  const [pdfEndDate, setPdfEndDate] = useState<string>('');
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [balanceDate, setBalanceDate] = useState<string>(''); // New state for balance date filter

  const traderTransactions = allTransactions
    .filter(t => t.traderId === trader.id)
    .filter(t => transactionFilter === 'all' || t.type === transactionFilter) // Apply filter
    .sort((a, b) => {
      // Safe date parsing for sorting
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.warn('Invalid date for sorting:', a.date, b.date);
          return 0; // Maintain original order for invalid dates
        }
        
        return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.warn('Error sorting transactions by date:', error);
        return 0; // Maintain original order on error
      }
    });

  // Paginate transactions for performance
  const {
    paginatedData: paginatedTransactions,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPrevPage
  } = usePaginatedData(traderTransactions, isMobile ? 10 : 20); // Back to original page size

  // Calculate product balances up to a specific date
  const calculateBalancesUpToDate = (targetDate?: string) => {
    let filteredTransactions = allTransactions.filter(t => t.traderId === trader.id);
    
    // If a date is specified, filter transactions up to that date
    if (targetDate) {
      const targetDateTime = new Date(targetDate).getTime();
      filteredTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.date).getTime();
        return transactionDate <= targetDateTime;
      });
    }
    
    // Calculate balances using the same logic as in calculations.ts
    let moneyBalance = 0;
    const productBalances: Record<string, number> = {};

    filteredTransactions.forEach(transaction => {
      switch (transaction.type) {
        case 'mal_alimi':
          moneyBalance -= transaction.amount;
          if (transaction.productType && transaction.quantity) {
            productBalances[transaction.productType] = 
              (productBalances[transaction.productType] || 0) + transaction.quantity;
          }
          break;
        case 'mal_satisi':
          moneyBalance += transaction.amount;
          if (transaction.productType && transaction.quantity) {
            productBalances[transaction.productType] = 
              (productBalances[transaction.productType] || 0) - transaction.quantity;
          }
          break;
        case 'odeme_yapildi':
          moneyBalance += transaction.amount;
          break;
        case 'tahsilat':
          moneyBalance -= transaction.amount;
          break;
        case 'nakit_borc':
          moneyBalance += transaction.amount;
          break;
        case 'nakit_tahsilat':
          moneyBalance -= transaction.amount;
          break;
        case 'urun_ile_odeme_yapildi':
          moneyBalance += transaction.amount;
          if (transaction.productType && transaction.quantity) {
            productBalances[transaction.productType] = 
              (productBalances[transaction.productType] || 0) + transaction.quantity;
          }
          break;
        case 'urun_ile_odeme_alindi':
          moneyBalance -= transaction.amount;
          if (transaction.productType && transaction.quantity) {
            productBalances[transaction.productType] = 
              (productBalances[transaction.productType] || 0) - transaction.quantity;
          }
          break;
        case 'urun_ile_borc_verme':
          moneyBalance += transaction.amount;
          if (transaction.productType && transaction.quantity) {
            productBalances[transaction.productType] = 
              (productBalances[transaction.productType] || 0) + transaction.quantity;
          }
          break;
        case 'urun_ile_borc_alma':
          moneyBalance -= transaction.amount;
          if (transaction.productType && transaction.quantity) {
            productBalances[transaction.productType] = 
              (productBalances[transaction.productType] || 0) - transaction.quantity;
          }
          break;
      }
    });

    // Apply precision rounding
    const roundedProductBalances: Record<string, number> = {};
    Object.keys(productBalances).forEach(productType => {
      roundedProductBalances[productType] = Math.round((productBalances[productType] + Number.EPSILON) * 1000) / 1000;
    });

    return {
      moneyBalance: Math.round((moneyBalance + Number.EPSILON) * 100) / 100,
      productBalances: roundedProductBalances
    };
  };

  // Get current balances (all transactions)
  const { moneyBalance, productBalances } = calculateBalancesUpToDate();
  
  // Get balances for the selected date
  const historicalBalances = balanceDate ? calculateBalancesUpToDate(balanceDate) : null;

  // Use historical balances if a date is selected, otherwise use current balances
  const displayBalances = historicalBalances || { moneyBalance, productBalances };

  const productTypeMap = productTypes.reduce((acc, pt) => {
    acc[pt.id] = pt;
    return acc;
  }, {} as Record<string, ProductType>);

  // Date range utility functions
  const getDateRanges = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // This week (Monday to Sunday)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // This month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      today: {
        start: todayStr,
        end: todayStr,
        label: 'Bugün'
      },
      week: {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
        label: 'Bu Hafta'
      },
      month: {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0],
        label: 'Bu Ay'
      }
    };
  };

  const handleDateRangePreset = (range: { start: string; end: string }) => {
    setPdfStartDate(range.start);
    setPdfEndDate(range.end);
  };

  const handleClearDates = () => {
    setPdfStartDate('');
    setPdfEndDate('');
  };

  const handleGeneratePDF = () => {
    try {
      // Tüm işlemleri gönder (bakiye hesaplaması için)
      // Tarih aralığı filtresi PDF generator içinde yapılacak
      const dateRange = pdfStartDate || pdfEndDate ? { start: pdfStartDate, end: pdfEndDate } : undefined;
      const content = generatePDFContent(trader, allTransactions, productTypes, 1, 'A4', dateRange);
      const fileName = pdfStartDate && pdfEndDate ? 
        `_${pdfStartDate}_${pdfEndDate}` : 
        `_${formatDate(new Date()).replace(/\./g, '_')}`;
      
      if (import.meta.env.DEV) {
        console.log('Generating PDF for trader:', trader.name);
        console.log('Content length:', content.length);
      }
      
      downloadPDF(content, `${trader.name}_rapor${fileName}.html`);
      setShowPDFSettings(false);
      
      // Success message
      setTimeout(() => {
        alert('PDF raporu başarıyla oluşturuldu ve indirildi!');
      }, 500);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'mal_alimi':
      case 'nakit_borc':
        return 'bg-red-100 text-red-800';
      case 'mal_satisi':
      case 'tahsilat':
      case 'nakit_tahsilat':
        return 'bg-green-100 text-green-800';
      case 'odeme_yapildi':
        return 'bg-blue-100 text-blue-800';
      case 'urun_ile_odeme_yapildi':
        return 'bg-purple-100 text-purple-800';
      case 'urun_ile_odeme_alindi':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Transaction type options for filter
  const transactionTypes = [
    { value: 'all', label: 'Tüm İşlemler' },
    { value: 'mal_alimi', label: 'Mal Alımı' },
    { value: 'mal_satisi', label: 'Mal Satışı' },
    { value: 'odeme_yapildi', label: 'Ödeme Yapıldı' },
    { value: 'tahsilat', label: 'Tahsilat' },
    { value: 'nakit_borc', label: 'Nakit Borç' },
    { value: 'nakit_tahsilat', label: 'Nakit Tahsilat' },
    { value: 'urun_ile_odeme_yapildi', label: 'Ürün ile Ödeme Yapıldı' },
    { value: 'urun_ile_odeme_alindi', label: 'Ürün ile Ödeme Alındı' },
    { value: 'urun_ile_borc_verme', label: 'Ürün ile Borç Verme' },
    { value: 'urun_ile_borc_alma', label: 'Ürün ile Borç Alma' }
  ];

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? 'px-2' : ''}`}>
      {/* Header */}
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'} mb-4`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-col md:flex-row md:items-center md:justify-between'} mb-6`}>
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <button
              onClick={onBack}
              className={`flex items-center space-x-2 transition-colors ${isTouchDevice ? 'p-2 rounded-md' : ''}`}
              style={{ color: currentTheme.primary }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Geri</span>
            </button>
            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center`} style={{ backgroundColor: currentTheme.primaryLight }}>
              <User className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} style={{ color: currentTheme.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-800 truncate`}>{trader.name}</h1>
              <div className={`flex items-center text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
                {trader.phone && (
                  <>
                    <Phone className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                    <span className={`mr-4 ${isMobile ? 'truncate' : ''}`}>{trader.phone}</span>
                  </>
                )}
                <Calendar className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                <span className="truncate">Son işlem: {formatDate(trader.lastTransactionDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDebtCalculator(true)}
              className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Calculator className="w-4 h-4" />
              <span>Borç Hesapla</span>
            </button>
            <button
              onClick={() => setShowPDFSettings(true)}
              className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors"
              style={{ backgroundColor: currentTheme.secondary }}
            >
              <FileText className="w-4 h-4" />
              <span>PDF Rapor</span>
            </button>
            <button
              onClick={onAddTransaction}
              className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors"
              style={{ backgroundColor: currentTheme.accent }}
            >
              <Plus className="w-4 h-4" />
              <span>Yeni İşlem</span>
            </button>
          </div>
        </div>

        {/* Bakiye Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Para Bakiyesi */}
          <div className={`p-4 rounded-lg`} style={{ backgroundColor: displayBalances.moneyBalance >= 0 ? currentTheme.positiveLight : currentTheme.negativeLight }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Para Bakiyesi</h3>
                <div className={`text-2xl font-bold`} style={{ color: displayBalances.moneyBalance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                  {displayBalances.moneyBalance >= 0 ? '+' : ''}
                  {formatMoney(displayBalances.moneyBalance)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {displayBalances.moneyBalance >= 0 ? 'Alacak' : 'Borç'}
                </div>
              </div>
              {historicalBalances && (
                <div className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                  {new Date(balanceDate).toLocaleDateString('tr-TR')}
                </div>
              )}
            </div>
          </div>

          {/* Ürün Bakiyeleri */}
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-gray-700">Ürün Bakiyeleri</h3>
              {historicalBalances && (
                <div className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                  {new Date(balanceDate).toLocaleDateString('tr-TR')}
                </div>
              )}
            </div>
            
            {/* Date filter for balances */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tarihe Göre Görüntüle
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={balanceDate}
                  onChange={(e) => setBalanceDate(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {balanceDate && (
                  <button
                    onClick={() => setBalanceDate('')}
                    className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Temizle
                  </button>
                )}
              </div>
            </div>
            
            {Object.entries(displayBalances.productBalances).some(([, balance]) => balance !== 0) ? (
              <div className="space-y-3">
                {/* Alacaklar */}
                {Object.entries(displayBalances.productBalances).some(([, balance]) => balance > 0) && (
                  <div>
                    <h4 className="text-xs font-medium mb-1" style={{ color: currentTheme.positive }}>Toptancıdan Alacaklarım</h4>
                    <div className="space-y-1">
                      {Object.entries(displayBalances.productBalances).map(([productId, balance]) => {
                        if (balance <= 0) return null;
                        const product = productTypeMap[productId];
                        if (!product) return null;
                        
                        return (
                          <div key={productId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{product.name}</span>
                            <span style={{ color: currentTheme.positive }}>
                              +{balance} {product.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Borçlar */}
                {Object.entries(displayBalances.productBalances).some(([, balance]) => balance < 0) && (
                  <div>
                    <h4 className="text-xs font-medium mb-1" style={{ color: currentTheme.negative }}>Toptancıya Olan Borçlarım</h4>
                    <div className="space-y-1">
                      {Object.entries(displayBalances.productBalances).map(([productId, balance]) => {
                        if (balance >= 0) return null;
                        const product = productTypeMap[productId];
                        if (!product) return null;
                        
                        return (
                          <div key={productId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{product.name}</span>
                            <span style={{ color: currentTheme.negative }}>
                              {balance} {product.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Ürün bakiyesi yok</div>
            )}
          </div>
        </div>

        {/* Notlar */}
        {trader.notes && (
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: currentTheme.accentLight }}>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notlar</h3>
            <p className="text-sm text-gray-600">{trader.notes}</p>
          </div>
        )}
      </div>

      {/* İşlemler */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                İşlem Geçmişi ({traderTransactions.length})
              </h2>
              
              {/* Mobile Filter Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtre</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Desktop Filter Dropdown */}
              <div className="hidden md:block">
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Tarih: {sortOrder === 'desc' ? 'Yeniden Eskiye' : 'Eskiden Yeniye'}
              </button>
            </div>
          </div>
          
          {/* Mobile Filter Dropdown */}
          {showFilterDropdown && (
            <div className="md:hidden mt-4">
              <select
                value={transactionFilter}
                onChange={(e) => {
                  setTransactionFilter(e.target.value);
                  setShowFilterDropdown(false);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {transactionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlem Türü
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miktar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Birim Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notlar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.map(transaction => {
                const product = transaction.productType ? productTypeMap[transaction.productType] : null;
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                        {transactionTypeLabels[transaction.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product ? product.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.quantity && product ? `${transaction.quantity} ${product.unit}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.unitPrice ? formatMoney(transaction.unitPrice) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMoney(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
                              onDeleteTransaction(transaction.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {traderTransactions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">Henüz işlem bulunmuyor</div>
              <button
                onClick={onAddTransaction}
                className="text-white"
                style={{ backgroundColor: currentTheme.primary }}
              >
                İlk işlemi ekleyin
              </button>
            </div>
          )}
          
          {/* Pagination Controls - Always visible on mobile */}
          {traderTransactions.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                Toplam {traderTransactions.length} işlem - Sayfa {currentPage} / {totalPages}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className={`px-3 py-1 rounded-md text-sm ${
                    hasPrevPage 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Önceki
                </button>
                
                {/* Page numbers - Show all pages on mobile, limited on desktop */}
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  
                  // On mobile, show all pages
                  // On desktop, show current page and nearby pages
                  if (isMobile || 
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  
                  // Show ellipsis for skipped pages (desktop only)
                  if (!isMobile && (pageNum === currentPage - 3 || pageNum === currentPage + 3)) {
                    return (
                      <span key={pageNum} className="px-1 py-1 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  
                  return null;
                })}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage}
                  className={`px-3 py-1 rounded-md text-sm ${
                    hasNextPage 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debt Calculator Modal */}
      {showDebtCalculator && (
        <DebtCalculator
          trader={trader}
          productTypes={productTypes}
          onClose={() => setShowDebtCalculator(false)}
          onConvert={onConvertDebt}
        />
      )}

      {/* PDF Settings Modal */}
      {showPDFSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  PDF Rapor Ayarları
                </h2>
              </div>
              <button
                onClick={() => setShowPDFSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Date Range Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Hızlı Tarih Seçimi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(getDateRanges()).map(([key, range]) => (
                    <button
                      key={key}
                      onClick={() => handleDateRangePreset({ start: range.start, end: range.end })}
                      className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-800 transition-colors"
                    >
                      {range.label}
                    </button>
                  ))}
                  <button
                    onClick={handleClearDates}
                    className="flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 hover:text-red-800 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Yukarıdaki butonlarla hızlı tarih aralığı seçebilir, manuel olarak belirleyebilir veya tarih aralığını temizleyebilirsiniz
                </p>
              </div>

              {/* Manual Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={pdfStartDate}
                  onChange={(e) => setPdfStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Boş bırakırsanız tüm geçmiş dahil edilir
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={pdfEndDate}
                  onChange={(e) => setPdfEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Boş bırakırsanız bugüne kadar dahil edilir
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleGeneratePDF}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF Oluştur</span>
                </button>
                <button
                  onClick={() => setShowPDFSettings(false)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>İptal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}