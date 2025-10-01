import { User, Phone, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Trader, Transaction, ProductType } from '../types';
import { calculateBalances, formatMoney, formatDate } from '../utils/calculations';
import { useResponsive, useOptimizedCalculations } from '../hooks/usePerformanceOptimization';
import { useTheme } from '../contexts/ThemeContext';
import QuickActions from './QuickActions';

interface TraderListProps {
  traders: Trader[];
  transactions: Transaction[];
  productTypes: ProductType[];
  onSelectTrader: (trader: Trader) => void;
  onSaveTransaction: (transactionData: Omit<Transaction, 'id'>) => void;
}

export default function TraderList({ traders, transactions, productTypes, onSelectTrader, onSaveTransaction }: TraderListProps) {
  const { isMobile, isTablet } = useResponsive();
  const { productTypeMap, traderBalances } = useOptimizedCalculations(traders, transactions, productTypes);
  const { currentTheme } = useTheme();

  // Responsive grid configuration
  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <QuickActions
        traders={traders}
        productTypes={productTypes}
        onSaveTransaction={onSaveTransaction}
      />
      
      {/* Trader Cards */}
      <div className={`grid ${getGridCols()} gap-4`}>
        {traders.map(trader => {
          const balanceData = traderBalances[trader.id];
          if (!balanceData) return null;
          
          const { moneyBalance, productBalances } = balanceData;
          
          return (
            <div
              key={trader.id}
              onClick={() => onSelectTrader(trader)}
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 ${
                isMobile ? 'active:scale-98' : 'hover:scale-105'
              }`}
              style={{ 
                borderColor: `#${currentTheme.primary}40`,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center`} style={{ backgroundColor: currentTheme.primaryLight }}>
                      <User className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} style={{ color: currentTheme.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-gray-900 truncate leading-tight ${isMobile ? 'text-base' : 'text-lg'}`}>{trader.name}</h3>
                      {trader.phone && (
                        <div className={`flex items-center text-gray-600 ${isMobile ? 'text-xs mt-1' : 'text-sm mt-1'} truncate leading-relaxed`}>
                          <Phone className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1 flex-shrink-0`} />
                          <span className="truncate font-medium">{trader.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`space-y-${isMobile ? '2' : '3'}`}>
                  {/* Para Bakiyesi */}
                  <div className={`${isMobile ? 'p-2' : 'p-3'} rounded-lg`} style={{ backgroundColor: moneyBalance >= 0 ? currentTheme.positiveLight : currentTheme.negativeLight }}>
                    <div className="flex items-center justify-between">
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 leading-tight`}>Para Bakiyesi</span>
                      {moneyBalance >= 0 ? (
                        <TrendingUp className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ color: currentTheme.positive }} />
                      ) : (
                        <TrendingDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ color: currentTheme.negative }} />
                      )}
                    </div>
                    <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold leading-tight`} style={{ color: moneyBalance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                      {moneyBalance >= 0 ? '+' : ''}
                      {formatMoney(moneyBalance)}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 font-medium mt-1`}>
                      {moneyBalance >= 0 ? 'Alacak' : 'Borç'}
                    </div>
                  </div>

                  {/* Ürün Bakiyeleri */}
                  {Object.entries(productBalances).some(([, balance]) => balance !== 0) && (
                    <div className="border-t pt-3" style={{ borderColor: `#${currentTheme.primary}20` }}>
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2 leading-tight`}>Ürün Bakiyeleri</div>
                      <div className={`space-y-${isMobile ? '0.5' : '1'} max-h-${isMobile ? '20' : '24'} overflow-y-auto`}>
                        {Object.entries(productBalances).map(([productId, balance]) => {
                          if (balance === 0) return null;
                          const product = productTypeMap[productId];
                          if (!product) return null;
                          
                          return (
                            <div key={productId} className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}>
                              <span className="text-gray-700 truncate flex-1 mr-2 font-medium">{product.name}</span>
                              <span className={`flex-shrink-0 font-semibold`} style={{ color: balance >= 0 ? currentTheme.positive : currentTheme.negative }}>
                                {balance >= 0 ? '+' : ''}
                                {balance} {product.unit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Son İşlem Tarihi */}
                  <div className={`flex items-center text-gray-500 ${isMobile ? 'text-xs pt-1' : 'text-xs pt-2'} border-t`} style={{ borderColor: `#${currentTheme.primary}20` }}>
                    <Calendar className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} mr-1 flex-shrink-0`} />
                    <span className="truncate">Son işlem: {formatDate(trader.lastTransactionDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}