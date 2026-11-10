import React, { useState, useMemo } from 'react';
import { GroupedItem } from '../types/receipt';
import { Search, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { normalizeDescription } from '../utils/normalize';

interface ItemListProps {
  items: GroupedItem[];
  selectedItem: GroupedItem | null;
  onSelectItem: (item: GroupedItem) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  selectedItem,
  onSelectItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const normalizedQuery = normalizeDescription(searchTerm);
    return items.filter((item) =>
      item.normalizedDescription.includes(normalizedQuery) ||
      normalizeDescription(item.canonicalDescription).includes(normalizedQuery)
    );
  }, [items, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800 text-sm tracking-tight">
              Grouped Items
            </h2>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {filteredItems.length} of {items.length}
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Item List Options */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100" role="listbox" aria-label="Receipt Items">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No items match your search.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const firstPrice = item.priceHistory[0]?.unitPrice ?? item.latestPrice;
            const diff = item.latestPrice - firstPrice;

            return (
              <button
                key={item.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectItem(item)}
                className={`w-full text-left p-3.5 transition-colors flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-50/80 hover:bg-indigo-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <p
                    className={`text-sm font-medium truncate ${
                      isSelected ? 'text-indigo-900 font-semibold' : 'text-slate-800'
                    }`}
                  >
                    {item.canonicalDescription}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{item.itemCount} {item.itemCount === 1 ? 'receipt' : 'receipts'}</span>
                    <span>•</span>
                    <span className="font-mono">R$ {item.minPrice.toFixed(2)} - R$ {item.maxPrice.toFixed(2)}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold font-mono text-slate-900">
                    R$ {item.latestPrice.toFixed(2)}
                  </div>
                  <div className="text-xs flex items-center justify-end mt-0.5 font-medium">
                    {diff > 0.01 ? (
                      <span className="text-rose-600 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        +R${diff.toFixed(2)}
                      </span>
                    ) : diff < -0.01 ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />
                        -R${Math.abs(diff).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-0.5">
                        <Minus className="w-3 h-3" />
                        stable
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
