import { useState, useEffect } from 'react';
import { Client } from '../../types/client';
import { subscribeToClients } from '../../services/clientService';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [status, setStatus] = useState<'building' | 'deposit' | 'built' | 'all'>('all');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

  useEffect(() => {
    const unsubscribe = subscribeToClients(
      (allClients) => {
        // Ensure all clients have the correct isIconsVisible value
        const updatedClients = allClients.map(client => ({
          ...client,
          isIconsVisible: client.status === 'built' ? false : (client.isIconsVisible ?? true)
        }));
        setClients(updatedClients);
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

  return {
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
  };
};