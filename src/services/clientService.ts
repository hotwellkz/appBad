import { collection, query, orderBy, onSnapshot, where, QueryConstraint, getDocs, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Client } from '../types/client';
import { ensureCategoryVisibility } from '../lib/firebase/categoryStateManager';

export const subscribeToClients = (
  onUpdate: (clients: Client[]) => void,
  onError: (error: Error) => void,
  filters?: {
    status?: 'building' | 'deposit' | 'built';
    year?: number;
  }
) => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.year) {
      constraints.push(where('year', '==', filters.year));
    }

    const q = query(collection(db, 'clients'), ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const clientsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isIconsVisible: data.status === 'built' ? false : (data.isIconsVisible ?? true)
          } as Client;
        });
        
        // Асинхронно обновляем видимость категорий
        clientsData.forEach(client => {
          ensureCategoryVisibility(client.id, client.status).catch(console.error);
        });
        
        onUpdate(clientsData);
      },
      (error) => {
        console.error('Error subscribing to clients:', error);
        onError(error);
      }
    );
  } catch (error) {
    console.error('Error subscribing to clients:', error);
    onError(error);
    return () => {}; // Return empty unsubscribe function
  }
};

export const getClients = async (filters?: {
  status?: 'building' | 'deposit' | 'built';
  year?: number;
}) => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.year) {
      constraints.push(where('year', '==', filters.year));
    }

    const q = query(collection(db, 'clients'), ...constraints);
    const snapshot = await getDocs(q);
    
    const clients = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isIconsVisible: data.status === 'built' ? false : (data.isIconsVisible ?? true)
      } as Client;
    });

    // Асинхронно обновляем видимость категорий
    clients.forEach(client => {
      ensureCategoryVisibility(client.id, client.status).catch(console.error);
    });

    return clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};