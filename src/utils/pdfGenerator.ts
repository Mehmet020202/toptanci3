import { Trader, Transaction, ProductType } from '../types';
import { calculateBalances, formatMoney, formatDateTime } from './calculations';
import { transactionTypeLabels } from '../data/defaultData';

interface DateRange {
  start?: string;
  end?: string;
}

export function generatePDFContent(
  trader: Trader,
  transactions: Transaction[],
  productTypes: ProductType[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pageSize: number = 1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _format: string = 'A4',
  dateRange?: DateRange
): string {
  // Filter transactions by trader and date range
  const traderTransactions = transactions
    .filter(t => t.traderId === trader.id)
    .filter(t => {
      if (!dateRange) return true;
      
      // Safe date parsing for transaction date
      let transactionDate: Date;
      try {
        transactionDate = new Date(t.date);
        if (isNaN(transactionDate.getTime())) {
          console.warn('Invalid transaction date:', t.date);
          return false; // Skip invalid dates
        }
      } catch (error) {
        console.warn('Error parsing transaction date:', t.date, error);
        return false; // Skip invalid dates
      }
      
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (dateRange.start) {
        try {
          startDate = new Date(dateRange.start);
          if (isNaN(startDate.getTime())) {
            console.warn('Invalid start date:', dateRange.start);
            startDate = null;
          }
        } catch (error) {
          console.warn('Error parsing start date:', dateRange.start, error);
          startDate = null;
        }
      }
      
      if (dateRange.end) {
        try {
          endDate = new Date(dateRange.end + 'T23:59:59');
          if (isNaN(endDate.getTime())) {
            console.warn('Invalid end date:', dateRange.end);
            endDate = null;
          }
        } catch (error) {
          console.warn('Error parsing end date:', dateRange.end, error);
          endDate = null;
        }
      }
      
      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) return false;
      return true;
    })
    .sort((a, b) => {
      // Safe date parsing for sorting
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.warn('Invalid date for sorting:', a.date, b.date);
          return 0; // Maintain original order for invalid dates
        }
        
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        console.warn('Error sorting transactions by date:', error);
        return 0; // Maintain original order on error
      }
    });

  // Calculate balances
  const { moneyBalance, productBalances } = calculateBalances(trader, transactions);
  
  // Separate product balances into receivables and debts
  const productReceivables: Record<string, number> = {};
  const productDebts: Record<string, number> = {};
  
  Object.entries(productBalances).forEach(([productId, balance]) => {
    if (balance > 0) {
      productReceivables[productId] = balance;
    } else if (balance < 0) {
      productDebts[productId] = Math.abs(balance);
    }
  });
  
  // Create product type map for quick lookup
  const productTypeMap = productTypes.reduce((acc, pt) => {
    acc[pt.id] = pt;
    return acc;
  }, {} as Record<string, ProductType>);

  // Generate HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${trader.name} - Toptancı Raporu</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        
        .header h2 {
            color: #64748b;
            margin: 5px 0 0 0;
            font-weight: normal;
            font-size: 18px;
        }
        
        .date-info {
            text-align: center;
            color: #64748b;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .trader-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .trader-info h3 {
            color: #1e293b;
            margin-top: 0;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-label {
            font-weight: 600;
            color: #475569;
        }
        
        .info-value {
            color: #1e293b;
        }
        
        .balance-positive {
            color: #059669;
            font-weight: bold;
        }
        
        .balance-negative {
            color: #dc2626;
            font-weight: bold;
        }
        
        .transactions-section {
            margin-top: 30px;
        }
        
        .transactions-section h3 {
            color: #1e293b;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
        }
        
        .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
        }
        
        .transactions-table th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #e2e8f0;
        }
        
        .transactions-table td {
            padding: 10px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        
        .transactions-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .transaction-type {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-align: center;
            min-width: 80px;
        }
        
        .type-income {
            background: #dcfce7;
            color: #166534;
        }
        
        .type-expense {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .type-payment {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .type-product {
            background: #fef3c7;
            color: #92400e;
        }
        
        .amount-positive {
            color: #059669;
            font-weight: 600;
        }
        
        .amount-negative {
            color: #dc2626;
            font-weight: 600;
        }
        
        .notes {
            max-width: 120px;
            word-wrap: break-word;
            font-size: 11px;
            color: #64748b;
        }
        
        .summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        
        .summary h3 {
            color: #1e293b;
            margin-top: 0;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
        
        /* Mobile-specific styles */
        @media screen and (max-width: 768px) {
            body {
                padding: 10px;
                font-size: 14px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .transactions-table {
                font-size: 11px;
            }
            
            .transaction-type {
                font-size: 9px;
                padding: 3px 6px;
                min-width: 70px;
            }
            
            .notes {
                font-size: 10px;
                max-width: 80px;
            }
            
            .header h1 {
                font-size: 22px;
            }
            
            .header h2 {
                font-size: 15px;
            }
            
            /* Mobil için tabloyu daha okunabilir hale getir */
            .transactions-table th,
            .transactions-table td {
                padding: 8px 4px;
            }
            
            /* Mobilde tabloyu dikey hale getir */
            .transactions-table,
            .transactions-table thead,
            .transactions-table tbody,
            .transactions-table th,
            .transactions-table td,
            .transactions-table tr {
                display: block;
            }
            
            .transactions-table thead tr {
                position: absolute;
                top: -9999px;
                left: -9999px;
            }
            
            .transactions-table tr {
                border: 1px solid #ccc;
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 8px;
                background: #f8fafc;
            }
            
            .transactions-table td {
                border: none;
                position: relative;
                padding: 6px 0 6px 30%;
                text-align: right;
            }
            
            .transactions-table td:before {
                content: attr(data-label) ": ";
                position: absolute;
                left: 0;
                width: 25%;
                text-align: left;
                font-weight: bold;
                color: #475569;
            }
        }
        
        /* Small mobile devices */
        @media screen and (max-width: 480px) {
            body {
                padding: 5px;
                font-size: 13px;
            }
            
            .transactions-table th,
            .transactions-table td {
                padding: 6px 4px;
            }
            
            .transactions-table {
                font-size: 10px;
            }
            
            .transaction-type {
                font-size: 8px;
                padding: 2px 4px;
                min-width: 60px;
            }
            
            .notes {
                font-size: 9px;
                max-width: 60px;
            }
            
            .transactions-table td {
                padding: 4px 0 4px 35%;
            }
            
            .transactions-table td:before {
                width: 30%;
                font-size: 9px;
            }
        }
        
        /* Print styles - mobil ve masaüstü için optimize edilmiş */
        @media print {
            @page {
                margin: 0.5cm;
            }
            
            body {
                padding: 0;
                font-size: 14px;
                max-width: 100%;
                margin: 0;
            }
            
            .transactions-table {
                font-size: 12px;
                width: 100%;
                table-layout: auto;
            }
            
            .transaction-type {
                font-size: 10px;
                padding: 3px 6px;
            }
            
            .notes {
                font-size: 10px;
                max-width: 100px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .header h2 {
                font-size: 16px;
            }
            
            /* Print için mobil stilleri kaldır */
            .transactions-table,
            .transactions-table thead,
            .transactions-table tbody,
            .transactions-table th,
            .transactions-table td,
            .transactions-table tr {
                display: table;
            }
            
            .transactions-table thead tr {
                position: static;
            }
            
            .transactions-table td:before {
                display: none;
            }
            
            .transactions-table td {
                padding: 8px;
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${trader.name}</h1>
        <h2>Toptancı Hesap Raporu</h2>
    </div>
    
    <div class="date-info">
        <strong>Rapor Tarihi:</strong> ${formatDateTime(new Date())}
        ${dateRange ? `<br><strong>Dönem:</strong> ${dateRange.start || 'Başlangıç'} - ${dateRange.end || 'Bugün'}` : ''}
    </div>
    
    <div class="trader-info">
        <h3>Toptancı Bilgileri</h3>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="info-label">Ad:</span>
                    <span class="info-value">${trader.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value">${trader.phone || 'Belirtilmemiş'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Son İşlem:</span>
                    <span class="info-value">${formatDateTime(trader.lastTransactionDate)}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="info-label">Para Durumu:</span>
                    <span class="info-value ${moneyBalance >= 0 ? 'balance-positive' : 'balance-negative'}">
                        ${moneyBalance >= 0 ? 'Alacak' : 'Borç'}: ${formatMoney(Math.abs(moneyBalance))}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">Toplam İşlem:</span>
                    <span class="info-value">${traderTransactions.length}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Alacaklı Ürün Türü:</span>
                    <span class="info-value">${Object.keys(productReceivables).length}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Borçlu Ürün Türü:</span>
                    <span class="info-value">${Object.keys(productDebts).length}</span>
                </div>
            </div>
        </div>
        
        ${Object.keys(productReceivables).length > 0 ? `
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #1e293b;">Toptancıdan Alacaklarım (Ürün):</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            ${Object.entries(productReceivables).map(([productId, balance]) => {
              const product = productTypeMap[productId];
              if (!product) return '';
              
              return `
                <div class="info-item">
                    <span class="info-label">${product.name}:</span>
                    <span class="info-value balance-positive">
                        +${balance} ${product.unit}
                    </span>
                </div>
              `;
            }).join('')}
        </div>
        ` : ''}
        
        ${Object.keys(productDebts).length > 0 ? `
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #1e293b;">Toptancıya Olan Borçlarım (Ürün):</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            ${Object.entries(productDebts).map(([productId, balance]) => {
              const product = productTypeMap[productId];
              if (!product) return '';
              
              return `
                <div class="info-item">
                    <span class="info-label">${product.name}:</span>
                    <span class="info-value balance-negative">
                        ${balance} ${product.unit}
                    </span>
                </div>
              `;
            }).join('')}
        </div>
        ` : ''}}
        
        ${trader.notes ? `
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #1e293b;">Notlar:</h4>
        <p style="color: #64748b; font-style: italic; margin: 0; padding: 10px; background: white; border-left: 4px solid #2563eb;">${trader.notes}</p>
        ` : ''}
    </div>
    
    <div class="transactions-section">
        <h3>İşlem Geçmişi (${traderTransactions.length} işlem)</h3>
        
        ${traderTransactions.length > 0 ? `
        <table class="transactions-table">
            <thead>
                <tr>
                    <th>Tarih</th>
                    <th>İşlem Türü</th>
                    <th>Ürün</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>Toplam</th>
                    <th>Notlar</th>
                </tr>
            </thead>
            <tbody>
                ${traderTransactions.map(transaction => {
                  const product = transaction.productType ? productTypeMap[transaction.productType] : null;
                  const typeClass = getTransactionTypeClass(transaction.type);
                  
                  return `
                    <tr>
                        <td data-label="Tarih">${formatDateTime(transaction.date)}</td>
                        <td data-label="İşlem Türü">
                            <span class="transaction-type ${typeClass}">
                                ${transactionTypeLabels[transaction.type]}
                            </span>
                        </td>
                        <td data-label="Ürün">${product ? product.name : '-'}</td>
                        <td data-label="Miktar">${transaction.quantity && product ? `${transaction.quantity} ${product.unit}` : '-'}</td>
                        <td data-label="Birim Fiyat">${transaction.unitPrice ? formatMoney(transaction.unitPrice) : '-'}</td>
                        <td data-label="Toplam" class="${transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                            ${formatMoney(transaction.amount)}
                        </td>
                        <td data-label="Notlar" class="notes">${transaction.notes || '-'}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
        ` : '<p style="text-align: center; color: #64748b; font-style: italic; padding: 40px;">Henüz işlem bulunmuyor</p>'}
    </div>
    
    <div class="summary">
        <h3>Özet Bilgiler</h3>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="info-label">Toplam İşlem Sayısı:</span>
                    <span class="info-value">${traderTransactions.length}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Alacağım Ürün Türü:</span>
                    <span class="info-value">${Object.keys(productReceivables).length}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Borçlu Olduğum Ürün Türü:</span>
                    <span class="info-value">${Object.keys(productDebts).length}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="info-label">Genel Durum:</span>
                    <span class="info-value ${moneyBalance >= 0 ? 'balance-positive' : 'balance-negative'}">
                        ${moneyBalance >= 0 ? 'Alacaklı' : 'Borçlu'}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">Para Bakiyesi:</span>
                    <span class="info-value ${moneyBalance >= 0 ? 'balance-positive' : 'balance-negative'}">
                        ${formatMoney(Math.abs(moneyBalance))}
                    </span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Bu rapor Toptancı Takip Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
        <p>Rapor Oluşturma Tarihi: ${formatDateTime(new Date())}</p>
    </div>
</body>
</html>`;

  return htmlContent;
}

function getTransactionTypeClass(type: string): string {
  switch (type) {
    case 'mal_satisi':
      return 'type-income';
    case 'mal_alimi':
    case 'nakit_borc':
    case 'nakit_tahsilat': // Nakit tahsil ettik = Borcumuz arttı (expense)
    case 'tahsilat': // Nakit tahsil ettik = Borcumuz arttı (expense)
      return 'type-expense';
    case 'odeme_yapildi':
      return 'type-payment';
    case 'urun_ile_odeme_yapildi':
    case 'urun_ile_odeme_alindi':
    case 'urun_ile_borc_verme':
    case 'urun_ile_borc_alma':
      return 'type-product';
    default:
      return 'type-payment';
  }
}

export function downloadPDF(htmlContent: string, filename: string): void {
  try {
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element for download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    link.style.position = 'absolute';
    link.style.left = '-9999px';
    
    // Safely add to DOM, click, and remove with proper checks
    const body = document.body;
    if (body && body.parentNode) {
      body.appendChild(link);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        try {
          link.click();
          
          // Safe removal with parent node check
          setTimeout(() => {
            if (link.parentNode === body) {
              body.removeChild(link);
            }
            // Clean up the temporary URL
            URL.revokeObjectURL(url);
          }, 100);
        } catch (clickError) {
          console.error('Error during PDF download click:', clickError);
          // Clean up on error
          if (link.parentNode === body) {
            body.removeChild(link);
          }
          URL.revokeObjectURL(url);
          throw new Error('PDF indirilemedi. Lütfen tekrar deneyin.');
        }
      }, 50);
    } else {
      throw new Error('Sayfa yüklenemedi. Lütfen sayfa yenilendi.');
    }
    
    console.log('PDF download initiated for:', filename);
  } catch (error) {
    console.error('Error in PDF download:', error);
    throw new Error('PDF indirilemedi. Lütfen tekrar deneyin.');
  }
}