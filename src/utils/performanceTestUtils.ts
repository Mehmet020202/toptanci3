import React from 'react';
import { Trader, Transaction, ProductType, AppData, TransactionType } from '../types';

// Generate large dataset for performance testing
export function generateLargeTestDataset(
  traderCount: number = 50,
  transactionCount: number = 1000
): AppData {
  const productTypes: ProductType[] = [
    { id: 'altın', name: 'Altın', unit: 'gram', currentPrice: 1850 },
    { id: 'gümüş', name: 'Gümüş', unit: 'gram', currentPrice: 25 },
    { id: 'çeyrek', name: 'Çeyrek Altın', unit: 'adet', currentPrice: 4800 },
    { id: 'yarım', name: 'Yarım Altın', unit: 'adet', currentPrice: 9600 },
    { id: 'tam', name: 'Tam Altın', unit: 'adet', currentPrice: 19200 },
    { id: 'bilezik', name: 'Altın Bilezik', unit: 'gram', currentPrice: 1900 },
    { id: 'yüzük', name: 'Altın Yüzük', unit: 'gram', currentPrice: 1950 },
    { id: 'kolye', name: 'Altın Kolye', unit: 'gram', currentPrice: 1920 },
    { id: 'küpe', name: 'Altın Küpe', unit: 'gram', currentPrice: 1880 },
    { id: 'gümüş_bilezik', name: 'Gümüş Bilezik', unit: 'gram', currentPrice: 28 }
  ];

  // Generate traders
  const traders: Trader[] = [];
  const traderNames = [
    'Vefa Altın', 'Aşkın Kuyumculuk', 'Güven Altın', 'Şahin Kuyumcu', 'Murat Altın',
    'Emin Kuyumculuk', 'Fatih Altın', 'Kemal Kuyumcu', 'Ahmet Altın', 'Mehmet Kuyumculuk',
    'Ali Altın', 'Hasan Kuyumcu', 'Hüseyin Altın', 'Mustafa Kuyumculuk', 'Ömer Altın',
    'Süleyman Kuyumcu', 'Yasin Altın', 'Yusuf Kuyumculuk', 'Zafer Altın', 'Zeki Kuyumcu',
    'Cemil Altın', 'Celal Kuyumculuk', 'Cemal Altın', 'Cengiz Kuyumcu', 'Cem Altın',
    'Can Kuyumculuk', 'Caner Altın', 'Cafer Kuyumcu', 'Cahit Altın', 'Cihan Kuyumculuk',
    'Deniz Altın', 'Doğan Kuyumcu', 'Durmuş Altın', 'Davut Kuyumculuk', 'Dursun Altın',
    'Erhan Kuyumcu', 'Erkan Altın', 'Erdal Kuyumculuk', 'Erdem Altın', 'Eren Kuyumcu',
    'Ferhat Altın', 'Fuat Kuyumculuk', 'Faruk Altın', 'Fikret Kuyumcu', 'Fırat Altın',
    'Gökhan Kuyumculuk', 'Gürkan Altın', 'Güngör Kuyumcu', 'Gökmen Altın', 'Gürsel Kuyumculuk'
  ];

  for (let i = 0; i < traderCount; i++) {
    const name = traderNames[i] || `Test Toptancı ${i + 1}`;
    traders.push({
      id: `trader_${i + 1}`,
      name,
      phone: `0532 ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 90) + 10)} ${String(Math.floor(Math.random() * 90) + 10)}`,
      notes: `Test notları ${i + 1}`,
      moneyBalance: 0,
      productBalances: {},
      lastTransactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Son 30 gün içinde
    });
  }

  // Generate transactions
  const transactions: Transaction[] = [];
  const transactionTypes: TransactionType[] = [
    'mal_alimi', 'mal_satisi', 'odeme_yapildi', 'tahsilat', 
    'nakit_borc', 'nakit_tahsilat', 'urun_ile_odeme_yapildi', 
    'urun_ile_odeme_alindi', 'urun_ile_borc_verme', 'urun_ile_borc_alma'
  ];

  for (let i = 0; i < transactionCount; i++) {
    const trader = traders[Math.floor(Math.random() * traders.length)];
    const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    
    // Generate realistic transaction amounts
    const quantity = Math.random() * 100 + 1; // 1-100 gram/adet
    const unitPrice = productType.currentPrice * (0.8 + Math.random() * 0.4); // ±20% variation
    const amount = quantity * unitPrice;

    const needsProduct = ['mal_alimi', 'mal_satisi', 'urun_ile_odeme_yapildi', 
                         'urun_ile_odeme_alindi', 'urun_ile_borc_verme', 'urun_ile_borc_alma'].includes(transactionType);
    
    transactions.push({
      id: `transaction_${i + 1}`,
      traderId: trader.id,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Son 90 gün içinde
      type: transactionType,
      productType: needsProduct ? productType.id : undefined,
      quantity: needsProduct ? Math.round(quantity * 1000) / 1000 : undefined,
      unitPrice: needsProduct && ['mal_alimi', 'mal_satisi'].includes(transactionType) ? Math.round(unitPrice * 100) / 100 : undefined,
      amount: Math.round(amount * 100) / 100,
      notes: `Test işlem ${i + 1} - ${transactionType} - ${new Date().toLocaleDateString('tr-TR')}`
    });
  }

  return {
    traders,
    transactions,
    productTypes
  };
}

// Generate performance test scenarios
export function generatePerformanceTestScenarios() {
  return {
    small: generateLargeTestDataset(10, 100),
    medium: generateLargeTestDataset(25, 500),
    large: generateLargeTestDataset(50, 1000),
    xlarge: generateLargeTestDataset(100, 2000),
    stress: generateLargeTestDataset(200, 5000)
  };
}

// Benchmark utility for measuring performance
export function benchmarkOperation<T>(
  name: string,
  operation: () => T,
  iterations: number = 1
): { result: T; averageTime: number; totalTime: number } {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = operation();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;

  console.log(`🔍 Benchmark: ${name}`);
  console.log(`   ⏱️  Average time: ${averageTime.toFixed(2)}ms`);
  console.log(`   🔄 Total time: ${totalTime.toFixed(2)}ms (${iterations} iterations)`);
  
  if (averageTime > 100) {
    console.warn(`   ⚠️  Performance warning: ${name} took ${averageTime.toFixed(2)}ms`);
  }

  return { result: result!, averageTime, totalTime };
}

// Memory usage tracker
export function trackMemoryUsage(label: string): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`💾 Memory Usage (${label}):`);
    console.log(`   Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
  }
}

// Performance monitoring hook for React components
export function usePerformanceMonitor(componentName: string, dependencies: any[] = []) {
  const startTime = performance.now();
  
  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 50) {
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    trackMemoryUsage(componentName);
  }, dependencies);
}