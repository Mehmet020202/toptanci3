import { useState } from 'react';
import { TrendingUp, TrendingDown, Package, DollarSign, Trash2, AlertTriangle, Palette } from 'lucide-react';
import { Trader, Transaction, ProductType } from '../types';
import { calculateBalances, formatMoney } from '../utils/calculations';
import { useResponsive } from '../hooks/usePerformanceOptimization';

interface ReportPageProps {
  traders: Trader[];
  transactions: Transaction[];
  productTypes: ProductType[];
  onDeleteTrader: (traderId: string) => void;
}

// Tema tanımlamaları
const themes = {
  default: {
    name: 'Varsayılan',
    primary: '#3b82f6', // blue-500
    primaryLight: '#dbeafe', // blue-100
    primaryDark: '#2563eb', // blue-600
    secondary: '#10b981', // emerald-500
    secondaryLight: '#d1fae5', // emerald-100
    secondaryDark: '#059669', // emerald-600
    accent: '#8b5cf6', // violet-500
    accentLight: '#ede9fe', // violet-100
    accentDark: '#7c3aed', // violet-600
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-100
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-100
    negativeDark: '#dc2626', // red-600
  },
  dark: {
    name: 'Koyu',
    primary: '#6b7280', // gray-500
    primaryLight: '#1f2937', // gray-800
    primaryDark: '#111827', // gray-900
    secondary: '#3b82f6', // blue-500
    secondaryLight: '#1e3a8a', // blue-800
    secondaryDark: '#1e40af', // blue-900
    accent: '#8b5cf6', // violet-500
    accentLight: '#5b21b6', // violet-800
    accentDark: '#4c1d95', // violet-900
    positive: '#10b981', // emerald-500
    positiveLight: '#064e3b', // emerald-800
    positiveDark: '#047857', // emerald-900
    negative: '#ef4444', // red-500
    negativeLight: '#7f1d1d', // red-800
    negativeDark: '#991b1b', // red-900
  },
  warm: {
    name: 'Sıcak',
    primary: '#f97316', // orange-500
    primaryLight: '#fff7ed', // orange-50
    primaryDark: '#ea580c', // orange-600
    secondary: '#ef4444', // red-500
    secondaryLight: '#fee2e2', // red-50
    secondaryDark: '#dc2626', // red-600
    accent: '#eab308', // yellow-500
    accentLight: '#fefce8', // yellow-50
    accentDark: '#ca8a04', // yellow-600
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-50
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-50
    negativeDark: '#dc2626', // red-600
  },
  cool: {
    name: 'Soğuk',
    primary: '#14b8a6', // teal-500
    primaryLight: '#ccfbf1', // teal-100
    primaryDark: '#0d9488', // teal-600
    secondary: '#06b6d4', // cyan-500
    secondaryLight: '#cffafe', // cyan-100
    secondaryDark: '#0891b2', // cyan-600
    accent: '#6366f1', // indigo-500
    accentLight: '#e0e7ff', // indigo-100
    accentDark: '#4f46e5', // indigo-600
    positive: '#10b981', // emerald-500
    positiveLight: '#d1fae5', // emerald-50
    positiveDark: '#059669', // emerald-600
    negative: '#ef4444', // red-500
    negativeLight: '#fee2e2', // red-50
    negativeDark: '#dc2626', // red-600
  }
};

export default function ReportPage({ traders, transactions, productTypes, onDeleteTrader }: ReportPageProps) {
  const { isMobile, isTablet } = useResponsive();
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('default');
  
  const currentTheme = themes[selectedTheme];
  
  const productTypeMap = productTypes.reduce((acc, pt) => {
    acc[pt.id] = pt;
    return acc;
  }, {} as Record<string, ProductType>);

  // Genel toplamları hesapla
  let totalMoneyReceivable = 0; // Toplam para alacağı
  let totalMoneyDebt = 0; // Toplam para borcu
  const totalProductBalances: Record<string, number> = {};

  traders.forEach(trader => {
    const { moneyBalance, productBalances } = calculateBalances(trader, transactions);
    
    if (moneyBalance > 0) {
      totalMoneyReceivable += moneyBalance;
    } else {
      totalMoneyDebt += Math.abs(moneyBalance);
    }

    Object.entries(productBalances).forEach(([productId, balance]) => {
      totalProductBalances[productId] = (totalProductBalances[productId] || 0) + balance;
    });
  });

  const netMoneyBalance = totalMoneyReceivable - totalMoneyDebt;

  // İstatistikler
  const totalTransactions = transactions.length;
  const activeTraders = traders.filter(trader => {
    const { moneyBalance, productBalances } = calculateBalances(trader, transactions);
    return moneyBalance !== 0 || Object.values(productBalances).some(balance => balance !== 0);
  }).length;

  return (
    <div className={`max-w-6xl mx-auto space-y-${isMobile ? '4' : '6'} ${isMobile ? 'px-2' : ''}`}>
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 leading-tight tracking-tight`}>Genel Rapor</h1>
          
          {/* Tema Seçici */}
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Palette className="w-5 h-5 text-gray-600" />
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as keyof typeof themes)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(themes).map(([key, theme]) => (
                <option key={key} value={key}>{theme.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Özet Kartları */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'} mb-${isMobile ? '6' : '8'}`}>
          <div className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.primaryLight }}>
            <div className={`flex items-center ${isMobile ? 'flex-col space-y-1' : 'justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`} style={{ color: `${currentTheme.primary}CC` }}>Toplam Toptancı</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: currentTheme.primary }}>{traders.length}</p>
              </div>
              {!isMobile && <Package className="w-8 h-8" style={{ color: currentTheme.primary }} />}
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.secondaryLight }}>
            <div className={`flex items-center ${isMobile ? 'flex-col space-y-1' : 'justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`} style={{ color: `${currentTheme.secondary}CC` }}>Aktif Hesap</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: currentTheme.secondary }}>{activeTraders}</p>
              </div>
              {!isMobile && <TrendingUp className="w-8 h-8" style={{ color: currentTheme.secondary }} />}
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.accentLight }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `${currentTheme.accent}CC` }}>Toplam İşlem</p>
                <p className="text-2xl font-bold" style={{ color: currentTheme.accent }}>{totalTransactions}</p>
              </div>
              <DollarSign className="w-8 h-8" style={{ color: currentTheme.accent }} />
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: netMoneyBalance >= 0 ? currentTheme.positiveLight : currentTheme.negativeLight }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: netMoneyBalance >= 0 ? `${currentTheme.positive}CC` : `${currentTheme.negative}CC` }}>
                  Net Bakiye
                </p>
                <p className="text-2xl font-bold" style={{ color: netMoneyBalance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                  {netMoneyBalance >= 0 ? '+' : ''}
                  {formatMoney(netMoneyBalance)}
                </p>
              </div>
              {netMoneyBalance >= 0 ? (
                <TrendingUp className="w-8 h-8" style={{ color: netMoneyBalance >= 0 ? currentTheme.positive : currentTheme.negative }} />
              ) : (
                <TrendingDown className="w-8 h-8" style={{ color: netMoneyBalance >= 0 ? currentTheme.positive : currentTheme.negative }} />
              )}
            </div>
          </div>
        </div>

        {/* Para Bakiyeleri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-lg" style={{ backgroundColor: currentTheme.positiveLight }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: `${currentTheme.positive}CC` }}>Para Alacakları</h3>
            <div className="text-3xl font-bold mb-2" style={{ color: currentTheme.positive }}>
              +{formatMoney(totalMoneyReceivable)}
            </div>
            <p className="text-sm" style={{ color: `${currentTheme.positive}CC` }}>
              Toplam {traders.filter(t => {
                const { moneyBalance } = calculateBalances(t, transactions);
                return moneyBalance > 0;
              }).length} toptancıdan alacağınız var
            </p>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: currentTheme.negativeLight }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: `${currentTheme.negative}CC` }}>Para Borçları</h3>
            <div className="text-3xl font-bold mb-2" style={{ color: currentTheme.negative }}>
              -{formatMoney(totalMoneyDebt)}
            </div>
            <p className="text-sm" style={{ color: `${currentTheme.negative}CC` }}>
              Toplam {traders.filter(t => {
                const { moneyBalance } = calculateBalances(t, transactions);
                return moneyBalance < 0;
              }).length} toptancıya borcunuz var
            </p>
          </div>
        </div>

        {/* Ürün Bakiyeleri */}
        {Object.keys(totalProductBalances).some(key => totalProductBalances[key] !== 0) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Toplam Ürün Bakiyeleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(totalProductBalances).map(([productId, balance]) => {
                if (balance === 0) return null;
                const product = productTypeMap[productId];
                if (!product) return null;

                return (
                  <div
                    key={productId}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: balance >= 0 ? currentTheme.positiveLight : currentTheme.negativeLight }}
                  >
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {product.name}
                    </div>
                    <div className="text-xl font-bold" style={{ color: balance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                      {balance >= 0 ? '+' : ''}
                      {balance} {product.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      {balance >= 0 ? 'Alacak' : 'Borç'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toptancı Detayları */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Toptancı Detayları</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Toptancı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Para Bakiyesi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    İşlem Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ürün Bakiyeleri
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {traders.map(trader => {
                  const { moneyBalance, productBalances } = calculateBalances(trader, transactions);
                  const traderTransactions = transactions.filter(t => t.traderId === trader.id);
                  
                  return (
                    <tr key={trader.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{trader.name}</div>
                        {trader.phone && (
                          <div className="text-sm text-gray-500">{trader.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium" style={{ color: moneyBalance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                          {moneyBalance >= 0 ? '+' : ''}
                          {formatMoney(moneyBalance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {traderTransactions.length} işlem
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {Object.entries(productBalances).filter(([, balance]) => balance !== 0).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(productBalances).map(([productId, balance]) => {
                              if (balance === 0) return null;
                              const product = productTypeMap[productId];
                              if (!product) return null;
                              
                              return (
                                <div key={productId} className="text-xs">
                                  {product.name}: 
                                  <span style={{ color: balance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                                    {' '}{balance >= 0 ? '+' : ''}{balance} {product.unit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Toptancı Silme Bölümü */}
        <div className="mb-8">
          <div className="border rounded-lg p-6" style={{ backgroundColor: currentTheme.negativeLight, borderColor: `${currentTheme.negative}40` }}>
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6" style={{ color: currentTheme.negative }} />
              <h3 className="text-lg font-bold" style={{ color: `${currentTheme.negative}CC` }}>Toptancı Silme İşlemleri</h3>
            </div>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-sm mb-3" style={{ color: `${currentTheme.negative}CC` }}>
                <strong>Dikkat:</strong> Toptancı silme işlemi geri alınamaz. Toptancı silinirken tüm işlem geçmişi de birlikte silinir.
              </p>
              <p className="text-xs text-gray-600">
                Sadece artık çalışmadığınız ve gelecekte işlem yapmayacağınız toptancıları silin.
              </p>
            </div>
            
            <div className="space-y-3">
              {traders.map(trader => {
                const { moneyBalance } = calculateBalances(trader, transactions);
                const traderTransactions = transactions.filter(t => t.traderId === trader.id);
                
                return (
                  <div key={trader.id} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{trader.name}</h4>
                          {trader.phone && (
                            <p className="text-sm text-gray-600">{trader.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="font-medium" style={{ color: moneyBalance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                          Bakiye: {moneyBalance >= 0 ? '+' : ''}{formatMoney(moneyBalance)}
                        </span>
                        <span className="text-gray-500">
                          {traderTransactions.length} işlem
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onDeleteTrader(trader.id)}
                      className="flex items-center space-x-2 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      style={{ backgroundColor: currentTheme.negativeDark }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Sil</span>
                    </button>
                  </div>
                );
              })}
              
              {traders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Silinecek toptancı bulunmamaktadır.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}