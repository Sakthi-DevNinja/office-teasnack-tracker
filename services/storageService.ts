import { Employee, Item, Consumption } from '../types';

// Initial Data Seeding
const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Gopalan', isActive: true },
  { id: '2', name: 'Navin', isActive: true },
  { id: '3', name: 'Jeeva', isActive: true },
  { id: '4', name: 'Sakthivel', isActive: true },
  { id: '5', name: 'Sandhiya', isActive: true },
  { id: '6', name: 'Sanjiv', isActive: true },
  { id: '7', name: 'Kowsalya', isActive: true },
  { id: '8', name: 'Praneesh', isActive: true },
  { id: '9', name: 'Richard', isActive: true },
  { id: '10', name: 'Abhishek', isActive: true },
];

const INITIAL_ITEMS: Item[] = [
  { id: 'i1', name: 'Tea', price: 10, type: 'drink', isActive: true },
  { id: 'i2', name: 'Coffee', price: 15, type: 'drink', isActive: true },
  { id: 'i3', name: 'Milk', price: 10, type: 'drink', isActive: true },
  { id: 'i4', name: 'Bonda', price: 10, type: 'snack', isActive: true },
  { id: 'i5', name: 'Bajji', price: 10, type: 'snack', isActive: true },
  { id: 'i6', name: 'Vada', price: 10, type: 'snack', isActive: true },
];

const STORAGE_KEYS = {
  EMPLOYEES: 'ts_employees',
  ITEMS: 'ts_items',
  CONSUMPTION: 'ts_consumption',
  DAILY_ADJUSTMENTS: 'ts_daily_adjustments', // New Key
};

export const StorageService = {
  // Employees
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
  },
  saveEmployee: (employee: Employee) => {
    const employees = StorageService.getEmployees();
    const index = employees.findIndex((e) => e.id === employee.id);
    if (index >= 0) {
      employees[index] = employee;
    } else {
      employees.push(employee);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },
  deleteEmployee: (id: string) => {
    const employees = StorageService.getEmployees().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  // Items
  getItems: (): Item[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return data ? JSON.parse(data) : INITIAL_ITEMS;
  },
  saveItem: (item: Item) => {
    const items = StorageService.getItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  },

  // Consumption
  getConsumptions: (): Consumption[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CONSUMPTION);
    return data ? JSON.parse(data) : [];
  },
  addConsumption: (entry: Consumption) => {
    const data = StorageService.getConsumptions();
    data.push(entry);
    localStorage.setItem(STORAGE_KEYS.CONSUMPTION, JSON.stringify(data));
  },
  removeConsumption: (id: string) => {
    const data = StorageService.getConsumptions().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONSUMPTION, JSON.stringify(data));
  },
  
  // Daily Adjustments: { "YYYY-MM-DD": { "empId": count } }
  getDailyAdjustments: (): Record<string, Record<string, number>> => {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_ADJUSTMENTS);
    return data ? JSON.parse(data) : {};
  },
  saveDailyAdjustments: (adjustments: Record<string, Record<string, number>>) => {
    localStorage.setItem(STORAGE_KEYS.DAILY_ADJUSTMENTS, JSON.stringify(adjustments));
  },

  // Helpers
  getActiveEmployeesCount: (): number => {
    return StorageService.getEmployees().filter(e => e.isActive).length;
  }
};