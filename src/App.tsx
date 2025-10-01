import { useState } from 'react';
import { Users, Plus, BarChart3, Menu, X, Package, LogOut } from 'lucide-react';
import { Trader, Transaction, ProductType } from './types';
import { useAuth } from './hooks/useAuth';
import { useFirebaseData } from './hooks/useFirebaseData';
import { useResponsive } from './hooks/usePerformanceOptimization';
import LoginForm from './components/LoginForm';
import TraderList from './components/TraderList';
import TraderForm from './components/TraderForm';
import TraderDetail from './components/TraderDetail';
import TransactionForm from './components/TransactionForm';
import ProductTypeForm from './components/ProductTypeForm';
import ProductTypeManagement from './components/ProductTypeManagement';
import ReportPage from './components/ReportPage';
import ErrorBoundary from './components/ErrorBoundary';

// Generate ID function
const generateId = () => {
  try {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  } catch (error) {
    console.error('Error generating ID:', error);
    // Fallback ID generation
    return 'id_' + Math.random().toString(36).substr(2, 12);
  }
};

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    data, 
    loading: dataLoading, 
    error, 
    saveTrader, 
    deleteTrader, 
    saveTransaction, 
    deleteTransaction, 
    saveProductType, 
    deleteProductType 
  } = useFirebaseData();
  const { isMobile, isTablet, isTouchDevice } = useResponsive();
  
  const [currentView, setCurrentView] = useState<'traders' | 'reports' | 'productTypes'>('traders');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [showTraderForm, setShowTraderForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showProductTypeForm, setShowProductTypeForm] = useState(false);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Giriş yapılmamışsa login ekranını göster
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verileriniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Event handlers with Firebase integration
  const handleAddTrader = async (traderData: Omit<Trader, 'id' | 'moneyBalance' | 'productBalances' | 'lastTransactionDate'>) => {
    // Safe date creation
    let lastTransactionDate: Date;
    try {
      lastTransactionDate = new Date();
      if (isNaN(lastTransactionDate.getTime())) {
        lastTransactionDate = new Date(); // Fallback to current date
      }
    } catch (error) {
      console.warn('Error creating lastTransactionDate:', error);
      lastTransactionDate = new Date(); // Fallback to current date
    }

    const newTrader: Trader = {
      ...traderData,
      id: generateId(),
      moneyBalance: 0,
      productBalances: {},
      lastTransactionDate
    };

    try {
      await saveTrader(newTrader);
      setShowTraderForm(false);
    } catch (err) {
      console.error('Toptancı eklenemedi:', err);
    }
  };

  const handleEditTrader = async (traderId: string, traderData: Omit<Trader, 'id' | 'moneyBalance' | 'productBalances' | 'lastTransactionDate'>) => {
    const existingTrader = data.traders.find(t => t.id === traderId);
    if (!existingTrader) return;

    const updatedTrader: Trader = {
      ...existingTrader,
      ...traderData
    };

    try {
      await saveTrader(updatedTrader);
      setEditingTrader(null);
      setShowTraderForm(false);
    } catch (err) {
      console.error('Toptancı güncellenemedi:', err);
    }
  };

  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateId()
    };

    try {
      await saveTransaction(newTransaction);
      setShowTransactionForm(false);
      setEditingTransaction(null);
    } catch (err) {
      console.error('İşlem eklenemedi:', err);
    }
  };

  const handleEditTransaction = async (transactionId: string, transactionData: Omit<Transaction, 'id'>) => {
    const updatedTransaction: Transaction = {
      ...transactionData,
      id: transactionId
    };

    try {
      await saveTransaction(updatedTransaction);
      setShowTransactionForm(false);
      setEditingTransaction(null);
    } catch (err) {
      console.error('İşlem güncellenemedi:', err);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
    } catch (err) {
      console.error('İşlem silinemedi:', err);
    }
  };

  const handleAddProductType = async (productTypeData: Omit<ProductType, 'id'>) => {
    const newProductType: ProductType = {
      ...productTypeData,
      id: generateId()
    };

    try {
      await saveProductType(newProductType);
      setShowProductTypeForm(false);
    } catch (err) {
      console.error('Ürün türü eklenemedi:', err);
    }
  };

  const handleEditProductType = async (productTypeId: string, productTypeData: Omit<ProductType, 'id'>) => {
    const updatedProductType: ProductType = {
      ...productTypeData,
      id: productTypeId
    };

    try {
      await saveProductType(updatedProductType);
      setEditingProductType(null);
      setShowProductTypeForm(false);
    } catch (err) {
      console.error('Ürün türü güncellenemedi:', err);
    }
  };

  const handleDeleteProductType = async (productTypeId: string) => {
    const hasTransactions = data.transactions.some(t => t.productType === productTypeId);
    if (hasTransactions) {
      alert('Bu ürün türünü kullanan işlemler bulunmaktadır. Önce bu işlemleri silin veya düzenleyin.');
      return;
    }

    try {
      await deleteProductType(productTypeId);
    } catch (err) {
      console.error('Ürün türü silinemedi:', err);
    }
  };

  const handleDeleteTrader = async (traderId: string) => {
    const trader = data.traders.find(t => t.id === traderId);
    if (!trader) return;
    
    const hasTransactions = data.transactions.some(t => t.traderId === traderId);
    
    if (hasTransactions) {
      const confirmMessage = `${trader.name} adlı toptancının işlem geçmişi bulunmaktadır.

Toptancıyı silmek aynı zamanda tüm işlem geçmişini de silecektir.

Devam etmek istiyor musunuz?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    } else {
      const confirmMessage = `${trader.name} adlı toptancıyı silmek istediğinize emin misiniz?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    
    try {
      await deleteTrader(traderId);
      alert(`${trader.name} başarıyla silindi.`);
    } catch (err) {
      console.error('Toptancı silinemedi:', err);
    }
  };

  // Debt conversion handler
  const handleConvertDebt = async (conversionData: {
    debtProductId: string;
    debtAmount: number;
    receivableProductId: string;
    receivableAmount: number;
    multiplier: number;
  }) => {
    if (!selectedTrader) return;

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

    const debtReductionTransaction: Transaction = {
      id: generateId(),
      traderId: selectedTrader.id,
      date: transactionDate,
      type: 'urun_ile_odeme_yapildi', // Ürün ile ödeme yaptık - borcumuz azaldı
      productType: conversionData.debtProductId,
      quantity: conversionData.debtAmount,
      amount: 0,
      notes: `Borç dönüştürme: ${conversionData.debtAmount} ${conversionData.debtProductId} borcu ${conversionData.receivableAmount} ${conversionData.receivableProductId} ile takas edildi (Çarpan: ${conversionData.multiplier})`
    };

    const receivableReductionTransaction: Transaction = {
      id: generateId(),
      traderId: selectedTrader.id,
      date: transactionDate,
      type: 'urun_ile_odeme_alindi', // Ürün ile ödeme aldık - alacağımız azaldı
      productType: conversionData.receivableProductId,
      quantity: conversionData.receivableAmount,
      amount: 0,
      notes: `Borç dönüştürme: ${conversionData.receivableAmount} ${conversionData.receivableProductId} alacağı ${conversionData.debtAmount} ${conversionData.debtProductId} ile takas edildi (Çarpan: ${conversionData.multiplier})`
    };

    try {
      await saveTransaction(debtReductionTransaction);
      await saveTransaction(receivableReductionTransaction);
      alert('Borç dönüştürme işlemi başarıyla tamamlandı!');
    } catch (err) {
      console.error('Borç dönüştürme işlemi başarısız:', err);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      try {
        await logout();
      } catch (err) {
        console.error('Çıkış yapılırken hata:', err);
      }
    }
  };

  // ... existing code for UI rendering ...
  // (The rest of the App component rendering logic continues here)
  
  if (selectedTrader) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 p-4">
          <TraderDetail
            trader={selectedTrader}
            transactions={data.transactions}
            productTypes={data.productTypes}
            onBack={() => setSelectedTrader(null)}
            onAddTransaction={() => setShowTransactionForm(true)}
            onEditTransaction={(transaction) => {
              setEditingTransaction(transaction);
              setShowTransactionForm(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onConvertDebt={handleConvertDebt}
          />
          
          {showTransactionForm && (
            <TransactionForm
              transaction={editingTransaction || undefined}
              traders={data.traders}
              productTypes={data.productTypes}
              selectedTraderId={selectedTrader.id}
              onSave={(transactionData) => {
                if (editingTransaction) {
                  handleEditTransaction(editingTransaction.id, transactionData);
                } else {
                  handleAddTransaction(transactionData);
                }
              }}
              onCancel={() => {
                setShowTransactionForm(false);
                setEditingTransaction(null);
              }}
            />
          )}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className={`font-bold text-gray-900 tracking-tight ${isMobile ? 'text-lg' : 'text-xl'}`}>Toptancı Takip</h1>
              </div>

              {/* User Info and Logout */}
              <div className="flex items-center space-x-4">
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('traders')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors font-medium ${
                      currentView === 'traders'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Toptancılar</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('reports')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors font-medium ${
                      currentView === 'reports'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">Raporlar</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('productTypes')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-2 py-2 rounded-md transition-colors"
                    title="Ürün Türleri"
                  >
                    <Package className="w-4 h-4" />
                    <span className="text-sm">Ürün Türleri</span>
                  </button>
                  
                  {currentView === 'traders' && (
                    <button
                      onClick={() => setShowTraderForm(true)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold leading-tight"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Toptancı Ekle</span>
                    </button>
                  )}
                </nav>

                <div className="hidden md:flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Hoş geldiniz, {user.displayName || user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Çıkış</span>
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-gray-600 hover:text-gray-800 p-2 rounded-md transition-colors"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
                  <div className="flex flex-col space-y-3 p-4">
                    <button
                      onClick={() => {
                        setCurrentView('traders');
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        currentView === 'traders'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Toptancılar</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('reports');
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        currentView === 'reports'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="font-medium">Raporlar</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setCurrentView('productTypes');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Package className="w-5 h-5" />
                      <span className="font-medium">Ürün Türleri</span>
                    </button>

                    {/* User info and logout for mobile */}
                    <div className="border-t pt-3 mt-3">
                      <div className="px-4 py-2 text-sm text-gray-600">
                        {user.displayName || user.email}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Çıkış Yap</span>
                      </button>
                    </div>

                    {currentView === 'traders' && (
                      <button
                        onClick={() => {
                          setShowTraderForm(true);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-4 rounded-lg mx-4 font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Yeni Toptancı Ekle</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`max-w-6xl mx-auto ${isMobile ? 'p-2' : 'p-4'}`}>
          {currentView === 'traders' ? (
            <>
              {data.traders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Henüz toptancı eklenmemiş
                  </h2>
                  <p className="text-gray-600 mb-6">
                    İlk toptancınızı ekleyerek başlayın
                  </p>
                  <button
                    onClick={() => setShowTraderForm(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>İlk Toptancıyı Ekle</span>
                  </button>
                </div>
              ) : (
                <TraderList
                  traders={data.traders}
                  transactions={data.transactions}
                  productTypes={data.productTypes}
                  onSelectTrader={setSelectedTrader}
                  onSaveTransaction={handleAddTransaction}
                />
              )}
            </>
          ) : currentView === 'reports' ? (
            <ReportPage
              traders={data.traders}
              transactions={data.transactions}
              productTypes={data.productTypes}
              onDeleteTrader={handleDeleteTrader}
            />
          ) : (
            <ProductTypeManagement
              productTypes={data.productTypes}
              onEdit={(productType) => {
                setEditingProductType(productType);
                setShowProductTypeForm(true);
              }}
              onDelete={handleDeleteProductType}
              onAdd={() => setShowProductTypeForm(true)}
              onBack={() => setCurrentView('traders')}
            />
          )}
        </main>

        {/* Modals */}
        {showTraderForm && (
          <TraderForm
            trader={editingTrader || undefined}
            onSave={(traderData) => {
              if (editingTrader) {
                handleEditTrader(editingTrader.id, traderData);
              } else {
                handleAddTrader(traderData);
              }
            }}
            onCancel={() => {
              setShowTraderForm(false);
              setEditingTrader(null);
            }}
          />
        )}

        {showTransactionForm && (
          <TransactionForm
            transaction={editingTransaction || undefined}
            traders={data.traders}
            productTypes={data.productTypes}
            onSave={(transactionData) => {
              if (editingTransaction) {
                handleEditTransaction(editingTransaction.id, transactionData);
              } else {
                handleAddTransaction(transactionData);
              }
            }}
            onCancel={() => {
              setShowTransactionForm(false);
              setEditingTransaction(null);
            }}
          />
        )}

        {showProductTypeForm && (
          <ProductTypeForm
            productType={editingProductType || undefined}
            onSave={(productTypeData) => {
              if (editingProductType) {
                handleEditProductType(editingProductType.id, productTypeData);
              } else {
                handleAddProductType(productTypeData);
              }
            }}
            onCancel={() => {
              setShowProductTypeForm(false);
              setEditingProductType(null);
            }}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}