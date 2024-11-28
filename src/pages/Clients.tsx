import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { collection, doc, updateDoc, where, writeBatch, getDocs, query } from 'firebase/firestore';
import { db, deleteClientContracts } from '../lib/firebase';
import { ClientContextMenu } from '../components/ClientContextMenu';
import { Client, NewClient, initialClientState } from '../types/client';
import { ClientList } from '../components/clients/ClientList';
import { ClientModal } from '../components/clients/ClientModal';
import { ClientPage } from './ClientPage';
import { DeleteClientModal } from '../components/modals/DeleteClientModal';
import { subscribeToClients } from '../services/clientService';
import { showErrorNotification } from '../utils/notifications';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<NewClient>(initialClientState);
  const [showClientPage, setShowClientPage] = useState(false);
  const [status, setStatus] = useState<'building' | 'deposit' | 'built' | 'all'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

  useEffect(() => {
    const unsubscribe = subscribeToClients(
      (allClients) => {
        setClients(allClients);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching clients:', error);
        setLoading(false);
      },
      {
        year: selectedYear,
        status: status === 'all' ? undefined : status
      }
    );

    return () => unsubscribe();
  }, [selectedYear, status]);

  const handleContextMenu = (e: React.MouseEvent, client: Client) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedClient(client);
    setShowContextMenu(true);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowClientPage(true);
  };

  const handleEdit = () => {
    if (selectedClient) {
      setEditingClient({
        ...selectedClient
      });
      setShowEditModal(true);
      setShowContextMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setShowDeleteModal(true);
    setShowContextMenu(false);
  };

  const handleStatusChange = async (clientId: string, newStatus: 'building' | 'deposit' | 'built') => {
    try {
      const batch = writeBatch(db);

      // Получаем данные клиента
      const clientRef = doc(db, 'clients', clientId);
      const clientSnapshot = await getDocs(query(collection(db, 'clients'), where('id', '==', clientId)));
      
      if (clientSnapshot.empty) {
        throw new Error('Клиент не найден');
      }

      const clientData = clientSnapshot.docs[0].data();
      const clientName = `${clientData.lastName} ${clientData.firstName}`;

      // Генерируем новый номер клиента
      const year = new Date().getFullYear();
      const statusQuery = query(
        collection(db, 'clients'),
        where('status', '==', newStatus),
        where('year', '==', year)
      );
      
      const statusSnapshot = await getDocs(statusQuery);
      let maxNumber = 0;

      statusSnapshot.forEach(doc => {
        const data = doc.data();
        const currentNumber = parseInt(data.clientNumber.split('-')[1]);
        if (currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      });

      const newNumber = maxNumber + 1;
      const newClientNumber = `${year}-${String(newNumber).padStart(3, '0')}`;

      // Обновляем клиента
      batch.update(clientRef, {
        status: newStatus,
        clientNumber: newClientNumber,
        isIconsVisible: newStatus !== 'built'
      });

      // Находим все категории клиента
      const categoryQueries = [
        query(collection(db, 'categories'), where('title', '==', clientName), where('row', '==', 1)),
        query(collection(db, 'categories'), where('title', '==', clientName), where('row', '==', 3))
      ];

      const categorySnapshots = await Promise.all(categoryQueries.map(q => getDocs(q)));

      // Обновляем видимость всех категорий
      categorySnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            isVisible: newStatus !== 'built'
          });
        });
      });

      await batch.commit();

      // Обновляем локальное состояние
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? {
                ...client,
                status: newStatus,
                clientNumber: newClientNumber,
                isIconsVisible: newStatus !== 'built'
              }
            : client
        )
      );

      showErrorNotification('Статус клиента успешно изменен');
    } catch (error) {
      console.error('Error updating client status:', error);
      showErrorNotification('Ошибка при изменении статуса клиента');
    }
  };

  const handleDeleteWithHistory = async () => {
    if (!selectedClient) return;
    
    try {
      const batch = writeBatch(db);

      batch.delete(doc(db, 'clients', selectedClient.id));

      const [projectsQuery, clientsQuery] = [
        query(
          collection(db, 'categories'),
          where('title', '==', `${selectedClient.lastName} ${selectedClient.firstName}`),
          where('row', '==', 3)
        ),
        query(
          collection(db, 'categories'),
          where('title', '==', `${selectedClient.lastName} ${selectedClient.firstName}`),
          where('row', '==', 1)
        )
      ];
      
      const [projectsSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(projectsQuery),
        getDocs(clientsQuery)
      ]);

      const categoryIds = [...projectsSnapshot.docs, ...clientsSnapshot.docs].map(doc => doc.id);

      [...projectsSnapshot.docs, ...clientsSnapshot.docs].forEach(doc => {
        batch.delete(doc.ref);
      });

      for (const categoryId of categoryIds) {
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('categoryId', '==', categoryId)
        );
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        transactionsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      await deleteClientContracts(selectedClient.id);

      await batch.commit();
      
      setClients(prevClients => prevClients.filter(c => c.id !== selectedClient.id));
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client with history:', error);
      showErrorNotification('Ошибка при удалении клиента');
    }
  };

  const handleDeleteIconOnly = async () => {
    if (!selectedClient) return;
    
    try {
      const batch = writeBatch(db);

      batch.delete(doc(db, 'clients', selectedClient.id));

      const [projectsQuery, clientsQuery] = [
        query(
          collection(db, 'categories'),
          where('title', '==', `${selectedClient.lastName} ${selectedClient.firstName}`),
          where('row', '==', 3)
        ),
        query(
          collection(db, 'categories'),
          where('title', '==', `${selectedClient.lastName} ${selectedClient.firstName}`),
          where('row', '==', 1)
        )
      ];
      
      const [projectsSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(projectsQuery),
        getDocs(clientsQuery)
      ]);
      
      [...projectsSnapshot.docs, ...clientsSnapshot.docs].forEach(doc => {
        batch.delete(doc.ref);
      });

      await deleteClientContracts(selectedClient.id);

      await batch.commit();
      
      setClients(prevClients => prevClients.filter(c => c.id !== selectedClient.id));
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      showErrorNotification('Ошибка при удалении клиента');
    }
  };

  const handleToggleVisibility = async (client: Client) => {
    try {
      const batch = writeBatch(db);
      const newVisibility = !client.isIconsVisible;

      // Обновляем состояние клиента
      const clientRef = doc(db, 'clients', client.id);
      batch.update(clientRef, { 
        isIconsVisible: newVisibility 
      });

      // Находим все связанные категории
      const categoryQueries = [
        query(
          collection(db, 'categories'),
          where('title', '==', `${client.lastName} ${client.firstName}`),
          where('row', '==', 3)
        ),
        query(
          collection(db, 'categories'),
          where('title', '==', `${client.lastName} ${client.firstName}`),
          where('row', '==', 1)
        )
      ];

      const snapshots = await Promise.all(categoryQueries.map(q => getDocs(q)));

      // Обновляем видимость всех категорий
      snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { 
            isVisible: newVisibility 
          });
        });
      });

      await batch.commit();

      // Обновляем локальное состояние
      setClients(prevClients =>
        prevClients.map(c =>
          c.id === client.id ? { ...c, isIconsVisible: newVisibility } : c
        )
      );
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showErrorNotification('Ошибка при изменении видимости иконок');
    }
  };

  const handleClientSaved = () => {
    setShowAddModal(false);
    setShowEditModal(false);
  };

  if (showClientPage && selectedClient) {
    return (
      <ClientPage
        client={selectedClient}
        onBack={() => setShowClientPage(false)}
        onSave={handleClientSaved}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button onClick={() => window.history.back()} className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Клиенты</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'building' | 'deposit' | 'built' | 'all')}
                className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="all">Все</option>
                <option value="building">Строим</option>
                <option value="deposit">Задаток</option>
                <option value="built">Построено</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-5 h-5 mr-1" />
                Добавить клиента
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <ClientList
            clients={clients}
            onContextMenu={handleContextMenu}
            onClientClick={handleClientClick}
            onToggleVisibility={handleToggleVisibility}
            status={status}
          />
        )}
      </div>

      {showContextMenu && selectedClient && (
        <ClientContextMenu
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={async (newStatus) => {
            if (!selectedClient) return;
            await handleStatusChange(selectedClient.id, newStatus);
            setShowContextMenu(false);
          }}
          clientName={`${selectedClient.lastName} ${selectedClient.firstName}`}
          currentStatus={selectedClient.status}
        />
      )}

      {(showAddModal || showEditModal) && (
        <ClientModal
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          client={showEditModal ? editingClient : initialClientState}
          isEditMode={showEditModal}
          yearOptions={yearOptions}
          onSave={handleClientSaved}
        />
      )}

      {showDeleteModal && selectedClient && (
        <DeleteClientModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDeleteWithHistory={handleDeleteWithHistory}
          onDeleteIconOnly={handleDeleteIconOnly}
          clientName={`${selectedClient.lastName} ${selectedClient.firstName}`}
        />
      )}
    </div>
  );
};