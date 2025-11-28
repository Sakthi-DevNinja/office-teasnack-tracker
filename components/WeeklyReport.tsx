import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { BillingService, DailyCompanyBill, EmployeeBill } from '../services/billingService';
import { Consumption, Employee } from '../types';
import { TallyAutomation } from './TallyAutomation';
import { FileText, Calendar, Sparkles, Coffee, Cookie, Plus, Minus } from 'lucide-react';
import { generateWeeklyInsight } from '../services/geminiService';

export const WeeklyReport: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [activeEmployeeCount, setActiveEmployeeCount] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  
  // Calculated State
  const [companyBillRows, setCompanyBillRows] = useState<DailyCompanyBill[]>([]);
  const [employeeBills, setEmployeeBills] = useState<EmployeeBill[]>([]);
  const [dailyGroupedLogs, setDailyGroupedLogs] = useState<Record<string, Consumption[]>>({});
  
  // Financial Totals
  const [totalManualTransfer, setTotalManualTransfer] = useState(0);
  const [grandTotalCompany, setGrandTotalCompany] = useState(0);

  // Daily Adjustments: { "YYYY-MM-DD": { empId: count } }
  const [dailyAdjustments, setDailyAdjustments] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    // Default to current week
    const curr = new Date(); 
    const first = curr.getDate() - curr.getDay() + 1; 
    const last = first + 6; 

    const firstday = new Date(curr.setDate(first)).toISOString().split('T')[0];
    const lastday = new Date(curr.setDate(last)).toISOString().split('T')[0];
    
    setStartDate(firstday);
    setEndDate(lastday);

    loadData();
  }, []);

  const loadData = () => {
    setEmployees(StorageService.getEmployees());
    setConsumptions(StorageService.getConsumptions());
    setActiveEmployeeCount(StorageService.getActiveEmployeesCount());
    setDailyAdjustments(StorageService.getDailyAdjustments());
  };

  useEffect(() => {
      calculateReport();
  }, [startDate, endDate, consumptions, employees, dailyAdjustments]);

  const calculateReport = () => {
    if (!startDate || !endDate) return;
    
    // Filter Data
    const filteredConsumptions = consumptions.filter(c => {
        const cDate = c.date.split('T')[0];
        return cDate >= startDate && cDate <= endDate;
    });

    // Group for Tally Automation Component
    const grouped: Record<string, Consumption[]> = {};
    filteredConsumptions.forEach(c => {
        const dateKey = c.date.split('T')[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(c);
    });
    setDailyGroupedLogs(grouped);

    // Calculate Billing Stats via Service
    const result = BillingService.calculateBilling(
        filteredConsumptions,
        employees,
        activeEmployeeCount,
        dailyAdjustments
    );

    setCompanyBillRows(result.companyBillRows);
    setEmployeeBills(result.employeeBills);
    setTotalManualTransfer(result.totalManualTransferAmount);
    setGrandTotalCompany(result.grandTotalCompanyAmount);
  };

  const handleGenerateInsight = async () => {
      setIsGeneratingAi(true);
      try {
          const items = StorageService.getItems();
          const insight = await generateWeeklyInsight(consumptions, employees, items, []); 
          setAiInsight(insight);
      } catch (e) {
          alert("Failed to generate insight.");
      } finally {
          setIsGeneratingAi(false);
      }
  };

  // --- Employee Adjustment Handlers (Updates TODAY) ---
  const handleManualAdjustment = (empId: string, delta: number) => {
      const today = new Date().toISOString().split('T')[0];
      const newDailyAdjustments = { ...dailyAdjustments };
      
      if (!newDailyAdjustments[today]) newDailyAdjustments[today] = {};
      
      const current = newDailyAdjustments[today][empId] || 0;
      newDailyAdjustments[today][empId] = current + delta;
      
      setDailyAdjustments(newDailyAdjustments);
      StorageService.saveDailyAdjustments(newDailyAdjustments);
  };

  const sortedDates = Object.keys(dailyGroupedLogs).sort();

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-tea-600" />
                    Weekly Reports
                </h2>
                <p className="text-sm text-gray-500 mt-1">Review Company & Employee expenses</p>
            </div>
            
            <div className="flex gap-4 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        className="bg-transparent border-none text-sm outline-none text-gray-700 font-medium"
                    />
                </div>
                <span className="text-gray-400">-</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-transparent border-none text-sm outline-none text-gray-700 font-medium"
                    />
                </div>
            </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
          
          {/* Company Tea Report (Bill + Details) */}
          <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <div className="w-8 h-8 rounded-full bg-tea-100 flex items-center justify-center text-tea-600">
                      <Coffee className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Company Drinks Bill</h3>
              </div>
              
              {/* Company Bill Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-tea-50 text-tea-800 text-xs uppercase tracking-wider border-b border-tea-100">
                            <th className="p-4 font-semibold">Date</th>
                            <th className="p-4 font-semibold text-center">Total Staff</th>
                            <th className="p-4 font-semibold text-center">Drinks</th>
                            <th className="p-4 font-semibold text-right">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {companyBillRows.length === 0 ? (
                             <tr><td colSpan={4} className="p-8 text-center text-gray-400">No data available.</td></tr>
                        ) : (
                            companyBillRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-700">
                                        {new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                                    </td>
                                    <td className="p-4 text-center text-gray-600">{row.totalStaff}</td>
                                    <td className="p-4 text-center text-blue-600 font-medium">{row.actualDrinkCount}</td>
                                    <td className="p-4 text-right font-bold text-gray-800">
                                        ₹{row.amount}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {companyBillRows.length > 0 && (
                        <tfoot className="bg-gray-50 font-bold text-gray-800">
                            {/* Manual Adjustment Summary Row */}
                            {totalManualTransfer !== 0 && (
                                <tr className="bg-orange-50 text-orange-800">
                                    <td className="p-4" colSpan={3}>
                                        <span className="flex items-center gap-2 text-sm font-semibold">
                                            <Cookie className="w-4 h-4" />
                                            Manual Adjustments from Employee Snacks
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {totalManualTransfer > 0 ? `+₹${totalManualTransfer}` : `-₹${Math.abs(totalManualTransfer)}`}
                                    </td>
                                </tr>
                            )}
                            {/* Grand Total Row */}
                            <tr className="border-t-2 border-tea-200 bg-tea-50">
                                <td className="p-4">Total</td>
                                <td colSpan={2} className="p-4 text-right pr-8 text-gray-500 text-xs uppercase tracking-wide">Grand Total</td>
                                <td className="p-4 text-right text-xl text-tea-700 font-extrabold">
                                    ₹{grandTotalCompany}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600 mt-4">
                  <p><strong>Billing Rule:</strong> <code>Sum of Drinks Prices (Tea/Coffee/Milk)</code></p>
                  <p className="text-xs mt-1 text-gray-500">
                      * Drinks are Company Expense.
                      * Auto-adjustments are disabled. Use the Employee Snack Bill below to manually move snacks to the Company Bill.
                  </p>
              </div>

              {/* Daily Details (Visual Cards) */}
              <div className="mt-8">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Daily Tally Details</h4>
                  <p className="text-xs text-gray-400 mb-4">Note: This section shows theoretical adjustments only. Auto-filling is disabled in the final bill.</p>
                  {sortedDates.length === 0 ? <p className="text-gray-400 italic">No daily details.</p> : 
                    sortedDates.sort().reverse().map(date => (
                        <TallyAutomation 
                            key={date}
                            date={date}
                            consumptions={dailyGroupedLogs[date]}
                            activeEmployeeCount={activeEmployeeCount}
                            employees={employees}
                        />
                  ))}
              </div>
          </div>

          {/* Employee Snack Report */}
          <div className="space-y-6">
               <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Cookie className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Employee Snack Bill</h3>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Employee</th>
                            <th className="p-4 font-semibold">Items</th>
                            <th className="p-4 font-semibold text-center w-40">Adjust (Today)</th>
                            <th className="p-4 font-semibold text-center">Net Count</th>
                            <th className="p-4 font-semibold text-right">Amount</th>
                            <th className="p-4 font-semibold text-right">Revised Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {employeeBills.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">No personal snack expenses.</td></tr>
                        ) : (
                            employeeBills.map((bill) => {
                                return (
                                <tr key={bill.employee.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{bill.employee.name}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs text-gray-500 max-w-xs break-words">
                                            {bill.items.map(i => i.itemName).join(', ')}
                                        </div>
                                    </td>
                                    {/* Manual Adjustment Column (Controls for TODAY only) */}
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg p-1 w-fit mx-auto">
                                            <button 
                                                onClick={() => handleManualAdjustment(bill.employee.id, -1)}
                                                disabled={!bill.canDecreaseAdjustment}
                                                className={`p-1 rounded ${!bill.canDecreaseAdjustment ? 'text-gray-300' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-mono font-medium w-6 text-center text-tea-700">
                                                {/* SHOW TODAY'S DEDUCTION COUNT */}
                                                {bill.todayAdjustmentCount}
                                            </span>
                                            <button 
                                                 onClick={() => handleManualAdjustment(bill.employee.id, 1)}
                                                 disabled={!bill.canIncreaseAdjustment}
                                                 className={`p-1 rounded ${!bill.canIncreaseAdjustment ? 'text-gray-300' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {/* Optional Hint about historical adjustments */}
                                        {bill.totalDeductedCount > bill.todayAdjustmentCount && (
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                (Hist: {bill.totalDeductedCount - bill.todayAdjustmentCount})
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-semibold text-gray-500 mb-1">Total: {bill.originalItemCount}</span>
                                            {bill.finalDeductedCount > 0 && (
                                                <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                                    -{bill.finalDeductedCount}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-sm font-medium text-gray-600">₹{bill.originalAmount}</span>
                                        {bill.finalDeductedAmount > 0 && (
                                            <div className="text-xs text-green-600">-₹{bill.finalDeductedAmount}</div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-lg font-bold text-tea-600">₹{bill.finalPayableAmount}</span>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                    {employeeBills.length > 0 && (
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td className="p-4 font-bold text-gray-700">Total</td>
                                <td colSpan={4} className="p-4 text-right font-bold text-gray-500">
                                    ₹{employeeBills.reduce((a,b) => a + (Number(b.originalAmount) || 0), 0)}
                                </td>
                                <td className="p-4 text-right font-bold text-tea-700">
                                    ₹{employeeBills.reduce((sum, bill) => sum + (Number(bill.finalPayableAmount) || 0), 0)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
              </div>
          </div>
      </div>

      {/* AI Insight Section */}
      <div className="mt-8 bg-gradient-to-r from-tea-50 to-white p-6 rounded-xl border border-tea-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-tea-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Analysis
                </h3>
                {!aiInsight && (
                    <button 
                        onClick={handleGenerateInsight}
                        disabled={isGeneratingAi}
                        className="text-xs bg-white border border-tea-200 hover:bg-tea-50 text-tea-700 px-3 py-1.5 rounded-full transition-colors font-medium"
                    >
                        {isGeneratingAi ? 'Analyzing...' : 'Generate Insights with Gemini'}
                    </button>
                )}
            </div>
            {aiInsight ? (
                <div className="text-gray-700 text-sm leading-relaxed animate-fade-in">
                    {aiInsight}
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic">
                    Generate a smart summary of consumption trends and anomalies using Google Gemini.
                </p>
            )}
        </div>
    </div>
  );
};