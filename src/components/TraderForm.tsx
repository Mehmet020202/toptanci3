import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Trader } from '../types';
import { useResponsive } from '../hooks/usePerformanceOptimization';
import { useTheme } from '../contexts/ThemeContext';

interface TraderFormProps {
  trader?: Trader;
  onSave: (trader: Omit<Trader, 'id' | 'moneyBalance' | 'productBalances' | 'lastTransactionDate'>) => void;
  onCancel: () => void;
}

export default function TraderForm({ trader, onSave, onCancel }: TraderFormProps) {
  const { currentTheme } = useTheme();
  const { isMobile, isTouchDevice } = useResponsive();
  const [name, setName] = useState(trader?.name || '');
  const [phone, setPhone] = useState(trader?.phone || '');
  const [notes, setNotes] = useState(trader?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), phone: phone.trim(), notes: notes.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} ${isMobile ? 'max-h-screen overflow-y-auto' : ''}`}>
        <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 leading-tight`}>
            {trader ? 'Toptancı Düzenle' : 'Yeni Toptancı Ekle'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`${isMobile ? 'p-4' : 'p-6'} space-y-${isMobile ? '4' : '4'}`}>
          <div>
            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-semibold text-gray-800 mb-2 leading-tight`}>
              Toptancı Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isTouchDevice ? 'mobile-input' : ''}`}
              placeholder="Toptancı adını girin"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-semibold text-gray-800 mb-2 leading-tight`}>
              Telefon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isTouchDevice ? 'mobile-input' : ''}`}
              placeholder="Telefon numarası"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-semibold text-gray-800 mb-2 leading-tight`}>
              Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={isMobile ? 2 : 3}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${isTouchDevice ? 'mobile-input' : ''}`}
              placeholder="Ek notlar..."
            />
          </div>

          <div className={`flex ${isMobile ? 'space-y-3 flex-col' : 'space-x-3'} pt-4`}>
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