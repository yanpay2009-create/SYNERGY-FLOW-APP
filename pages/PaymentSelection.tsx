
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Wallet, CreditCard, QrCode, Check, Plus, Trash2, X, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentType, CreditCardInfo } from '../types';

export const PaymentSelection: React.FC = () => {
  const { paymentMethod, setPaymentMethod, user, savedCards, addCreditCard, removeCreditCard, selectCreditCard, selectedCardId, showToast } = useApp();
  const navigate = useNavigate();
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ cardNumber: '', expiryDate: '', cardHolder: '' });

  const handleSelectMethod = (method: PaymentType) => {
    setPaymentMethod(method);
    if (method !== 'CreditCard') {
        navigate(-1);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCard.cardNumber.length < 16) {
        showToast({ message: "Please enter a valid card number.", type: 'error' });
        return;
    }
    addCreditCard(newCard);
    setNewCard({ cardNumber: '', expiryDate: '', cardHolder: '' });
    setShowAddCard(false);
  };

  const formatCardNumber = (num: string) => {
      const v = num.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const matches = v.match(/\d{4,16}/g);
      const match = (matches && matches[0]) || '';
      const parts = [];
      for (let i = 0, len = match.length; i < len; i += 4) {
          parts.push(match.substring(i, i + 4));
      }
      if (parts.length > 0) {
          return parts.join(' ');
      } else {
          return v;
      }
  };

  const methods: { id: PaymentType; label: string; icon: any; desc: string }[] = [
    { 
        id: 'PromptPay', 
        label: 'PromptPay QR', 
        icon: QrCode, 
        desc: 'Scan to pay instantly' 
    },
    { 
        id: 'Wallet', 
        label: 'My Wallet', 
        icon: Wallet, 
        desc: `Balance: ฿${(user?.walletBalance ?? 0).toLocaleString()}` 
    },
    { 
        id: 'CreditCard', 
        label: 'Credit / Debit Card', 
        icon: CreditCard, 
        desc: 'Visa, Mastercard, JCB' 
    },
  ];

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 pt-16 pb-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Payment Method</h1>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {methods.map((method) => (
            <div key={method.id} className="space-y-3">
                <div 
                    onClick={() => handleSelectMethod(method.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${paymentMethod === method.id ? 'bg-blue-50 dark:bg-blue-900/20 border-synergy-blue shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent shadow-soft'}`}
                >
                    <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === method.id ? 'bg-synergy-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                            <method.icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{method.label}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</p>
                        </div>
                    </div>
                    {paymentMethod === method.id && (
                        <div className="w-6 h-6 bg-synergy-blue rounded-full flex items-center justify-center text-white">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    )}
                </div>

                {/* Credit Card Sub-menu */}
                {method.id === 'CreditCard' && paymentMethod === 'CreditCard' && (
                    <div className="pl-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        {savedCards.map(card => (
                            <div 
                                key={card.id}
                                onClick={() => selectCreditCard(card.id)}
                                className={`p-4 rounded-xl border transition flex items-center justify-between ${selectedCardId === card.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-6 bg-gray-900 rounded flex items-center justify-center text-[8px] text-white font-black italic">
                                        {card.brand.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">**** **** **** {card.cardNumber.slice(-4)}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">{card.brand} • {card.expiryDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {selectedCardId === card.id && <Check size={14} className="text-indigo-500" />}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeCreditCard(card.id); }}
                                        className="p-1.5 text-gray-300 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!showAddCard ? (
                            <button 
                                onClick={() => setShowAddCard(true)}
                                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 flex items-center justify-center space-x-2 hover:border-synergy-blue hover:text-synergy-blue transition"
                            >
                                <Plus size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Add New Card</span>
                            </button>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-soft border border-indigo-100 dark:border-indigo-900/50">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">New Card Details</h4>
                                    <button onClick={() => setShowAddCard(false)}><X size={16} className="text-gray-400" /></button>
                                </div>
                                <form onSubmit={handleAddCard} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Card Number</label>
                                        <input 
                                            value={newCard.cardNumber}
                                            onChange={e => setNewCard({...newCard, cardNumber: formatCardNumber(e.target.value).slice(0, 19)})}
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div className="flex space-x-3">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Expiry Date</label>
                                            <input 
                                                value={newCard.expiryDate}
                                                onChange={e => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                                    setNewCard({...newCard, expiryDate: val});
                                                }}
                                                placeholder="MM/YY"
                                                maxLength={5}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">CVV</label>
                                            <input 
                                                type="password"
                                                placeholder="***"
                                                maxLength={3}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Card Holder</label>
                                        <input 
                                            value={newCard.cardHolder}
                                            onChange={e => setNewCard({...newCard, cardHolder: e.target.value.toUpperCase()})}
                                            placeholder="FULL NAME"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white font-bold"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-indigo-500 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-500/20 uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all">Save & Select Card</button>
                                </form>
                            </div>
                        )}
                        
                        {savedCards.length > 0 && (
                            <button 
                                onClick={() => navigate(-1)}
                                className="w-full bg-synergy-blue text-white font-black py-3.5 rounded-xl shadow-glow active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px]"
                            >
                                Use Selected Card
                            </button>
                        )}
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};
