import React from 'react';
import { NewClient } from '../../types/client';

interface ClientFormProps {
  client: NewClient;
  onChange: (updates: Partial<NewClient>) => void;
  yearOptions: number[];
  isEditMode?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onChange,
  yearOptions,
  isEditMode = false
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя *
          </label>
          <input
            type="text"
            required
            value={client.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors text-gray-900"
            placeholder="Введите имя"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон *
          </label>
          <input
            type="tel"
            required
            value={client.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors text-gray-900"
            placeholder="+7 (___) ___-__-__"
          />
        </div>

        <div className="hidden">
          <input type="hidden" value={client.year} />
          <input type="hidden" value={client.status} />
          <input type="hidden" value={client.lastName} />
        </div>
      </div>
    </div>
  );
};