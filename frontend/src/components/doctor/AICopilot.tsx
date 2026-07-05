import React, { useState } from 'react';
import { 
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello Dr. Smith. I am your AI Copilot. How can I assist you with your consultations today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    
    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: 'I am analyzing your request and checking patient records. One moment please.' }]);
    }, 1000);
    
    setInput('');
  };

  const actions = [
    { label: "Draft Rx", icon: PencilSquareIcon },
    { label: "Summarize EMR", icon: DocumentTextIcon },
    { label: "Translate", icon: LanguageIcon },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-tr from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <SparklesIcon className="w-8 h-8" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-[380px] bg-white rounded-3xl shadow-2xl border border-accent/20 z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 flex justify-between items-center text-white relative overflow-hidden">
          {/* Decorative shine */}
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_3s_infinite]"></div>
          
          <div className="flex items-center space-x-2 relative z-10">
            <SparklesIcon className="w-6 h-6" />
            <div>
              <h3 className="font-bold">AI Copilot</h3>
              <p className="text-[10px] text-white/80">Clinical Decision Support</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors relative z-10">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-accent/5 p-2 border-b border-accent/10 flex justify-center space-x-2">
          {actions.map((act, idx) => (
            <button key={idx} className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-accent/20 rounded-full text-xs font-bold text-dark hover:text-primary hover:border-primary/30 transition-colors shadow-sm">
              <act.icon className="w-3 h-3" />
              <span>{act.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="h-[400px] p-4 overflow-y-auto space-y-4 bg-accent/5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-white border border-accent/20 text-dark rounded-tl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-accent/10">
          <div className="flex items-center space-x-2 bg-accent/5 border border-accent/20 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            <button className="text-secondary hover:text-primary transition-colors">
              <MicrophoneIcon className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              placeholder="Ask me anything..." 
              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-dark placeholder:text-secondary/60"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className={`p-1.5 rounded-full transition-colors ${input.trim() ? 'bg-primary text-white' : 'text-secondary/50'}`}
              disabled={!input.trim()}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
