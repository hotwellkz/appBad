import React, { useState } from 'react';
import { Client } from '../../types/client';
import { ClientList } from '../../components/clients/ClientList';
import { ClientContextMenu } from '../../components/ClientContextMenu';

interface ClientsContentProps {
  clients: Client[];
  loading: boolean;
  onClientClick: (client: Client) => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (clientId: string, status: 'building' | 'deposit' | 'built') => void;
  onToggleVisibility: (client: Client) => void;
  setSelectedClient: (client: Client | null) => void;
  status: 'building' | 'deposit' | 'built' | 'all';
}

export const ClientsContent: React.FC<ClientsContentProps> = ({
  clients,
  loading,
  onClientClick,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleVisibility,
  setSelectedClient,
  status
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, client: Client) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedClient(client);
    setShowContextMenu(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          <ClientList
            clients={clients}
            onContextMenu={handleContextMenu}
            onClientClick={onClientClick}
            onToggleVisibility={onToggleVisibility}
            status={status}
          />

          {showContextMenu && (
            <ClientContextMenu
              position={contextMenuPosition}
              onClose={() => {
                setShowContextMenu(false);
                setSelectedClient(null);
              }}
              onEdit={() => {
                onEdit();
                setShowContextMenu(false);
              }}
              onDelete={() => {
                onDelete();
                setShowContextMenu(false);
              }}
              onStatusChange={async (newStatus) => {
                const client = clients.find(c => c.id === clients[0]?.id);
                if (client) {
                  await onStatusChange(client.id, newStatus);
                }
                setShowContextMenu(false);
              }}
              clientName={`${clients[0]?.lastName} ${clients[0]?.firstName}`}
              currentStatus={clients[0]?.status}
            />
          )}
        </>
      )}
    </div>
  );
};