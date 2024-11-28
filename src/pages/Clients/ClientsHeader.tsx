import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';

interface ClientsHeaderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  status: 'building' | 'deposit' | 'built' | 'all';
  setStatus: (status: 'building' | 'deposit' | 'built' | 'all') => void;
  yearOptions: number[];
  onAddClick: () => void;
}

export const ClientsHeader: React.FC<ClientsHeaderProps> = ({
  selectedYear,
  setSelectedYear,
  status,
  setStatus,
  yearOptions,
  onAddClick
}) => {
  return (
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
              onClick={onAddClick}
              className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-5 h-5 mr-1" />
              Добавить клиента
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};