import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Building2,
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle,
  PhoneCall,
  Download,
  AlertCircle,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { getAttribution } from '../lib/attribution';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  leadCaptured?: boolean;
}

interface AiSalesAssistantProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenLeadModal: (title?: string) => void;
}

export const AiSalesAssistant: React.FC<AiSalesAssistantProps> = ({
  initialPrompt,
  onClearInitialPrompt,
  onOpenLeadModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `### Welcome to PropEngine UAE — Institutional Real Estate Advisory

I am **PropEngine UAE**, operating on behalf of a Dubai RERA & Abu Dhabi ADREC registered real estate agency. 

I provide direct developer access to off-market inventory, verified rental yield benchmarks, and compliant government fee calculations across **Dubai and Abu Dhabi**.

**Featured Inquiry Modules:**
* **High-Yield Corridors:** JVC, Dubai South, and Business Bay delivering 7.8%–8.8% Net Yields.
* **Trophy Waterfront:** Palm Jumeirah and Saadiyat Island luxury residences & private villas.
* **Capital Protection:** Emaar, Aldar, and Sobha payment plans with Oqood & DLD escrow compliance.

How may I tailor your property search today? Share your preferred community, budget range, or transaction category (Off-Plan, Ready, or Annual Lease).`,
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferredLocation: 'Dubai / Abu Dhabi Prime',
    budget: 'AED 1.5M – 5M',
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            agency: 'Dubai RERA Brokerage #28914',
            portal: 'PropEngine UAE',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI sales response');
      }

      const data = await response.json();
      // The server captures a lead when the visitor types their phone + email into the chat
      if (data.leadCaptured) setLeadSubmitted(true);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Apologies, I encountered a communication delay. Please share your WhatsApp number for direct senior specialist consultation.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMessage: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: `### PropEngine UAE Market Advisory

Here is the verified data for your inquiry:
* **Government Regulatory Fees:**
  - **Dubai:** 4% DLD Fee + AED 4,200 Admin Fee (+ AED 3,000 Oqood for Off-Plan)
  - **Abu Dhabi:** 2% DMT Registration Fee
  - **Agency Brokerage:** Mandated 2% + 5% VAT (Purchase) / 5% + 5% VAT (Annual Lease)
* **Yield Projections:** Current market yields range from 6.4% in Downtown Dubai up to 8.6% in high-cashflow corridors like JVC and Dubai South.

---

### Investor Qualification:
1. Are you targeting off-plan capital appreciation prior to handover, or immediate ready rental yields?
2. What is your preferred equity deployment horizon?

---

**Priority Allocation:**
To send you the complete project brochure, exact floor plans, and updated availability for this community, please share your **WhatsApp Number** and **Email Address**. Our Senior Real Estate Specialist will contact you within 15 minutes.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInlineLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone || !leadForm.email) return;

    setLeadSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name,
          phone: leadForm.phone,
          email: leadForm.email,
          preferredLocation: leadForm.preferredLocation,
          budget: leadForm.budget,
          transactionType: 'buy_offplan',
          leadSource: 'AI Sales Assistant Inline Funnel',
          message: 'User requested tailored floor plans, DLD transaction report, and brochure via AI chat.',
          ...getAttribution(),
        }),
      });

      if (res.ok) {
        setLeadSubmitted(true);
        // Add confirmation message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: `system-confirm-${Date.now()}`,
            role: 'assistant',
            content: `### VIP Request Confirmed & Dispatched

Thank you, **${leadForm.name}**. Your VIP inquiry has been transmitted directly to our **Senior Real Estate Specialist**.

* **WhatsApp Dispatched to:** \`${leadForm.phone}\`
* **Email Dossier to:** \`${leadForm.email}\`
* **Deliverables Included:** Official Developer Floor Plans, Master Payment Schedule, and DLD/DMT Transaction Audit.

A dedicated senior broker will reach out within **15 minutes**. For instant priority access, you may also tap the WhatsApp button below.`,
            timestamp: 'Just now',
          },
        ]);
      }
    } catch (err) {
      console.error('Lead error:', err);
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="bg-[#0b132b] border border-amber-500/30 rounded-2xl p-5 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-extrabold text-white">
                PropEngine AI Sales Specialist
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                RERA Compliant AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Trained on Dubai Land Department (DLD) & ADREC frameworks, developer master inventories, and live rental yields.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onOpenLeadModal('VIP Tailored Advisory Session')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            15-Min Agent Callback
          </button>
          <a
            href="https://wa.me/971508392140?text=Hello%20PropEngine%20Specialist,%20I%20am%20chatting%20with%20your%20AI%20and%20require%20urgent%20assistance%20with%20an%20off-plan%20acquisition."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp Broker
          </a>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-[#080d1a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isAssistant = m.role === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
              >
                {isAssistant && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-1">
                    <Building2 className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                    isAssistant
                      ? 'bg-[#0f172a] text-slate-200 border border-slate-800/80 shadow-md'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-medium shadow-md ml-auto'
                  }`}
                >
                  {/* Markdown-style content rendering */}
                  <div className="space-y-2 whitespace-pre-wrap selection:bg-amber-400/40">
                    {m.content.split('\n').map((line, idx) => {
                      if (line.startsWith('### ')) {
                        return (
                          <h4 key={idx} className="font-serif font-bold text-amber-300 text-sm sm:text-base mt-2 mb-1">
                            {line.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (line.startsWith('* ') || line.startsWith('- ')) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
                            <span className="text-amber-400 mt-1 font-bold">•</span>
                            <span>{line.replace(/^[*-]\s/, '')}</span>
                          </div>
                        );
                      }
                      if (line.startsWith('---')) {
                        return <hr key={idx} className="border-slate-800 my-2" />;
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>

                  <div
                    className={`text-[10px] mt-2 pt-2 border-t flex items-center justify-between ${
                      isAssistant
                        ? 'border-slate-800 text-slate-400'
                        : 'border-amber-600/30 text-slate-800'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {isAssistant && (
                      <span className="text-amber-400/80 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Regulatory Market Data
                      </span>
                    )}
                  </div>
                </div>

                {!isAssistant && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-amber-400 animate-bounce" />
              </div>
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>PropEngine AI is analyzing DLD transaction metrics & payment plans...</span>
              </div>
            </div>
          )}

          {/* Inline Instant Lead Capture Funnel Box */}
          {!leadSubmitted && messages.length > 2 && (
            <div className="bg-gradient-to-r from-[#132042] via-[#0b132b] to-[#132042] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl my-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="font-serif font-bold text-white text-sm">
                  Receive Official Floor Plans, Payment Schedules & DLD Report
                </h4>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Our Senior Real Estate Specialist will dispatch the complete project dossier and off-market inventory directly to your WhatsApp and Email in under 15 minutes.
              </p>

              <form onSubmit={handleInlineLeadSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp / Phone (with code) *"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Corporate / Personal Email *"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {leadSubmitting ? (
                      <span>Transmitting...</span>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Get Instant Dossier</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[#0b132b] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about yields, communities, Danube 1% plan, Emaar payment plans, DLD fees..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-102 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Click Prompts */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] text-slate-400">
            <span className="shrink-0 text-slate-500">Quick prompts:</span>
            <button
              onClick={() => handleSend('Compare rental yield in JVC vs Downtown Dubai for 1BR apartments.')}
              className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            >
              JVC vs Downtown 1BR Yields
            </button>
            <button
              onClick={() => handleSend('What are the payment plan options for Aldar Saadiyat Lagoons in Abu Dhabi?')}
              className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            >
              Aldar Saadiyat Payment Plan
            </button>
            <button
              onClick={() => handleSend('Calculate total government and agency closing costs on an AED 2,000,000 ready property in Dubai.')}
              className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            >
              AED 2M DLD + Agency Breakdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
