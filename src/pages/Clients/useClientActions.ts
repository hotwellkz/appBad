import { useState } from 'react';
import { Client } from '../../types/client';
import { useClientVisibility } from '../../hooks/useClientVisibility';
import { useClientStatus } from './useClientStatus';
import { useClientDeletion } from './useClientDeletion';

export const useClientActions = (setClients: React.Dispatch<React.SetStateAction<Client[]>>) => {
  const [processing, setProcessing] = useState(false);
  const { toggleVisibility } = useClientVisibility(setClients);
  const { updateStatus } = useClientStatus(setClients);
  const { deleteWithHistory, deleteIconOnly } = useClientDeletion(setClients);

  const handleStatusChange = async (clientId: string, newStatus: 'building' | 'deposit' | 'built') => {
    if (processing) return;
    setProcessing(true);
    try {
      await updateStatus(clientId, newStatus);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteWithHistory = async (client: Client) => {
    if (processing) return;
    setProcessing(true);
    try {
      await deleteWithHistory(client);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteIconOnly = async (client: Client) => {
    if (processing) return;
    setProcessing(true);
    try {
      await deleteIconOnly(client);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleVisibility = async (client: Client) => {
    if (processing) return;
    setProcessing(true);
    try {
      await toggleVisibility(client);
    } finally {
      setProcessing(false);
    }
  };

  return {
    handleStatusChange,
    handleDeleteWithHistory,
    handleDeleteIconOnly,
    handleToggleVisibility,
    processing
  };
};