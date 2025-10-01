import { useState, useEffect } from 'react';
import { X, Calculator, ShoppingCart, Scale, Wrench } from 'lucide-react';
import { Trader, ProductType } from '../types';

interface DebtCalculatorProps {
  trader: Trader;
  productTypes: ProductType[];
  onClose: () => void;
  onConvert: (conversionData: {
    debtProductId: string;
    debtAmount: number;
    receivableProductId: string;
    receivableAmount: number;
    multiplier: number;
  }) => void;
}

export default function DebtCalculator({
  productTypes,
  onClose,
  onConvert
}: DebtCalculatorProps) {
  const [debtProductId, setDebtProductId] = useState<string>('');
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [multiplier, setMultiplier] = useState<string>('1.0000');
  const [receivableProductId, setReceivableProductId] = useState<string>('');
  const [calculatedReceivable, setCalculatedReceivable] = useState<string>('');

  // Hesaplanan alacak miktarını güncelle
  useEffect(() => {
    if (debtAmount && multiplier && receivableProductId) {
      const debt = parseFloat(debtAmount);
      const mult = parseFloat(multiplier);
      
      if (!isNaN(debt) && !isNaN(mult)) {
        const calculated = Math.round((debt * mult) * 100) / 100; // Round to 2 decimal places
        setCalculatedReceivable(calculated.toFixed(2));
      }
    } else {
      setCalculatedReceivable('');
    }
  }, [debtAmount, multiplier, receivableProductId]);

  const handleCalculate = () => {
    if (!debtProductId || !debtAmount || !multiplier || !receivableProductId) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    const debt = parseFloat(debtAmount);
    const mult = parseFloat(multiplier);
    const receivable = parseFloat(calculatedReceivable);

    if (isNaN(debt) || isNaN(mult) || isNaN(receivable)) {
      alert('Geçersiz sayı değerleri.');
      return;
    }

    onConvert({
      debtProductId,
      debtAmount: debt,
      receivableProductId,
      receivableAmount: receivable,
      multiplier: mult
    });

    onClose();
  };

  const debtProduct = productTypes.find(pt => pt.id === debtProductId);
  const receivableProduct = productTypes.find(pt => pt.id === receivableProductId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Ürün Borç Hesaplama
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Borçlu Olduğunuz Ürün */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Borçlu Olduğunuz Ürün
            </label>
            <select
              value={debtProductId}
              onChange={(e) => setDebtProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seçiniz...</option>
              {productTypes.map(pt => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} ({pt.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Borç Miktarı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Scale className="w-4 h-4 mr-2" />
              Borç Miktarı
            </label>
            <input
              type="number"
              step="0.001"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`${debtProduct?.unit || ''} cinsinden`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mevcut borç miktarı otomatik yüklenir, değiştirebilirsiniz
            </p>
          </div>

          {/* Çarpan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="w-4 h-4 mr-2 text-center text-lg font-bold">×</span>
              Çarpan
            </label>
            <input
              type="number"
              step="0.0001"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1.0000"
            />
          </div>

          {/* Alacaklı Olduğunuz Ürün */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Wrench className="w-4 h-4 mr-2" />
              Alacaklı Olduğunuz Ürün
            </label>
            <select
              value={receivableProductId}
              onChange={(e) => setReceivableProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seçiniz...</option>
              {productTypes.map(pt => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} ({pt.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Hesaplanan Alacak Miktarı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Scale className="w-4 h-4 mr-2" />
              Hesaplanan Alacak Miktarı
            </label>
            <input
              type="number"
              step="0.1"
              value={calculatedReceivable}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Otomatik hesaplanır"
            />
          </div>

          {/* Hesaplama Özeti */}
          {debtAmount && multiplier && calculatedReceivable && debtProduct && receivableProduct && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Hesaplama Özeti</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>
                  {debtAmount} {debtProduct.unit} {debtProduct.name} × {multiplier} = {calculatedReceivable} {receivableProduct.unit} {receivableProduct.name}
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  Bu işlem sonrasında:<br/>
                  • {debtProduct.name} borcunuzdan {debtAmount} {debtProduct.unit} azalacak<br/>
                  • {receivableProduct.name} alacağınızdan {calculatedReceivable} {receivableProduct.unit} azalacak
                </div>
              </div>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleCalculate}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
              disabled={!debtAmount || !multiplier || !calculatedReceivable || !debtProductId || !receivableProductId}
            >
              <Calculator className="w-4 h-4" />
              <span>Dönüştür</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>İptal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
