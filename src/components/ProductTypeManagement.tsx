import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Package, ArrowLeft, ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ProductType } from '../types';

interface ProductTypeManagementProps {
  productTypes: ProductType[];
  onEdit: (productType: ProductType) => void;
  onDelete: (productTypeId: string) => void;
  onAdd: () => void;
  onBack: () => void;
  onReorder?: (reorderedProductTypes: ProductType[]) => void;
}

export default function ProductTypeManagement({
  productTypes,
  onEdit,
  onDelete,
  onAdd,
  onBack,
  onReorder
}: ProductTypeManagementProps) {
  const [sortConfig, setSortConfig] = useState<{key: keyof ProductType; direction: 'asc' | 'desc'} | null>(null);
  const [localProductTypes, setLocalProductTypes] = useState<ProductType[]>([]);

  // Update local product types when prop changes and sort by order
  useEffect(() => {
    const sorted = [...productTypes].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    setLocalProductTypes(sorted);
  }, [productTypes]);

  const sortedProductTypes = [...localProductTypes];
  
  if (sortConfig !== null) {
    sortedProductTypes.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) {
        return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const requestSort = (key: keyof ProductType) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof ProductType) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Move item up in the list
  const moveUp = (index: number) => {
    if (index <= 0) return;
    const newProductTypes = [...localProductTypes];
    [newProductTypes[index - 1], newProductTypes[index]] = [newProductTypes[index], newProductTypes[index - 1]];
    
    // Update order values
    if (newProductTypes[index - 1].order !== undefined && newProductTypes[index].order !== undefined) {
      const tempOrder = newProductTypes[index - 1].order;
      newProductTypes[index - 1].order = newProductTypes[index].order;
      newProductTypes[index].order = tempOrder;
    } else {
      // If order is not defined, set it
      newProductTypes[index - 1].order = index;
      newProductTypes[index].order = index - 1;
    }
    
    setLocalProductTypes(newProductTypes);
    
    // Call onReorder if provided
    if (onReorder) {
      onReorder(newProductTypes);
    }
  };

  // Move item down in the list
  const moveDown = (index: number) => {
    if (index >= localProductTypes.length - 1) return;
    const newProductTypes = [...localProductTypes];
    [newProductTypes[index], newProductTypes[index + 1]] = [newProductTypes[index + 1], newProductTypes[index]];
    
    // Update order values
    if (newProductTypes[index].order !== undefined && newProductTypes[index + 1].order !== undefined) {
      const tempOrder = newProductTypes[index].order;
      newProductTypes[index].order = newProductTypes[index + 1].order;
      newProductTypes[index + 1].order = tempOrder;
    } else {
      // If order is not defined, set it
      newProductTypes[index].order = index;
      newProductTypes[index + 1].order = index + 1;
    }
    
    setLocalProductTypes(newProductTypes);
    
    // Call onReorder if provided
    if (onReorder) {
      onReorder(newProductTypes);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Geri</span>
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Ürün Türleri</h1>
                <p className="text-gray-600">Ürün türlerini yönetin</p>
              </div>
            </div>
            <button
              onClick={onAdd}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ürün Türü</span>
            </button>
          </div>
        </div>

        {/* Product Types List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {sortedProductTypes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Henüz ürün türü eklenmemiş
              </h3>
              <p className="text-gray-600 mb-4">
                İlk ürün türünüzü ekleyerek başlayın
              </p>
              <button
                onClick={onAdd}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Ürün Türünü Ekle</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sırala
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        <span>Ürün Adı</span>
                        <span className="ml-1">{getSortIcon('name')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('unit')}
                    >
                      <div className="flex items-center">
                        <span>Birim</span>
                        <span className="ml-1">{getSortIcon('unit')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('currentPrice')}
                    >
                      <div className="flex items-center">
                        <span>Güncel Fiyat</span>
                        <span className="ml-1">{getSortIcon('currentPrice')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProductTypes.map((productType, index) => (
                    <tr key={productType.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                            title="Yukarı taşı"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveDown(index)}
                            disabled={index === sortedProductTypes.length - 1}
                            className={`p-1 rounded ${index === sortedProductTypes.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                            title="Aşağı taşı"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {productType.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {productType.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {productType.currentPrice.toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onEdit(productType)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(productType.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Ürün Türleri Hakkında
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Ürün türleri mal alımı ve satışı işlemlerinde kullanılır</li>
                  <li>Güncel fiyat, mal alımı/satışı işlemlerinde varsayılan birim fiyat olarak kullanılır</li>
                  <li>Ürün ile ödeme ve borç işlemlerinde birim fiyat kullanılmaz</li>
                  <li>Bir ürün türünü silebilmek için önce o ürünü kullanan tüm işlemleri silmelisiniz</li>
                  <li>Ürün türlerini yeniden sıralamak için yukarı/aşağı oklara tıklayabilirsiniz</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}