import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Employee, SalaryRecord, SalaryType, PaymentMethod } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  UserCheck,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  History,
  CreditCard,
} from 'lucide-react';

export const EmployeesModule: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [currency, setCurrency] = useState('$');

  const [activeTab, setActiveTab] = useState<'employees' | 'salary-sheets'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Modals
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isAddSalaryModalOpen, setIsAddSalaryModalOpen] = useState(false);
  const [isPaySalaryModalOpen, setIsPaySalaryModalOpen] = useState(false);
  const [activeSalaryRecord, setActiveSalaryRecord] = useState<SalaryRecord | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);

  // Form: Employee
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: '',
    name: '',
    phone: '',
    department: 'Stitching',
    jobField: 'Operator',
    joiningDate: new Date().toISOString().split('T')[0],
    salaryType: 'Monthly' as SalaryType,
    agreedSalary: 400,
    status: 'Active' as 'Active' | 'On Leave' | 'Inactive',
    notes: '',
  });

  // Form: Salary Period Record
  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    employeeCode: '',
    employeeName: '',
    department: '',
    periodType: 'Monthly' as 'Monthly' | 'Weekly' | 'Custom',
    periodStart: new Date().toISOString().slice(0, 7) + '-01',
    periodEnd: new Date().toISOString().slice(0, 7) + '-28',
    agreedSalary: 0,
    additionalEarnings: 0,
    deductions: 0,
    amountPaid: 0,
    notes: '',
  });

  // Form: Partial/Full Salary Payment
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    method: 'Cash' as PaymentMethod,
    reference: `SAL-VCH-${Math.floor(100 + Math.random() * 900)}`,
    notes: '',
  });

  const loadData = () => {
    setEmployees(db.getEmployees());
    setSalaries(db.getSalaryRecords());
    setCurrency(db.getSettings().currencySymbol || '$');
  };

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, []);

  const departments = [
    'Cutting',
    'Stitching',
    'Finishing',
    'Quality Control',
    'Packaging',
    'Management',
    'Maintenance',
    'Accounts & Admin',
  ];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobField.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const totalPayrollPayable = salaries.reduce((sum, s) => sum + s.totalPayable, 0);
  const totalSalariesPaid = salaries.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalSalariesOutstanding = salaries.reduce((sum, s) => sum + s.remainingSalary, 0);

  const handleOpenAddEmployee = () => {
    const nextCode = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    setEmployeeForm({
      employeeId: nextCode,
      name: '',
      phone: '',
      department: 'Stitching',
      jobField: 'Operator',
      joiningDate: new Date().toISOString().split('T')[0],
      salaryType: 'Monthly',
      agreedSalary: 400,
      status: 'Active',
      notes: '',
    });
    setIsAddEmployeeModalOpen(true);
  };

  const handleOpenAddSalary = () => {
    const firstEmp = employees[0];
    setSalaryForm({
      employeeId: firstEmp?.id || '',
      employeeCode: firstEmp?.employeeId || '',
      employeeName: firstEmp?.name || '',
      department: firstEmp?.department || '',
      periodType: 'Monthly',
      periodStart: new Date().toISOString().slice(0, 7) + '-01',
      periodEnd: new Date().toISOString().slice(0, 7) + '-28',
      agreedSalary: firstEmp?.agreedSalary || 0,
      additionalEarnings: 0,
      deductions: 0,
      amountPaid: 0,
      notes: '',
    });
    setIsAddSalaryModalOpen(true);
  };

  const handleSelectEmployeeForSalary = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setSalaryForm({
        ...salaryForm,
        employeeId: emp.id,
        employeeCode: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        agreedSalary: emp.agreedSalary,
      });
    }
  };

  const handleOpenPaySalary = (record: SalaryRecord) => {
    setActiveSalaryRecord(record);
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      amount: record.remainingSalary,
      method: 'Bank Transfer',
      reference: `SAL-VCH-${Math.floor(100 + Math.random() * 900)}`,
      notes: 'Disbursement of remaining period wages',
    });
    setIsPaySalaryModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.employeeId) {
      alert('Please fill employee name and ID');
      return;
    }

    db.addEmployee(employeeForm);
    setIsAddEmployeeModalOpen(false);
  };

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.employeeId) {
      alert('Please select an employee');
      return;
    }

    db.addSalaryRecord({
      ...salaryForm,
      agreedSalary: Number(salaryForm.agreedSalary),
      additionalEarnings: Number(salaryForm.additionalEarnings || 0),
      deductions: Number(salaryForm.deductions || 0),
      amountPaid: Number(salaryForm.amountPaid || 0),
      payments:
        salaryForm.amountPaid > 0
          ? [
              {
                id: `spay-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: Number(salaryForm.amountPaid),
                method: 'Cash',
                reference: 'Initial Period Advance',
                notes: 'Period start advance',
              },
            ]
          : [],
    });

    setIsAddSalaryModalOpen(false);
  };

  const handleSaveSalaryPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSalaryRecord || paymentForm.amount <= 0) return;

    db.recordSalaryPayment(activeSalaryRecord.id, {
      date: paymentForm.date,
      amount: Number(paymentForm.amount),
      method: paymentForm.method,
      reference: paymentForm.reference,
      notes: paymentForm.notes,
    });

    setIsPaySalaryModalOpen(false);
    setActiveSalaryRecord(null);
  };

  const handleDeleteEmployee = () => {
    if (deleteConfirmEmployee) {
      db.deleteEmployee(deleteConfirmEmployee.id);
      setDeleteConfirmEmployee(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Employees & Factory Payroll
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Staff directory, monthly/weekly wage generation, overtime additions, and partial salary disbursement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={DollarSign}
            onClick={handleOpenAddSalary}
          >
            + Generate Salary Sheet
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddEmployee}
          >
            + Register Employee
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Net Wages Payable
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalPayrollPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Disbursed to Staff
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {currency}{totalSalariesPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Pending Salary Balances
          </div>
          <div className="text-2xl font-black text-neutral-950 mt-1 font-mono">
            {currency}{totalSalariesOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Employees Directory ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('salary-sheets')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'salary-sheets'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Salary Vouchers & Payroll ({salaries.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder={activeTab === 'employees' ? 'Search employee name or ID...' : 'Search salary sheet...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            {activeTab === 'employees' && (
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-neutral-900"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Employees Directory */}
      {activeTab === 'employees' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Job Designation</th>
                  <th className="py-3 px-4 text-center">Salary Basis</th>
                  <th className="py-3 px-4 text-right">Agreed Rate</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      No employees match the filter.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">{emp.employeeId}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{emp.name}</div>
                        {emp.phone && <div className="text-[10px] text-neutral-400">{emp.phone}</div>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-800">{emp.department}</td>
                      <td className="py-3 px-4 text-neutral-700">{emp.jobField}</td>
                      <td className="py-3 px-4 text-center text-neutral-700">{emp.salaryType}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                        {currency}{emp.agreedSalary.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{emp.joiningDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[11px] text-neutral-800 uppercase tracking-wider">
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setDeleteConfirmEmployee(emp)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Salary Sheets */}
      {activeTab === 'salary-sheets' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Salary Sheet #</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Agreed Wage</th>
                  <th className="py-3 px-4 text-right">Additions</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Total Payable</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Remaining Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Disbursement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-neutral-500">
                      No payroll records generated yet.
                    </td>
                  </tr>
                ) : (
                  salaries.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">{s.salaryNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{s.employeeName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{s.employeeCode} · {s.department}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">
                        {s.periodStart} → {s.periodEnd}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-600">{currency}{s.agreedSalary.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-600">+{currency}{s.additionalEarnings.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-600">-{currency}{s.deductions.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        {currency}{s.totalPayable.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-800">
                        {currency}{s.amountPaid.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-neutral-950">
                        {currency}{s.remainingSalary.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[11px] uppercase tracking-wider">
                        {s.status}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.remainingSalary > 0 ? (
                          <button
                            onClick={() => handleOpenPaySalary(s)}
                            className="px-2 py-1 bg-neutral-900 text-white rounded text-[11px] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            Pay Salary
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-[10px] font-bold">Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Employee Modal */}
      <Modal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        title="Register Factory Employee"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Employee ID *</label>
              <input
                type="text"
                value={employeeForm.employeeId}
                onChange={(e) => setEmployeeForm({ ...employeeForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                placeholder="Muhammad Bilal"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Department</label>
              <select
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Job Designation</label>
              <input
                type="text"
                value={employeeForm.jobField}
                onChange={(e) => setEmployeeForm({ ...employeeForm, jobField: e.target.value })}
                placeholder="Senior Lockstitch Operator"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Salary Type</label>
              <select
                value={employeeForm.salaryType}
                onChange={(e) => setEmployeeForm({ ...employeeForm, salaryType: e.target.value as SalaryType })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Daily">Daily</option>
                <option value="Per piece">Per piece</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Agreed Salary ({currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={employeeForm.agreedSalary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, agreedSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Phone</label>
              <input
                type="text"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                placeholder="+92 300 0000000"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddEmployeeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Register Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Generate Salary Sheet Modal */}
      <Modal
        isOpen={isAddSalaryModalOpen}
        onClose={() => setIsAddSalaryModalOpen(false)}
        title="Generate Period Salary Sheet"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSalary} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Select Employee *</label>
              <select
                value={salaryForm.employeeId}
                onChange={(e) => handleSelectEmployeeForSalary(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employeeId} - {e.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Period Type</label>
              <select
                value={salaryForm.periodType}
                onChange={(e) => setSalaryForm({ ...salaryForm, periodType: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Period Start</label>
              <input
                type="date"
                value={salaryForm.periodStart}
                onChange={(e) => setSalaryForm({ ...salaryForm, periodStart: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Period End</label>
              <input
                type="date"
                value={salaryForm.periodEnd}
                onChange={(e) => setSalaryForm({ ...salaryForm, periodEnd: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Agreed Wage ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={salaryForm.agreedSalary}
                onChange={(e) => setSalaryForm({ ...salaryForm, agreedSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Overtime / Additions</label>
              <input
                type="number"
                step="0.01"
                value={salaryForm.additionalEarnings}
                onChange={(e) => setSalaryForm({ ...salaryForm, additionalEarnings: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Deductions / Advance</label>
              <input
                type="number"
                step="0.01"
                value={salaryForm.deductions}
                onChange={(e) => setSalaryForm({ ...salaryForm, deductions: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Initial Disbursement Amount ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={salaryForm.amountPaid}
              onChange={(e) => setSalaryForm({ ...salaryForm, amountPaid: Number(e.target.value) })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddSalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Generate Sheet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Partial/Full Salary Modal */}
      <Modal
        isOpen={isPaySalaryModalOpen}
        onClose={() => setIsPaySalaryModalOpen(false)}
        title="Disburse Staff Salary"
        subtitle={`Employee: ${activeSalaryRecord?.employeeName} (${activeSalaryRecord?.employeeCode})`}
      >
        <form onSubmit={handleSaveSalaryPayment} className="space-y-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex justify-between mb-1">
              <span className="text-neutral-500">Total Payable:</span>
              <span className="font-mono font-bold">{currency}{activeSalaryRecord?.totalPayable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-neutral-500">Previously Paid:</span>
              <span className="font-mono text-neutral-700">{currency}{activeSalaryRecord?.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-1">
              <span className="text-neutral-700 font-bold">Remaining Due:</span>
              <span className="font-mono font-black text-neutral-950 text-sm">
                {currency}{activeSalaryRecord?.remainingSalary.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={activeSalaryRecord?.remainingSalary}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Disbursement Method</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="Cash">Cash Voucher</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Voucher / Receipt Ref</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsPaySalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Disbursement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmEmployee}
        onClose={() => setDeleteConfirmEmployee(null)}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee"
        message={`Are you sure you want to remove ${deleteConfirmEmployee?.name} from staff directory?`}
        isDestructive={true}
      />
    </div>
  );
};
