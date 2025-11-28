import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Employee, Item, Consumption } from '../types';
import { Plus, Trash2, Coffee, User, Cookie, X } from 'lucide-react';

interface SnackSlot {
  key: string; // Unique key for React rendering
  itemId: string;
  price: number;
}

export const DailyEntry: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [recentLog, setRecentLog] = useState<Consumption[]>([]);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  // Drink State
  const [selectedDrinkId, setSelectedDrinkId] = useState<string>('');
  const [drinkPrice, setDrinkPrice] = useState<number>(0);

  // Dynamic Snack State (Defaults to 1 slot)
  const [snackSlots, setSnackSlots] = useState<SnackSlot[]>([
    { key: 'init', itemId: '', price: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEmployees(StorageService.getEmployees().filter(e => e.isActive));
    setItems(StorageService.getItems().filter(i => i.isActive));
    refreshLogs();
  };

  const refreshLogs = () => {
    const today = new Date().toISOString().split('T')[0];
    const allLogs = StorageService.getConsumptions();
    const todaysLogs = allLogs.filter(log => log.date.startsWith(today));
    setRecentLog(todaysLogs);
  };

  // Group logs by Date (Timestamp) and Employee for the Activity Feed
  const groupedLogs = useMemo(() => {
      const groups: Record<string, Consumption[]> = {};
      
      recentLog.forEach(log => {
          // Grouping by exact timestamp allows us to group items submitted together
          const key = `${log.date}_${log.employeeId}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(log);
      });

      // Sort by date descending
      return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [recentLog]);

  // Filter items for dropdowns
  const drinkItems = items.filter(i => i.type === 'drink');
  const snackItems = items.filter(i => i.type === 'snack');

  // Handlers
  const handleDrinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDrinkId(id);
    const item = items.find(i => i.id === id);
    setDrinkPrice(item ? item.price : 0);
  };

  const handleSnackChange = (index: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const newSlots = [...snackSlots];
    newSlots[index].itemId = id;
    
    const item = items.find(i => i.id === id);
    newSlots[index].price = item ? item.price : 0;
    
    setSnackSlots(newSlots);
  };

  const handleSnackPriceChange = (index: number, val: number) => {
    const newSlots = [...snackSlots];
    newSlots[index].price = val;
    setSnackSlots(newSlots);
  };

  const addSnackSlot = () => {
    setSnackSlots([...snackSlots, { key: crypto.randomUUID(), itemId: '', price: 0 }]);
  };

  const removeSnackSlot = (index: number) => {
    const newSlots = [...snackSlots];
    newSlots.splice(index, 1);
    setSnackSlots(newSlots);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
        alert("Please select an employee.");
        return;
    }

    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    let entriesAdded = 0;
    const timestamp = new Date().toISOString(); // Shared timestamp for grouping

    // Helper to add entry
    const addEntry = (itemId: string, price: number) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            StorageService.addConsumption({
                id: crypto.randomUUID(),
                employeeId: employee.id,
                itemId: item.id,
                itemName: item.name,
                itemType: item.type,
                price: price,
                date: timestamp 
            });
            entriesAdded++;
        }
    };

    // Process Drink
    if (selectedDrinkId) addEntry(selectedDrinkId, drinkPrice);
    
    // Process Snacks
    snackSlots.forEach(slot => {
        if (slot.itemId) addEntry(slot.itemId, slot.price);
    });

    if (entriesAdded === 0) {
        alert("Please select at least one item (Drink or Snack).");
        return;
    }

    refreshLogs();
    
    // Reset inputs
    setSelectedDrinkId(''); setDrinkPrice(0);
    // Reset to default 1 empty slot
    setSnackSlots([{ key: crypto.randomUUID(), itemId: '', price: 0 }]);
  };

  const handleDeleteGroup = (logs: Consumption[]) => {
    if (confirm(`Delete this entire entry (${logs.length} items)?`)) {
      logs.forEach(log => StorageService.removeConsumption(log.id));
      refreshLogs();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Entry Form */}
      <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-tea-900">
          <Coffee className="w-5 h-5" />
          New Daily Entry
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Employee Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Employee</label>
            <div className="relative">
              <select
                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-tea-500 outline-none appearance-none font-medium"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <User className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Drink Section */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <Coffee className="w-4 h-4" /> Drink
                </label>
                <div className="flex gap-2">
                    <select
                        className="flex-1 p-2 bg-blue-50 border border-blue-100 rounded focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                        value={selectedDrinkId}
                        onChange={handleDrinkChange}
                    >
                        <option value="">None</option>
                        {drinkItems.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        className="w-24 p-2 bg-blue-50 border border-blue-100 rounded focus:ring-2 focus:ring-blue-200 outline-none text-sm text-center font-medium"
                        value={drinkPrice}
                        onChange={(e) => setDrinkPrice(Number(e.target.value))}
                        min="0"
                        placeholder="Price"
                    />
                </div>
            </div>

            {/* Snacks Section */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                        <Cookie className="w-4 h-4" /> Snacks
                    </label>
                </div>
                
                {snackSlots.map((slot, index) => (
                    <div key={slot.key} className="flex gap-2 items-center animate-fade-in">
                        <select
                            className="flex-1 p-2 bg-orange-50 border border-orange-100 rounded focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                            value={slot.itemId}
                            onChange={(e) => handleSnackChange(index, e)}
                        >
                            <option value="">{index === 0 ? "Select Snack" : "Additional Snack"}</option>
                            {snackItems.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className="w-24 p-2 bg-orange-50 border border-orange-100 rounded focus:ring-2 focus:ring-orange-200 outline-none text-sm text-center font-medium"
                            value={slot.price}
                            onChange={(e) => handleSnackPriceChange(index, Number(e.target.value))}
                            min="0"
                            placeholder="Price"
                        />
                        {/* Remove button only for extra slots, OR allow clearing if it's the only one? 
                            Requirement: "default 1 snack dropdown". We'll keep at least one, 
                            but allow removing extras. */}
                        {index > 0 && (
                            <button
                                type="button"
                                onClick={() => removeSnackSlot(index)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove item"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
                
                <button
                    type="button"
                    onClick={addSnackSlot}
                    className="text-xs flex items-center gap-1 text-tea-600 hover:text-tea-700 font-semibold mt-2 px-2 py-1 rounded hover:bg-tea-50 transition-colors w-fit"
                >
                    <Plus className="w-3 h-3" /> Add Another Snack
                </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-tea-600 hover:bg-tea-500 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-95 duration-150"
          >
            <Plus className="w-5 h-5" />
            Add to Log
          </button>
        </form>
      </div>

      {/* Today's Activity Feed */}
      <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
        <h2 className="text-xl font-semibold mb-4 text-tea-900 border-b pb-2">Today's Activity</h2>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {groupedLogs.length === 0 ? (
            <div className="text-center text-gray-400 mt-20 flex flex-col items-center gap-3">
                <Coffee className="w-10 h-10 opacity-20" />
                <p>No entries for today yet.</p>
            </div>
          ) : (
            groupedLogs.map(([key, logs]) => {
                const firstLog = logs[0];
                const empName = employees.find(e => e.id === firstLog.employeeId)?.name || 'Unknown';
                const time = new Date(firstLog.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const totalCost = logs.reduce((sum, item) => sum + item.price, 0);

                return (
                    <div key={key} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow bg-gray-50/50">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-gray-800">{empName}</h3>
                                <span className="text-xs text-gray-400 font-mono">{time}</span>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-tea-700 text-lg">₹{totalCost}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                            {logs.map((item, idx) => (
                                <div key={item.id} className="flex justify-between text-sm items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.itemType === 'drink' ? 'bg-blue-400' : 'bg-orange-400'}`}></span>
                                        <span className="text-gray-600">{item.itemName}</span>
                                    </div>
                                    <span className="text-gray-500 font-medium">₹{item.price}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex justify-end">
                            <button 
                                onClick={() => handleDeleteGroup(logs)}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" /> Delete Entry
                            </button>
                        </div>
                    </div>
                );
            })
          )}
        </div>
      </div>
    </div>
  );
};