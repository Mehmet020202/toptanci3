
import { TrendingUp, TrendingDown, Package, DollarSign, Trash2, AlertTriangle } from 'lucide-react';
import { Trader, Transaction, ProductType } from '../types';
import { calculateBalances, formatMoney } from '../utils/calculations';
import { useResponsive } from '../hooks/usePerformanceOptimization';

interface ReportPageProps {
  traders: Trader[];
  transactions: Transaction[];
  productTypes: ProductType[];
  onDeleteTrader: (traderId: string) => void;
}

export default function ReportPage({ traders, transactions, productTypes, onDeleteTrader }: ReportPageProps) {
  const { isMobile, isTablet } = useResponsive();
  
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
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-${isMobile ? '4' : '6'} leading-tight tracking-tight`}>Genel Rapor</h1>

        {/* Özet Kartları */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'} mb-${isMobile ? '6' : '8'}`}>
          <div className={`${isMobile ? 'bg-blue-50 p-3' : 'bg-blue-50 p-4'} rounded-lg`}>
            <div className={`flex items-center ${isMobile ? 'flex-col space-y-1' : 'justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-blue-800 leading-tight`}>Toplam Toptancı</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-700 leading-tight`}>{traders.length}</p>
              </div>
              {!isMobile && <Package className="w-8 h-8 text-blue-600" />}
            </div>
          </div>

          <div className={`${isMobile ? 'bg-green-50 p-3' : 'bg-green-50 p-4'} rounded-lg`}>
            <div className={`flex items-center ${isMobile ? 'flex-col space-y-1' : 'justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-green-800 leading-tight`}>Aktif Hesap</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-700 leading-tight`}>{activeTraders}</p>
              </div>
              {!isMobile && <TrendingUp className="w-8 h-8 text-green-600" />}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Toplam İşlem</p>
                <p className="text-2xl font-bold text-purple-600">{totalTransactions}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${netMoneyBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${netMoneyBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  Net Bakiye
                </p>
                <p className={`text-2xl font-bold ${netMoneyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netMoneyBalance >= 0 ? '+' : ''}
                  {formatMoney(netMoneyBalance)}
                </p>
              </div>
              {netMoneyBalance >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Para Bakiyeleri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Para Alacakları</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              +{formatMoney(totalMoneyReceivable)}
            </div>
            <p className="text-sm text-green-700">
              Toplam {traders.filter(t => {
                const { moneyBalance } = calculateBalances(t, transactions);
                return moneyBalance > 0;
              }).length} toptancıdan alacağınız var
            </p>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-4">Para Borçları</h3>
            <div className="text-3xl font-bold text-red-600 mb-2">
              -{formatMoney(totalMoneyDebt)}
            </div>
            <p className="text-sm text-red-700">
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
                    className={`p-4 rounded-lg ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {product.name}
                    </div>
                    <div className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                        <span className={`text-sm font-medium ${moneyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                  <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-800">Toptancı Silme İşlemleri</h3>
            </div>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 mb-3">
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
                        <span className={`font-medium ${moneyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Bakiye: {moneyBalance >= 0 ? '+' : ''}{formatMoney(moneyBalance)}
                        </span>
                        <span className="text-gray-500">
                          {traderTransactions.length} işlem
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onDeleteTrader(trader.id)}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
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