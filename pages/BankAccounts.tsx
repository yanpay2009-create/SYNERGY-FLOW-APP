
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Landmark, Plus, Trash2, CheckCircle2 } from 'lucide-react';
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
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">Bank Accounts</h1>
      </div>

      <div className="space-y-4 mb-6">
         {bankAccounts.length === 0 && !showForm && (
             <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                 <p className="text-gray-400 text-sm">No bank accounts added yet.</p>
             </div>
         )}

         {bankAccounts.map(bank => (
             <div 
                key={bank.id} 
                onClick={() => selectBank(bank.id)}
                className={`p-5 rounded-2xl shadow-soft flex justify-between items-center cursor-pointer transition-all border-2 ${selectedBankId === bank.id ? 'border-synergy-blue bg-blue-50/30' : 'border-transparent bg-white'}`}
             >
                 <div className="flex items-center space-x-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedBankId === bank.id ? 'bg-synergy-blue text-white' : 'bg-blue-50 text-synergy-blue'}`}>
                         <Landmark size={24} />
                     </div>
                     <div>
                         <h3 className="text-sm font-bold text-gray-900">{bank.bankName}</h3>
                         <p className="text-xs text-gray-500">{bank.accountNumber}</p>
                         <p className="text-[10px] text-gray-400 mt-1">{bank.accountName}</p>
                     </div>
                 </div>
                 <div className="flex items-center space-x-2">
                    {selectedBankId === bank.id && <CheckCircle2 size={20} className="text-synergy-blue" />}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            removeBankAccount(bank.id);
                        }} 
                        className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg transition"
                    >
                        <Trash2 size={16} />
                    </button>
                 </div>
             </div>
         ))}
      </div>

      {showForm ? (
          <div className="bg-white p-6 rounded-3xl shadow-lg animate-in fade-in zoom-in-95">
              <h2 className="text-lg font-bold mb-4">Add Bank Account</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                  <select 
                    value={form.bankName} 
                    onChange={e => setForm({...form, bankName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
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
                     className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                     required
                  />
                  <input 
                     placeholder="Account Name"
                     value={form.accountName}
                     onChange={e => setForm({...form, accountName: e.target.value})}
                     className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-500 cursor-not-allowed"
                     readOnly
                  />
                  <p className="text-[10px] text-gray-400 ml-2 italic">* Account name must match your verified identity.</p>
                  <div className="flex space-x-3 pt-2">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-gray-500 font-medium bg-gray-100 rounded-xl text-sm">Cancel</button>
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
                className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl flex items-center justify-center space-x-2 hover:border-synergy-blue hover:text-synergy-blue transition"
            >
                <Plus size={20} />
                <span className="font-medium">Add New Account</span>
            </button>
          )
      )}
      
      {bankAccounts.length >= 2 && !showForm && (
          <p className="text-center text-xs text-orange-500 mt-4 bg-orange-50 py-2 rounded-lg">
              Maximum 2 bank accounts allowed.
          </p>
      )}

    </div>
  );
};
