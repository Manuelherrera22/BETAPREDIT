/**
 * Virtualized List Component
 * Optimized list rendering for large datasets
 * Note: Temporarily using simple div list until react-window types are fixed
 */

import { ReactNode } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight = 600,
  renderItem,
  className = '',
}: VirtualizedListProps<T>) {
  if (items.length === 0) {
    return null;
  }

  // Simple implementation without react-window for now
  // TODO: Fix react-window import types
  return (
    <div className={className} style={{ maxHeight: containerHeight, overflowY: 'auto' }}>
      {items.map((item, index) => (
        <div key={index} style={{ minHeight: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

