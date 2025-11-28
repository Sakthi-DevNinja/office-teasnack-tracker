import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Employee, Item } from '../types';
import { Settings, Users, Coffee, Plus, Trash2, Edit2 } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'items'>('employees');

  // Form States
  const [newEmpName, setNewEmpName] = useState('');
  const [newItem, setNewItem] = useState<{name: string; price: number; type: 'drink' | 'snack'}>({ name: '', price: 10, type: 'snack' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setEmployees(StorageService.getEmployees());
    setItems(StorageService.getItems());
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    StorageService.saveEmployee({
      id: crypto.randomUUID(),
      name: newEmpName,
      isActive: true
    });
    setNewEmpName('');
    refreshData();
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    StorageService.saveItem({
      id: crypto.randomUUID(),
      name: newItem.name,
      price: newItem.price,
      type: newItem.type,
      isActive: true
    });
    setNewItem({ name: '', price: 10, type: 'snack' });
    refreshData();
  };

  const toggleEmployeeStatus = (emp: Employee) => {
    StorageService.saveEmployee({ ...emp, isActive: !emp.isActive });
    refreshData();
  };

  const handlePriceUpdate = (item: Item, newPrice: number) => {
    StorageService.saveItem({ ...item, price: newPrice });
    refreshData();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'employees' ? 'bg-tea-50 text-tea-700 border-b-2 border-tea-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('employees')}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Employees
          </div>
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'items' ? 'bg-tea-50 text-tea-700 border-b-2 border-tea-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('items')}
        >
          <div className="flex items-center justify-center gap-2">
            <Coffee className="w-4 h-4" />
            Items & Prices
          </div>
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'employees' ? (
          <div className="space-y-6">
            <form onSubmit={handleAddEmployee} className="flex gap-4">
              <input
                type="text"
                placeholder="New Employee Name"
                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-tea-500"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
              />
              <button type="submit" className="bg-tea-600 text-white px-6 rounded-lg font-medium hover:bg-tea-700 transition-colors">
                Add
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className={`flex items-center justify-between p-4 rounded-lg border ${emp.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                  <span className="font-medium text-gray-800">{emp.name}</span>
                  <button
                    onClick={() => toggleEmployeeStatus(emp)}
                    className={`text-xs px-3 py-1 rounded-full font-medium ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <input
                type="text"
                placeholder="Item Name"
                className="md:col-span-1 p-2 border border-gray-200 rounded outline-none"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
               <select
                className="md:col-span-1 p-2 border border-gray-200 rounded outline-none"
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as 'drink' | 'snack' })}
              >
                <option value="drink">Drink (Company)</option>
                <option value="snack">Snack (Employee)</option>
              </select>
              <input
                type="number"
                placeholder="Price"
                className="md:col-span-1 p-2 border border-gray-200 rounded outline-none"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
              />
              <button type="submit" className="bg-tea-600 text-white rounded font-medium hover:bg-tea-700 transition-colors">
                Add Item
              </button>
            </form>

            <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="p-3">Item</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Price (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-t border-gray-100">
                                <td className="p-3 font-medium text-gray-800">{item.name}</td>
                                <td className="p-3">
                                    <span className={`text-xs px-2 py-1 rounded ${item.type === 'drink' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {item.type === 'drink' ? 'Company' : 'Personal'}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <input 
                                        type="number"
                                        className="w-20 p-1 border border-gray-200 rounded text-sm"
                                        value={item.price}
                                        onChange={(e) => handlePriceUpdate(item, Number(e.target.value))}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
