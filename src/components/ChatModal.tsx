import React, { useState } from 'react';
import { X, Send, MessageSquare, Phone, Truck, User } from 'lucide-react';
import { ChatMessage, Trucker } from '../types/logistics';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentRole: 'shipper' | 'trucker';
  trucker: Trucker | null;
  shipperName: string;
  onSendMessage: (text: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  currentRole,
  trucker,
  shipperName,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const quickReplies = currentRole === 'shipper' ? [
    'What is your current ETA to dock?',
    'Dock Bay 14-B is wide open and ready!',
    'Is the fuel escrow approved on your side?',
    'Take extra care with the optical sensors.',
  ] : [
    'Arrived at the depot gate!',
    'Strapped down 4 heavy ratchet binders.',
    'Slight 10m slowdown on interstate, moving smoothly now.',
    'Fuel mobilization card credited. Thank you!',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;
    onSendMessage(text);
    if (!textToSend) setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[560px] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={trucker?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={trucker?.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {currentRole === 'shipper' ? trucker?.name || 'Assigned Driver' : shipperName}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentRole === 'shipper' ? trucker?.truckModel : 'Cargo Owner / Shipper'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${trucker?.phone}`}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 border border-slate-700 transition"
              title="Call Phone"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
          {messages.map((msg) => {
            const isMe = 
              (currentRole === 'shipper' && msg.senderRole === 'shipper') ||
              (currentRole === 'trucker' && msg.senderRole === 'trucker');
            const isSystem = msg.senderRole === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="text-[11px] bg-slate-900/90 text-amber-300 border border-slate-800 px-3 py-1 rounded-full inline-block">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-0.5 px-1">{msg.senderName} • {msg.timestamp}</span>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Replies */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qr)}
              className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1 rounded-lg transition"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message or delivery update..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleSend()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
