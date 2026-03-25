import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const FAQItem: React.FC<{ item: { q: string, a: string } }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-3 border border-transparent dark:border-gray-700">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.q}</span>
        {isOpen ? <ChevronUp size={16} className="text-synergy-blue" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {isOpen && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-2">
          {item.a}
        </p>
      )}
    </div>
  );
};

export const HelpSupport: React.FC = () => {
  const navigate = useNavigate();
  const { systemSettings, showToast } = useApp();
  const contactLinks = systemSettings?.contactLinks || { line: '', phone: '', email: '', website: '', terms: '', privacy: '' };

  const faqs = [
    {
      q: "How does the Affiliate Program work?",
      a: "Our program allows you to earn commissions by promoting products. You start as a Starter (5%) and can upgrade to Executive (30%) by achieving sales targets."
    },
    {
      q: "When do I get paid?",
      a: "Commissions are processed weekly. You can withdraw them to your connected bank account once the status is 'Paid'."
    },
    {
      q: "How do I upgrade my tier?",
      a: "Tiers are based on total accumulated sales. Starter (฿0+), Marketer (฿3,000+), Builder (฿6,000+), and Executive (฿9,000+)."
    },
    {
      q: "What are the withdrawal limits?",
      a: "The minimum withdrawal amount is ฿500 and the maximum is ฿50,000 per transaction."
    },
    {
      q: "Can I change my bank account?",
      a: "Yes, you can manage up to 2 bank accounts in the Personal Information > Bank Accounts section."
    }
  ];

  const handleContact = (type: 'line' | 'phone' | 'email') => {
    const value = contactLinks[type];
    if (!value) {
        showToast({ message: "Contact method currently unavailable.", type: 'error' });
        return;
    }

    if (type === 'line') {
        const url = value.startsWith('http') ? value : `https://line.me/ti/p/${value.replace('@', '')}`;
        window.open(url, '_blank');
    } else if (type === 'phone') {
        window.open(`tel:${value}`);
    } else if (type === 'email') {
        window.open(`mailto:${value}`);
    }
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 pt-10 pb-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Help & Support</h1>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">Contact Us</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => handleContact('line')}
            className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition border border-transparent dark:border-gray-700"
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">Line Chat</span>
          </button>
          
          <button 
            onClick={() => handleContact('phone')}
            className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition border border-transparent dark:border-gray-700"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-synergy-blue dark:text-blue-400 rounded-full flex items-center justify-center">
              <Phone size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">Call Center</span>
          </button>
          
          <button 
            onClick={() => handleContact('email')}
            className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition border border-transparent dark:border-gray-700"
          >
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center">
              <Mail size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">Email</span>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">Frequently Asked Questions</h2>
        {faqs.map((faq, idx) => (
          <FAQItem key={idx} item={faq} />
        ))}
      </div>
    </div>
  );
};