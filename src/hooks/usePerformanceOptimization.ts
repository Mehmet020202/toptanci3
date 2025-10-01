import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Transaction, Trader, ProductType } from '../types';

// Helper function to fix floating point precision issues
function roundToPrecision(num: number, decimals: number = 3): number {
  return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Hook for debouncing search/filter operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for virtual scrolling large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    handleScroll,
    offsetY: visibleRange.startIndex * itemHeight
  };
}

// Hook for optimized transaction calculations
export function useOptimizedCalculations(
  traders: Trader[],
  transactions: Transaction[],
  productTypes: ProductType[]
) {
  // Memoize product type map for fast lookups
  const productTypeMap = useMemo(() => {
    return productTypes.reduce((acc, pt) => {
      acc[pt.id] = pt;
      return acc;
    }, {} as Record<string, ProductType>);
  }, [productTypes]);

  // Memoize transactions by trader for fast filtering
  const transactionsByTrader = useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      if (!acc[transaction.traderId]) {
        acc[transaction.traderId] = [];
      }
      acc[transaction.traderId].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);

  // Memoized balance calculations
  const traderBalances = useMemo(() => {
    const balances: Record<string, { moneyBalance: number; productBalances: Record<string, number> }> = {};
    
    traders.forEach(trader => {
      const traderTransactions = transactionsByTrader[trader.id] || [];
      let moneyBalance = 0;
      const productBalances: Record<string, number> = {};

      traderTransactions.forEach(transaction => {
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
            moneyBalance += transaction.amount; // Ödeme yaptık, borcumuz azaldı
            break;
          case 'tahsilat':
            moneyBalance -= transaction.amount; // Tahsilat yaptık, borcumuz arttı
            break;
          case 'nakit_borc':
            moneyBalance += transaction.amount; // Borç verdik, alacağımız oluştu
            break;
          case 'nakit_tahsilat':
            moneyBalance -= transaction.amount; // Nakit tahsil ettik, borcumuz arttı
            break;
          case 'urun_ile_odeme_yapildi':
            moneyBalance += transaction.amount; // Ürün verdik, para borcu azaldı
            if (transaction.productType && transaction.quantity) {
              // Borcu azaltmak için quantity'yi ekleriz (negatif değere pozitif eklenir)
              productBalances[transaction.productType] = 
                (productBalances[transaction.productType] || 0) + transaction.quantity;
            }
            break;
          case 'urun_ile_odeme_alindi':
            moneyBalance -= transaction.amount; // Ürün aldık, para alacağı azaldı
            if (transaction.productType && transaction.quantity) {
              // Alacaklı ürünümüzle ödeme aldık = Ürün alacağımız azaldı
              productBalances[transaction.productType] = 
                (productBalances[transaction.productType] || 0) - transaction.quantity;
            }
            break;
          case 'urun_ile_borc_verme':
            moneyBalance += transaction.amount; // Ürün verdik, alacak oluştu
            if (transaction.productType && transaction.quantity) {
              // Toptancıya ürün verdik = Bizim ürün alacağımız arttı
              productBalances[transaction.productType] = 
                (productBalances[transaction.productType] || 0) + transaction.quantity;
            }
            break;
          case 'urun_ile_borc_alma':
            moneyBalance -= transaction.amount; // Ürün aldık, borç oluştu
            if (transaction.productType && transaction.quantity) {
              // Toptancıdan ürün aldık = Bizim ürün borcumuz arttı
              productBalances[transaction.productType] = 
                (productBalances[transaction.productType] || 0) - transaction.quantity;
            }
            break;
        }
      });

      // Apply precision rounding to all balances
      const roundedProductBalances: Record<string, number> = {};
      Object.keys(productBalances).forEach(productType => {
        roundedProductBalances[productType] = roundToPrecision(productBalances[productType], 3);
      });

      balances[trader.id] = { 
        moneyBalance: roundToPrecision(moneyBalance, 2), 
        productBalances: roundedProductBalances 
      };
    });

    return balances;
  }, [traders, transactionsByTrader]);

  return {
    productTypeMap,
    transactionsByTrader,
    traderBalances
  };
}

// Hook for responsive design breakpoints
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [targetRef, options]);

  return isIntersecting;
}

// Hook for memory-efficient large list handling
export function usePaginatedData<T>(
  data: T[],
  pageSize: number = 50,
  searchTerm: string = ''
) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    // This should be customized based on the data type
    return data.filter((item: any) => {
      if (typeof item === 'object' && item !== null) {
        return Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return item?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems: filteredData.length,
    goToPage,
    resetPagination,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}