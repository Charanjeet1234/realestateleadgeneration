import React, { useState, useEffect } from 'react';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredLocation: string;
  budget: string;
  transactionType: string;
  unitType?: string;
  message?: string;
  leadSource?: string;
  propertyTitle?: string;
  createdAt: string;
  status: 'New' | 'Contacted' | 'VIP Qualified';
}

interface BrokerLeadsInboxProps {
  onRefreshLeads?: () => void;
}

export const BrokerLeadsInbox: React.FC<BrokerLeadsInboxProps> = () => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filtered = leads.filter((l) => {
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.toLowerCase().includes(search.toLowerCase()) ||
      l.preferredLocation.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Agency CRM & Lead Generation Pipeline
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-extrabold text-white tracking-tight">
            High-Intent Client & Buyer Inquiries
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time feed of captured investors, off-plan buyers, and tenants generated through PropEngine UAE search filters, brochure downloads, and the AI Sales Copilot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Pipeline
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-4">
          <span className="text-slate-400 text-xs block">Total Active Leads</span>
          <span className="text-2xl font-bold font-serif text-white">{leads.length}</span>
        </div>
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-4">
          <span className="text-slate-400 text-xs block">New (Action Required)</span>
          <span className="text-2xl font-bold font-serif text-amber-400">
            {leads.filter((l) => l.status === 'New').length}
          </span>
        </div>
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-4">
          <span className="text-slate-400 text-xs block">VIP Qualified (AED 5M+)</span>
          <span className="text-2xl font-bold font-serif text-emerald-400">
            {leads.filter((l) => l.status === 'VIP Qualified').length}
          </span>
        </div>
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-4">
          <span className="text-slate-400 text-xs block">Follow-Up SLA Standard</span>
          <span className="text-2xl font-bold font-serif text-slate-200">15 Mins</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, phone, or community..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterStatus === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Statuses
          </button>
          <button
            onClick={() => setFilterStatus('New')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterStatus === 'New' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            New Leads
          </button>
          <button
            onClick={() => setFilterStatus('VIP Qualified')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterStatus === 'VIP Qualified' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            VIP Qualified
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Client Name & Status</th>
              <th className="py-3.5 px-3">WhatsApp / Phone</th>
              <th className="py-3.5 px-3">Target Location</th>
              <th className="py-3.5 px-3">Budget Ceiling</th>
              <th className="py-3.5 px-3">Inquiry Asset & Deliverable</th>
              <th className="py-3.5 px-3">Captured Via</th>
              <th className="py-3.5 px-4 text-right">Instant Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No matching client inquiries found. Submit an inquiry through the property cards or AI Copilot to see it appear live here!
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Name */}
                  <td className="py-4 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-white block text-sm">{lead.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              lead.status === 'VIP Qualified'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {lead.status}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-4 px-3 font-mono text-slate-300">
                    <div className="flex items-center gap-1 text-slate-200">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{lead.phone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{lead.email}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-1 text-slate-200">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{lead.preferredLocation}</span>
                    </div>
                  </td>

                  {/* Budget */}
                  <td className="py-4 px-3 font-semibold text-amber-400 font-mono">
                    {lead.budget}
                  </td>

                  {/* Asset */}
                  <td className="py-4 px-3 text-slate-300 max-w-xs">
                    <span className="font-medium text-white block truncate">
                      {lead.propertyTitle || 'General Off-Plan Inquiry'}
                    </span>
                    {lead.message && (
                      <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                        {lead.message}
                      </span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="py-4 px-3">
                    <span className="text-[11px] px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800 text-slate-300">
                      {lead.leadSource || 'Portal Inquiry'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${lead.name}, this is your Senior Real Estate Specialist from PropEngine UAE regarding your inquiry for ${lead.propertyTitle || lead.preferredLocation}. Here are the official floor plans and availability.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
