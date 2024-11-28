import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2, Building2, Wallet, CheckCircle2 } from 'lucide-react';

interface ClientContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: 'building' | 'deposit' | 'built') => void;
  clientName: string;
  currentStatus?: 'building' | 'deposit' | 'built';
}

export const ClientContextMenu: React.FC<ClientContextMenuProps> = ({
  position,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  clientName,
  currentStatus
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Добавляем обработчики событий
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);

    // Проверяем и корректируем позицию меню
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      // Корректируем позицию по горизонтали
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      // Корректируем позицию по вертикали
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      // Применяем скорректированные координаты
      menuRef.current.style.left = `${Math.max(10, x)}px`;
      menuRef.current.style.top = `${Math.max(10, y)}px`;
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose, position]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg py-1 z-[1000] min-w-[200px]"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
        {clientName}
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" />
        Редактировать
      </button>

      {currentStatus !== 'building' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange('building');
          }}
          className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          Перевести в "Строим"
        </button>
      )}

      {currentStatus !== 'deposit' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange('deposit');
          }}
          className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          Перевести в "Задаток"
        </button>
      )}

      {currentStatus !== 'built' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange('built');
          }}
          className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Перевести в "Построено"
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Удалить
      </button>
    </div>
  );
};