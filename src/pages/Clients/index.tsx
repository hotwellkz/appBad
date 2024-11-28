import React, { useState } from 'react';
import { ClientsHeader } from './ClientsHeader';
import { ClientsContent } from './ClientsContent';
import { ClientPage } from '../ClientPage';
import { Client, NewClient, initialClientState } from '../../types/client';
import { ClientModal } from '../../components/clients/ClientModal';
import { DeleteClientModal } from '../../components/modals/DeleteClientModal';
import { useClients } from './useClients';
import { useClientActions } from './useClientActions';

export const Clients: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClientPage, setShowClientPage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingClient, setEditingClient] = useState<NewClient>(initialClientState);

  const {
    clients,
    setClients,
    loading,
    selectedYear,
    setSelectedYear,
    status,
    setStatus,
    selectedClient,
    setSelectedClient,
    yearOptions
  } = useClients();

  const {
    handleStatusChange,
    handleDeleteWithHistory,
    handleDeleteIconOnly,
    handleToggleVisibility
  } = useClientActions(setClients);

  const handleClientSaved = () => {
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleEdit = () => {
    if (selectedClient) {
      setEditingClient({
        ...selectedClient
      });
      setShowEditModal(true);
    }
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
      <ClientsHeader
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        status={status}
        setStatus={setStatus}
        yearOptions={yearOptions}
        onAddClick={() => setShowAddModal(true)}
      />

      <ClientsContent
        clients={clients}
        loading={loading}
        onClientClick={(client) => {
          setSelectedClient(client);
          setShowClientPage(true);
        }}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteModal(true)}
        onStatusChange={handleStatusChange}
        onToggleVisibility={handleToggleVisibility}
        setSelectedClient={setSelectedClient}
        status={status}
      />

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