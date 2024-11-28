import { useState } from 'react';
import { Client } from '../types/client';
import { updateCategoriesVisibility } from '../lib/firebase/categoryStateManager';
import { showErrorNotification } from '../utils/notifications';

export const useClientVisibility = (setClients: React.Dispatch<React.SetStateAction<Client[]>>) => {
  const [updating, setUpdating] = useState(false);

  const toggleVisibility = async (client: Client) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const newVisibility = !client.isIconsVisible;
      const success = await updateCategoriesVisibility(
        `${client.lastName} ${client.firstName}`,
        newVisibility,
        client.id
      );

      if (success) {
        setClients(prevClients =>
          prevClients.map(c =>
            c.id === client.id ? { ...c, isIconsVisible: newVisibility } : c
          )
        );
        showErrorNotification(`Иконки успешно ${newVisibility ? 'показаны' : 'скрыты'}`);
      } else {
        throw new Error('Failed to update visibility');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showErrorNotification('Ошибка при изменении видимости иконок');
    } finally {
      setUpdating(false);
    }
  };

  return { toggleVisibility, updating };
};