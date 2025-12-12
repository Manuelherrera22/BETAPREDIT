/**
 * Virtualized List Component
 * Optimized list rendering for large datasets using react-window
 */

import { FixedSizeList as List } from 'react-window';
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
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <List
        height={containerHeight}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}

