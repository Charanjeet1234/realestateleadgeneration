import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Wand2 } from 'lucide-react';
import { ALL_COMMUNITIES, ALL_DEVELOPERS } from '../../data/marketData';
import { api, type AdminProperty } from '../../lib/api';
import { calculatePurchaseClosingCosts } from '../../utils/complianceCalculator';
import { Button, ErrorNote, Field, Modal, inputCls } from '../ui';

const UNIT_TYPES = ['Studio', '1BR', '2BR', '3BR+', 'Villa/Townhouse', 'Penthouse'];
const CATEGORIES = ['Off-Plan', 'Ready Apartments', 'Ready Villas', 'Annual Rent', 'Short-Term Holiday'];
const TIERS = ['Tier 1 Ultra', 'Prime Master', 'Boutique Luxury', 'High Yield Value'];

interface FormState {
  title: string;
  tagline: string;
  developer: string;
  developerTier: string;
  emirate: 'Dubai' | 'Abu Dhabi';
  community: string;
  category: string;
  unitTypes: string[];
  priceAED: string;
  priceRangeFormatted: string;
  rentalBenchmarkAED: string;
  handoverDate: string;
  hasPaymentPlan: boolean;
  paymentPlan: { summary: string; downPayment: string; duringConstruction: string; onHandover: string; postHandover: string };
  hasRentalFactors: boolean;
  rentalFactors: { chequesAccepted: string; estimatedServiceCharge: string; securityDeposit: string; minTerm: string };
  projectedROI: string;
  capitalGrowthForecast: string;
  goldenVisaEligible: boolean;
  imageUrl: string;
  featured: boolean;
  published: boolean;
  dldCosts: { registrationFeeAED: string; adminFeeAED: string; agencyFeeAED: string; oqoodOrDeedAED: string };
  highlights: string;
  floorPlanCount: string;
  sortOrder: string;
}

const emptyForm = (): FormState => ({
  title: '',
  tagline: '',
  developer: '',
  developerTier: 'Prime Master',
  emirate: 'Dubai',
  community: '',
  category: 'Off-Plan',
  unitTypes: [],
  priceAED: '',
  priceRangeFormatted: '',
  rentalBenchmarkAED: '',
  handoverDate: '',
  hasPaymentPlan: true,
  paymentPlan: { summary: '', downPayment: '', duringConstruction: '', onHandover: '', postHandover: '' },
  hasRentalFactors: false,
  rentalFactors: { chequesAccepted: '1 Cheque', estimatedServiceCharge: '', securityDeposit: '', minTerm: '' },
  projectedROI: '',
  capitalGrowthForecast: '',
  goldenVisaEligible: false,
  imageUrl: '',
  featured: false,
  published: true,
  dldCosts: { registrationFeeAED: '', adminFeeAED: '', agencyFeeAED: '', oqoodOrDeedAED: '' },
  highlights: '',
  floorPlanCount: '0',
  sortOrder: '0',
});

function toForm(p: AdminProperty): FormState {
  const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  return {
    ...emptyForm(),
    title: p.title,
    tagline: p.tagline,
    developer: p.developer,
    developerTier: p.developerTier,
    emirate: p.emirate,
    community: p.community,
    category: p.category,
    unitTypes: [...p.unitTypes],
    priceAED: s(p.priceAED),
    priceRangeFormatted: p.priceRangeFormatted,
    rentalBenchmarkAED: s(p.rentalBenchmarkAED),
    handoverDate: s(p.handoverDate),
    hasPaymentPlan: Boolean(p.paymentPlan),
    paymentPlan: { ...emptyForm().paymentPlan, ...(p.paymentPlan ?? {}), postHandover: s(p.paymentPlan?.postHandover) },
    hasRentalFactors: Boolean(p.rentalFactors),
    rentalFactors: { ...emptyForm().rentalFactors, ...(p.rentalFactors ?? {}) },
    projectedROI: s(p.projectedROI),
    capitalGrowthForecast: p.capitalGrowthForecast,
    goldenVisaEligible: p.goldenVisaEligible,
    imageUrl: p.imageUrl,
    featured: p.featured,
    published: p.published,
    dldCosts: {
      registrationFeeAED: s(p.dldCosts.registrationFeeAED),
      adminFeeAED: s(p.dldCosts.adminFeeAED),
      agencyFeeAED: s(p.dldCosts.agencyFeeAED),
      oqoodOrDeedAED: s(p.dldCosts.oqoodOrDeedAED),
    },
    highlights: p.highlights.join('\n'),
    floorPlanCount: s(p.floorPlanCount),
    sortOrder: s(p.sortOrder),
  };
}

function toPayload(f: FormState) {
  const num = (v: string) => Number(v.replace(/,/g, ''));
  return {
    title: f.title,
    tagline: f.tagline,
    developer: f.developer,
    developerTier: f.developerTier,
    emirate: f.emirate,
    community: f.community,
    category: f.category,
    unitTypes: f.unitTypes,
    priceAED: Math.round(num(f.priceAED)),
    priceRangeFormatted: f.priceRangeFormatted,
    rentalBenchmarkAED: f.rentalBenchmarkAED || null,
    handoverDate: f.handoverDate || null,
    paymentPlan: f.hasPaymentPlan ? { ...f.paymentPlan, postHandover: f.paymentPlan.postHandover || null } : null,
    rentalFactors: f.hasRentalFactors ? f.rentalFactors : null,
    projectedROI: num(f.projectedROI),
    capitalGrowthForecast: f.capitalGrowthForecast,
    goldenVisaEligible: f.goldenVisaEligible,
    imageUrl: f.imageUrl,
    featured: f.featured,
    published: f.published,
    dldCosts: {
      registrationFeeAED: num(f.dldCosts.registrationFeeAED || '0'),
      adminFeeAED: num(f.dldCosts.adminFeeAED || '0'),
      agencyFeeAED: num(f.dldCosts.agencyFeeAED || '0'),
      oqoodOrDeedAED: num(f.dldCosts.oqoodOrDeedAED || '0'),
    },
    highlights: f.highlights.split('\n').map((h) => h.trim()).filter(Boolean),
    floorPlanCount: Math.round(num(f.floorPlanCount || '0')),
    sortOrder: Math.round(num(f.sortOrder || '0')),
  };
}

export const ListingsAdmin: React.FC<{ onDataChanged: () => void }> = ({ onDataChanged }) => {
  const [items, setItems] = useState<AdminProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminProperty | 'new' | null>(null);
  const [search, setSearch] = useState('');

  const load = () =>
    api
      .get<{ properties: AdminProperty[] }>('/admin/properties')
      .then((d) => setItems(d.properties))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (p: AdminProperty, field: 'published' | 'featured') => {
    try {
      await api.patch(`/admin/properties/${p.id}`, { [field]: !p[field] });
      setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, [field]: !p[field] } : x)));
      onDataChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const remove = async (p: AdminProperty) => {
    if (!window.confirm(`Delete "${p.title}"? Leads that referenced it keep the property name. Consider unpublishing instead.`)) return;
    try {
      await api.del(`/admin/properties/${p.id}`);
      setItems((xs) => xs.filter((x) => x.id !== p.id));
      onDataChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const visible = items.filter((p) =>
    `${p.title} ${p.developer} ${p.community}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <input
          type="search"
          placeholder="Search listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} sm:max-w-xs`}
        />
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" /> Add listing
        </Button>
      </div>
      <ErrorNote message={error} />
      <div className="bg-[#0b132b] border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs min-w-[820px]">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="text-left py-3 px-4">Listing</th>
              <th className="text-left py-3 px-3">Category</th>
              <th className="text-left py-3 px-3">Price</th>
              <th className="text-left py-3 px-3">Leads</th>
              <th className="text-left py-3 px-3">Visibility</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {visible.map((p) => (
              <tr key={p.id} className={p.published ? '' : 'opacity-60'}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} alt="" className="w-14 h-10 object-cover rounded-md border border-slate-800" loading="lazy" />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate max-w-[260px]">{p.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.developer} · {p.community}, {p.emirate}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-300">{p.category}</td>
                <td className="py-3 px-3 font-mono text-amber-300">{p.priceRangeFormatted}</td>
                <td className="py-3 px-3 font-mono text-slate-200">{p._count.leads}</td>
                <td className="py-3 px-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggle(p, 'published')}
                      title={p.published ? 'Published — click to hide' : 'Hidden — click to publish'}
                      className={`p-1.5 rounded-md border ${p.published ? 'border-emerald-500/40 text-emerald-300' : 'border-slate-700 text-slate-500'}`}
                    >
                      {p.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => toggle(p, 'featured')}
                      title={p.featured ? 'Featured' : 'Not featured'}
                      className={`p-1.5 rounded-md border ${p.featured ? 'border-amber-500/40 text-amber-300' : 'border-slate-700 text-slate-500'}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${p.featured ? 'fill-amber-300' : ''}`} />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-1.5">
                    <Button onClick={() => setEditing(p)} className="px-2 py-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="danger" onClick={() => remove(p)} className="px-2 py-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PropertyEditor
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
          onDataChanged();
        }}
      />
    </div>
  );
};

function PropertyEditor({
  target,
  onClose,
  onSaved,
}: {
  target: AdminProperty | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) {
      setF(target === 'new' ? emptyForm() : toForm(target));
      setError(null);
    }
  }, [target]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const text = (k: keyof FormState) => ({
    value: f[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      set(k, e.target.value as never),
    className: inputCls,
  });

  const autoFees = () => {
    const price = Number(f.priceAED.replace(/,/g, ''));
    if (!price) return setError('Enter the starting price first.');
    const c = calculatePurchaseClosingCosts(price, f.emirate, f.category === 'Off-Plan');
    set('dldCosts', {
      registrationFeeAED: String(Math.round(c.governmentRegistrationFee)),
      adminFeeAED: String(c.governmentAdminFee),
      agencyFeeAED: String(Math.round(c.agencyFee)),
      oqoodOrDeedAED: String(c.oqoodOrDeedFee),
    });
    if (price >= 2_000_000 && !f.goldenVisaEligible) set('goldenVisaEligible', true);
  };

  const communityOptions = useMemo(() => [...ALL_COMMUNITIES], []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = toPayload(f);
      if (target === 'new') await api.post('/admin/properties', payload);
      else if (target) await api.put(`/admin/properties/${target.id}`, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const section = 'text-[11px] font-bold uppercase tracking-wider text-amber-300/80 pt-2';

  return (
    <Modal open={Boolean(target)} onClose={onClose} wide title={target === 'new' ? 'Add listing' : 'Edit listing'}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote message={error} />

        <div className={section}>Basics</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Title">
            <input required {...text('title')} />
          </Field>
          <Field label="Tagline">
            <input required {...text('tagline')} />
          </Field>
          <Field label="Developer">
            <input required list="dev-options" {...text('developer')} />
            <datalist id="dev-options">
              {ALL_DEVELOPERS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Developer tier">
            <select {...text('developerTier')}>
              {TIERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Emirate">
            <select {...text('emirate')}>
              <option>Dubai</option>
              <option>Abu Dhabi</option>
            </select>
          </Field>
          <Field label="Community">
            <input required list="community-options" {...text('community')} />
            <datalist id="community-options">
              {communityOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Category">
            <select {...text('category')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Handover" hint='e.g. "Q4 2027" or "Ready"'>
            <input {...text('handoverDate')} />
          </Field>
        </div>

        <Field label="Unit types">
          <div className="flex flex-wrap gap-1.5">
            {UNIT_TYPES.map((u) => {
              const on = f.unitTypes.includes(u);
              return (
                <button
                  type="button"
                  key={u}
                  onClick={() => set('unitTypes', on ? f.unitTypes.filter((x) => x !== u) : [...f.unitTypes, u])}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                    on ? 'bg-amber-500 text-slate-950 border-amber-500' : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {u}
                </button>
              );
            })}
          </div>
        </Field>

        <div className={section}>Pricing & returns</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Starting price (AED)" hint="Used for filters and fee calculation">
            <input required inputMode="numeric" {...text('priceAED')} />
          </Field>
          <Field label="Price range label" hint='e.g. "AED 1.75M – 4.2M"'>
            <input required {...text('priceRangeFormatted')} />
          </Field>
          <Field label="Rental benchmark" hint='e.g. "Est. AED 125,000/yr"'>
            <input {...text('rentalBenchmarkAED')} />
          </Field>
          <Field label="Projected ROI (%)">
            <input required inputMode="decimal" {...text('projectedROI')} />
          </Field>
          <Field label="Capital growth note" className="sm:col-span-2">
            <input required {...text('capitalGrowthForecast')} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" className="accent-amber-500" checked={f.goldenVisaEligible} onChange={(e) => set('goldenVisaEligible', e.target.checked)} />
          Golden Visa eligible (AED 2M+)
        </label>

        <div className="flex items-center justify-between">
          <div className={section}>Closing costs (AED)</div>
          <Button type="button" onClick={autoFees}>
            <Wand2 className="w-3.5 h-3.5" /> Calculate from price
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              ['registrationFeeAED', f.emirate === 'Dubai' ? 'DLD 4%' : 'DMT 2%'],
              ['adminFeeAED', 'Admin fee'],
              ['agencyFeeAED', 'Agency 2%'],
              ['oqoodOrDeedAED', f.category === 'Off-Plan' ? 'Oqood' : 'Title deed'],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label}>
              <input
                required
                inputMode="numeric"
                value={f.dldCosts[k]}
                onChange={(e) => set('dldCosts', { ...f.dldCosts, [k]: e.target.value })}
                className={inputCls}
              />
            </Field>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300 pt-2">
          <input type="checkbox" className="accent-amber-500" checked={f.hasPaymentPlan} onChange={(e) => set('hasPaymentPlan', e.target.checked)} />
          <span className={section.replace('pt-2', '')}>Payment plan</span>
        </label>
        {f.hasPaymentPlan && (
          <div className="grid sm:grid-cols-2 gap-3">
            {(
              [
                ['summary', 'Summary', 'e.g. 60/40 Milestone Linked', true],
                ['downPayment', 'Down payment', 'e.g. 10% on Booking', true],
                ['duringConstruction', 'During construction', 'e.g. 50% in milestones', true],
                ['onHandover', 'On handover', 'e.g. 40% on completion', true],
                ['postHandover', 'Post-handover (optional)', 'e.g. 30% over 3 years', false],
              ] as const
            ).map(([k, label, ph, req]) => (
              <Field key={k} label={label}>
                <input
                  required={req}
                  placeholder={ph}
                  value={f.paymentPlan[k]}
                  onChange={(e) => set('paymentPlan', { ...f.paymentPlan, [k]: e.target.value })}
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-slate-300 pt-2">
          <input type="checkbox" className="accent-amber-500" checked={f.hasRentalFactors} onChange={(e) => set('hasRentalFactors', e.target.checked)} />
          <span className={section.replace('pt-2', '')}>Rental terms</span>
        </label>
        {f.hasRentalFactors && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Cheques accepted">
              <select
                value={f.rentalFactors.chequesAccepted}
                onChange={(e) => set('rentalFactors', { ...f.rentalFactors, chequesAccepted: e.target.value })}
                className={inputCls}
              >
                {['1 Cheque', '2 Cheques', '4 Cheques', 'Up to 6 Cheques'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            {(
              [
                ['estimatedServiceCharge', 'Service charge'],
                ['securityDeposit', 'Security deposit'],
                ['minTerm', 'Minimum term'],
              ] as const
            ).map(([k, label]) => (
              <Field key={k} label={label}>
                <input
                  required
                  value={f.rentalFactors[k]}
                  onChange={(e) => set('rentalFactors', { ...f.rentalFactors, [k]: e.target.value })}
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
        )}

        <div className={section}>Presentation</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Image URL" hint="Public https link to a landscape photo" className="sm:col-span-2">
            <input required type="url" {...text('imageUrl')} />
          </Field>
          <Field label="Highlights" hint="One per line" className="sm:col-span-2">
            <textarea rows={4} {...text('highlights')} />
          </Field>
          <Field label="Floor plans available">
            <input inputMode="numeric" {...text('floorPlanCount')} />
          </Field>
          <Field label="Sort order" hint="Lower shows first">
            <input inputMode="numeric" {...text('sortOrder')} />
          </Field>
        </div>
        <div className="flex gap-4 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-amber-500" checked={f.published} onChange={(e) => set('published', e.target.checked)} />
            Published on site
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-amber-500" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} />
            Featured
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save listing'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
