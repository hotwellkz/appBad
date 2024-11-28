import { collection, query, where, getDocs, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { db } from './config';

export const updateCategoriesVisibility = async (
  clientName: string,
  isVisible: boolean,
  clientId: string
) => {
  const batch = writeBatch(db);

  try {
    // Находим все связанные категории
    const categoryQueries = [
      query(collection(db, 'categories'), where('title', '==', clientName), where('row', '==', 1)),
      query(collection(db, 'categories'), where('title', '==', clientName), where('row', '==', 3))
    ];

    const snapshots = await Promise.all(categoryQueries.map(q => getDocs(q)));

    // Обновляем все найденные категории
    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          isVisible,
          updatedAt: serverTimestamp()
        });
      });
    });

    // Обновляем состояние клиента
    const clientRef = doc(db, 'clients', clientId);
    batch.update(clientRef, {
      isIconsVisible: isVisible,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error updating categories visibility:', error);
    return false;
  }
};

export const ensureCategoryVisibility = async (clientId: string, status: string) => {
  try {
    const clientRef = doc(db, 'clients', clientId);
    const clientSnapshot = await getDocs(query(collection(db, 'clients'), where('__name__', '==', clientId)));

    if (clientSnapshot.empty) {
      return false;
    }

    const clientData = clientSnapshot.docs[0].data();
    const clientName = `${clientData.lastName} ${clientData.firstName}`;
    const isVisible = status !== 'built';

    return await updateCategoriesVisibility(clientName, isVisible, clientId);
  } catch (error) {
    console.error('Error ensuring category visibility:', error);
    return false;
  }
};