import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Building2, Car, Globe, Hammer, Home, Package, User, Wallet } from 'lucide-react';
import { CategoryCardType } from '../types';
import React from 'react';

const iconMap: { [key: string]: React.ElementType } = {
  Car,
  User,
  Building2,
  Wallet,
  Home,
  Hammer,
  Globe,
  Package
};

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeCallbacks: (() => void)[] = [];

    try {
      // Подписываемся на изменения для каждой строки категорий
      [1, 2, 3, 4].forEach(row => {
        const q = query(
          collection(db, 'categories'),
          where('row', '==', row)
        );

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            setCategories(prev => {
              const updatedCategories = [...prev];
              
              snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const IconComponent = iconMap[data.icon] || Home;
                
                // Проверяем видимость категории
                // Если isVisible явно установлен в false, категория будет скрыта
                const isVisible = data.isVisible !== false;
                
                const categoryData: CategoryCardType = {
                  id: change.doc.id,
                  title: data.title,
                  amount: data.amount || '0 ₸',
                  icon: React.createElement(IconComponent, { 
                    size: 24,
                    className: "text-white"
                  }),
                  iconName: data.icon,
                  color: data.color || 'bg-emerald-500',
                  row: data.row || 1,
                  isVisible // Явно устанавливаем флаг видимости
                };

                const index = updatedCategories.findIndex(cat => cat.id === categoryData.id);
                
                if (change.type === 'added' && index === -1) {
                  updatedCategories.push(categoryData);
                } else if (change.type === 'modified' && index !== -1) {
                  updatedCategories[index] = categoryData;
                } else if (change.type === 'removed' && index !== -1) {
                  updatedCategories.splice(index, 1);
                }
              });

              // Сортируем категории по строкам и фильтруем скрытые
              return updatedCategories
                .sort((a, b) => (a.row || 0) - (b.row || 0))
                .filter(category => category.isVisible !== false);
            });
            setLoading(false);
          },
          (error) => {
            console.error('Categories subscription error:', error);
            setError('Ошибка получения данных');
            setLoading(false);
          }
        );

        unsubscribeCallbacks.push(unsubscribe);
      });
    } catch (error) {
      console.error('Error in useCategories:', error);
      setError('Ошибка при инициализации подписки на категории');
      setLoading(false);
    }

    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  return { 
    categories, // Категории уже отфильтрованы по видимости внутри эффекта
    loading, 
    error 
  };
};