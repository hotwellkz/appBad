import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CategoryCardType } from '../../types';
import { CategoryCard } from './CategoryCard';
import { ContextMenu } from '../ContextMenu';
import { DeleteWarehouseItemModal } from '../modals/DeleteWarehouseItemModal';
import { EditWarehouseItemModal } from '../modals/EditWarehouseItemModal';
import { TransactionHistory } from '../transactions/TransactionHistory';
import { collection, query, where, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { showErrorNotification } from '../../utils/notifications';

interface DroppableCategoryProps {
  category: CategoryCardType;
  onHistoryClick: () => void;
}

export const DroppableCategory: React.FC<DroppableCategoryProps> = ({
  category,
  onHistoryClick
}) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: category.id,
    data: category
  });

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Если категория должна быть скрыта, не рендерим её совсем
  if (category.isVisible === false) {
    return null;
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (category.row === 4) {
      e.preventDefault();
      e.stopPropagation();
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuWidth = 200;
      const menuHeight = 150;
      
      let x = e.clientX;
      let y = e.clientY;
      
      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 10;
      }
      
      if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 10;
      }
      
      setContextMenuPosition({ x, y });
      setShowContextMenu(true);
    }
  };

  const handleDeleteWithHistory = async () => {
    try {
      const batch = writeBatch(db);

      // Удаляем категорию
      batch.delete(doc(db, 'categories', category.id));

      // Находим и удаляем все связанные транзакции
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('categoryId', '==', category.id)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setShowDeleteModal(false);
      showErrorNotification('Категория успешно удалена');
    } catch (error) {
      console.error('Error deleting category with history:', error);
      showErrorNotification('Ошибка при удалении категории');
    }
  };

  const handleDeleteIconOnly = async () => {
    try {
      // Удаляем только категорию
      await deleteDoc(doc(db, 'categories', category.id));
      setShowDeleteModal(false);
      showErrorNotification('Категория успешно удалена');
    } catch (error) {
      console.error('Error deleting category:', error);
      showErrorNotification('Ошибка при удалении категории');
    }
  };

  const isValidDrop = () => {
    if (!active?.data.current) return false;
    
    const sourceCategory = active.data.current as CategoryCardType;
    const sourceRow = sourceCategory.row;
    const targetRow = category.row;

    // Клиент → Сотрудник
    if (sourceRow === 1 && targetRow === 2) return true;
    // Сотрудник → Проект
    if (sourceRow === 2 && targetRow === 3) return true;
    // Сотрудник ↔ Склад
    if ((sourceRow === 2 && targetRow === 4) || (sourceRow === 4 && targetRow === 2)) return true;

    return false;
  };

  const showDropIndicator = isOver && isValidDrop();

  return (
    <>
      <div
        ref={setNodeRef}
        className={`h-full flex items-center ${
          showDropIndicator ? 'ring-2 ring-emerald-500 ring-offset-2 rounded-lg' : ''
        }`}
        onContextMenu={handleContextMenu}
      >
        <CategoryCard 
          category={category} 
          onHistoryClick={onHistoryClick}
        />
      </div>

      {showContextMenu && (
        <ContextMenu
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onEdit={() => {
            setShowEditModal(true);
            setShowContextMenu(false);
          }}
          onDelete={() => {
            setShowDeleteModal(true);
            setShowContextMenu(false);
          }}
          title={category.title}
        />
      )}

      {showDeleteModal && (
        <DeleteWarehouseItemModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDeleteWithHistory={handleDeleteWithHistory}
          onDeleteIconOnly={handleDeleteIconOnly}
          itemName={category.title}
        />
      )}

      {showEditModal && (
        <EditWarehouseItemModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          category={category}
        />
      )}

      {showHistory && (
        <TransactionHistory
          category={category}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
};