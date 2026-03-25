
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Landmark, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';

export const BankAccounts: React.FC = () => {
  const { user, kycStatus, bankAccounts, selectedBankId, selectBank, addBankAccount, removeBankAccount, showToast } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: user?.kycFullName || '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (kycStatus !== 'Verified') {
        showToast({ message: "Please complete identity verification (KYC) before adding a bank account.", type: 'error' });
        return;
    }

    const kycName = user?.kycFullName || '';
    if (form.accountName.trim().toLowerCase() !== kycName.trim().toLowerCase()) {
        showToast({ message: `Account name must match your verified KYC name: ${kycName}`, type: 'error' });
        return;
    }

    const success = addBankAccount(form);
    if (success) {
        setShowForm(false);
        setForm({ bankName: '', accountNumber: '', accountName: user?.kycFullName || '' });
    } else {
        showToast({ message: "Maximum 2 bank accounts allowed.", type: 'error' });
    }
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header 
        title="Bank Accounts" 
        onBack={() => navigate(-1)}
      />

      <div className="space-y-4 mb-6">
         {bankAccounts.length === 0 && !showForm && (
             <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                 <p className="text-gray-400 dark:text-gray-500 text-sm">No bank accounts added yet.</p>
             </div>
         )}

         {bankAccounts.map(bank => (
             <div 
                key={bank.id} 
                onClick={() => selectBank(bank.id)}
                className={`p-5 rounded-2xl shadow-soft dark:shadow-none flex justify-between items-center cursor-pointer transition-all border-2 ${selectedBankId === bank.id ? 'border-synergy-blue bg-blue-50/30 dark:bg-blue-900/20' : 'border-transparent bg-white dark:bg-gray-800 dark:border-gray-700'}`}
             >
                 <div className="flex items-center space-x-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedBankId === bank.id ? 'bg-synergy-blue text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-synergy-blue'}`}>
                         <Landmark size={24} />
                     </div>
                     <div>
                         <h3 className="text-sm font-bold text-gray-900 dark:text-white">{bank.bankName}</h3>
                         <p className="text-xs text-gray-500 dark:text-gray-400">{bank.accountNumber}</p>
                         <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{bank.accountName}</p>
                     </div>
                 </div>
                 <div className="flex items-center space-x-2">
                    {selectedBankId === bank.id && <CheckCircle2 size={20} className="text-synergy-blue" />}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            removeBankAccount(bank.id);
                        }} 
                        className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-700 rounded-lg transition"
                    >
                        <Trash2 size={16} />
                    </button>
                 </div>
             </div>
         ))}
      </div>

      {showForm ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg dark:shadow-none border border-transparent dark:border-gray-700 animate-in fade-in zoom-in-95">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add Bank Account</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                  <select 
                    value={form.bankName} 
                    onChange={e => setForm({...form, bankName: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-synergy-blue/20"
                    required
                  >
                      <option value="">Select Bank</option>
                      <option value="Kasikorn Bank">Kasikorn Bank</option>
                      <option value="SCB">SCB</option>
                      <option value="Bangkok Bank">Bangkok Bank</option>
                      <option value="Krungthai Bank">Krungthai Bank</option>
                  </select>
                  <input 
                     placeholder="Account Number"
                     type="number"
                     value={form.accountNumber}
                     onChange={e => setForm({...form, accountNumber: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-synergy-blue/20"
                     required
                  />
                  <input 
                     placeholder="Account Name"
                     value={form.accountName}
                     onChange={e => setForm({...form, accountName: e.target.value})}
                     className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed"
                     readOnly
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-2 italic">* Account name must match your verified identity.</p>
                  <div className="flex space-x-3 pt-2">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 rounded-xl text-sm">Cancel</button>
                      <button type="submit" className="flex-1 py-3 bg-synergy-blue text-white font-bold rounded-xl text-sm shadow-glow">Save</button>
                  </div>
              </form>
          </div>
      ) : (
          bankAccounts.length < 2 && (
            <button 
                onClick={() => {
                    if (kycStatus !== 'Verified') {
                        showToast({ message: "Please complete identity verification (KYC) before adding a bank account.", type: 'error' });
                        navigate('/kyc');
                        return;
                    }
                    setShowForm(true);
                }}
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl flex items-center justify-center space-x-2 hover:border-synergy-blue hover:text-synergy-blue transition active:scale-[0.98]"
            >
                <Plus size={20} />
                <span className="font-medium">Add New Account</span>
            </button>
          )
      )}
      
      {bankAccounts.length >= 2 && !showForm && (
          <p className="text-center text-xs text-orange-500 mt-4 bg-orange-50 dark:bg-orange-900/20 py-2 rounded-lg">
              Maximum 2 bank accounts allowed.
          </p>
      )}

    </div>
  );
};
