import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiSend, FiX, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../contexts/UIContext';

const PLACEHOLDER_RESPONSES = [
  "Hello! I'm MTDRB AI. How can I help you today?",
  "I can provide insights, reports, suggestions, and answer questions about your gym data.",
  "(ChatGPT integration coming soon!)"
];

export default function MtdrbAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: PLACEHOLDER_RESPONSES[0] }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { drawerOpen, bottomUIHeight } = useUI();

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(msgs => [
      ...msgs,
      { role: 'user', text: input },
      { role: 'ai', text: PLACEHOLDER_RESPONSES[(msgs.length) % PLACEHOLDER_RESPONSES.length] }
    ]);
    setInput('');
  };

  return (
    <div
      className={`fixed right-6 z-50 transition-all duration-300 ${drawerOpen ? '' : ''}`}
      style={{ bottom: `${bottomUIHeight + 24}px` }}
    >
      {/* Floating Button */}
      {!open && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2 focus:outline-none"
          onClick={() => setOpen(true)}
          aria-label="Open MTDRB AI Chat"
          style={{ boxShadow: '0 8px 32px 0 rgba(21,95,217,0.18)' }}
        >
          <FiZap className="text-2xl" />
          <span className="font-semibold hidden md:inline">MTDRB AI</span>
        </button>
      )}
      {/* Chat Bot Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-8 right-8 z-50 w-full max-w-xs md:max-w-sm h-96 md:h-[28rem] flex flex-col shadow-2xl rounded-2xl bg-white border border-blue-100"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ boxShadow: '0 8px 32px 0 rgba(21,95,217,0.18)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-blue-50 rounded-t-2xl">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
                <FiZap className="text-blue-500" /> MTDRB AI
              </div>
              <button onClick={() => setOpen(false)} className="text-blue-400 hover:text-blue-700 p-1 rounded-full focus:outline-none">
                <FiX size={20} />
              </button>
            </div>
            {/* Chat History */}
            <div className="flex-1 px-4 py-3 overflow-y-auto bg-blue-50" style={{ minHeight: 0 }}>
              {messages.map((msg, i) => (
                <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-3 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900 border border-blue-100'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-blue-100 bg-white rounded-b-2xl">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ask MTDRB AI anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                autoFocus
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl font-semibold flex items-center gap-1 transition-all duration-300 ease-in-out min-h-[44px]"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <FiSend />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 