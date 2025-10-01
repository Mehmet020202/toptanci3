import { useState } from 'react';
import { Save, X, Package } from 'lucide-react';
import { ProductType } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ProductTypeFormProps {
  productType?: ProductType;
  onSave: (productType: Omit<ProductType, 'id'>) => void;
  onCancel: () => void;
}

export default function ProductTypeForm({ productType, onSave, onCancel }: ProductTypeFormProps) {
  const { currentTheme } = useTheme();
  const [name, setName] = useState(productType?.name || '');
  const [unit, setUnit] = useState<'gram' | 'adet'>(productType?.unit || 'gram');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) return;

    onSave({
      name: name.trim(),
      unit,
      currentPrice: productType?.currentPrice || 0 // Keep existing price or default to 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {productType ? 'Ürün Türü Düzenle' : 'Yeni Ürün Türü Ekle'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 leading-tight">
              Ürün Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: Altın, Çeyrek, Dolar..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 leading-tight">
              Birim *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'gram' | 'adet')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="gram">Gram</option>
              <option value="adet">Adet</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 text-white py-3 px-4 rounded-md transition-colors"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Save className="w-4 h-4" />
              <span>Kaydet</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>İptal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}