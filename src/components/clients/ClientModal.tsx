import React, { useState } from 'react';
import { X } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, addCategory } from '../../lib/firebase';
import { NewClient, initialClientState } from '../../types/client';
import { ClientForm } from './ClientForm';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: NewClient;
  isEditMode?: boolean;
  yearOptions: number[];
  onSave: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  client: initialClient,
  isEditMode = false,
  yearOptions,
  onSave
}) => {
  const [client, setClient] = useState<NewClient>(initialClient);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const generateClientNumber = async (status: 'building' | 'deposit', year: number) => {
    try {
      const q = query(
        collection(db, 'clients'),
        where('status', '==', status),
        where('year', '==', year)
      );
      
      const snapshot = await getDocs(q);
      let maxNumber = 0;

      snapshot.forEach(doc => {
        const clientData = doc.data();
        const currentNumber = parseInt(clientData.clientNumber.split('-')[1]);
        if (currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      });

      const nextNumber = maxNumber + 1;
      return `${year}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating client number:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clientData = { ...client };

      if (!isEditMode) {
        // Генерируем номер клиента для новых клиентов
        const clientNumber = await generateClientNumber(client.status, client.year);
        clientData.clientNumber = clientNumber;

        // Создаем клиента
        const clientRef = await addDoc(collection(db, 'clients'), {
          ...clientData,
          createdAt: serverTimestamp()
        });
        
        // Создаем иконки только если имя не "Milyuk Vitaliy"
        if (!(client.lastName === "Milyuk" && client.firstName === "Vitaliy")) {
          await Promise.all([
            addCategory({
              title: `${client.lastName} ${client.firstName}`,
              icon: 'Building2',
              color: 'bg-blue-500',
              row: 3
            }),
            addCategory({
              title: `${client.lastName} ${client.firstName}`,
              icon: 'User',
              color: 'bg-amber-400',
              row: 1
            })
          ]);
        }
      } else {
        const clientRef = doc(db, 'clients', initialClient.id!);
        await updateDoc(clientRef, {
          ...clientData,
          updatedAt: serverTimestamp()
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Ошибка при сохранении данных клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (updates: Partial<NewClient>) => {
    setClient(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Редактировать клиента' : 'Добавить клиента'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <ClientForm
            client={client}
            onChange={handleChange}
            yearOptions={yearOptions}
            isEditMode={isEditMode}
          />

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:bg-gray-400"
            >
              {loading ? 
                'Сохранение...' : 
                isEditMode ? 'Сохранить' : 'Добавить'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};