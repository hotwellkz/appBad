import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { doc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { showErrorNotification } from '../../utils/notifications';

interface EditTotalIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditTotalIncomeModal: React.FC<EditTotalIncomeModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handleReset = async () => {
    try {
      const batch = writeBatch(db);

      // Обнуляем общий доход в статистике
      const statsRef = doc(db, 'stats', 'dashboard');
      await setDoc(statsRef, {
        totalIncome: 0,
        updatedAt: new Date()
      }, { merge: true });

      await batch.commit();
      showErrorNotification('Общий доход успешно обнулен');
      onClose();
    } catch (error) {
      console.error('Error resetting total income:', error);
      showErrorNotification('Ошибка при обнулении общего дохода');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Общий доход</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Вы уверены, что хотите обнулить общий доход?
          </p>
          <p className="text-sm text-gray-500">
            Это действие нельзя будет отменить.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Отмена
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
          >
            Обнулить
          </button>
        </div>
      </div>
    </div>
  );
};