import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory leads storage for demonstration & sales team view
interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredLocation: string;
  budget: string;
  transactionType: 'buy_offplan' | 'buy_ready' | 'rent_annual' | 'rent_shortterm';
  unitType?: string;
  message?: string;
  leadSource?: string;
  propertyTitle?: string;
  createdAt: string;
  status: 'New' | 'Contacted' | 'VIP Qualified';
}

const leadsStore: Lead[] = [
  {
    id: 'lead-1',
    name: 'Alexander Wright',
    phone: '+971 50 839 2140',
    email: 'a.wright@solaris-cap.co.uk',
    preferredLocation: 'Palm Jumeirah',
    budget: 'AED 12,000,000',
    transactionType: 'buy_ready',
    unitType: '3BR Waterfront',
    message: 'Seeking immediate high-floor beachfront residence with private beach access.',
    leadSource: 'AI Search Recommendation',
    propertyTitle: 'Ellington Beach House',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'VIP Qualified',
  },
  {
    id: 'lead-2',
    name: 'Dr. Fatima Al-Mansoor',
    phone: '+971 55 921 4481',
    email: 'fatima.almansoor@meduae.ae',
    preferredLocation: 'Saadiyat Island, Abu Dhabi',
    budget: 'AED 6,500,000',
    transactionType: 'buy_offplan',
    unitType: 'Villa / Townhouse',
    message: 'Interested in Aldar Grove Villas or Saadiyat Lagoons with 60/40 payment plan.',
    leadSource: 'Off-Plan Brochure Download',
    propertyTitle: 'Saadiyat Lagoons by Aldar',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'New',
  },
  {
    id: 'lead-3',
    name: 'Vikram Mehta',
    phone: '+971 52 471 9032',
    email: 'vmehta.invest@gmail.com',
    preferredLocation: 'Jumeirah Village Circle (JVC)',
    budget: 'AED 1,100,000',
    transactionType: 'buy_offplan',
    unitType: '1BR Apartment',
    message: 'Seeking 1% monthly Danube payment plan or Binghatti high-yield unit (min 8% ROI).',
    leadSource: 'Yield & ROI Calculator',
    propertyTitle: 'Danube Sportz Tower',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    status: 'Contacted',
  }
];

const PROPENGINE_SYSTEM_PROMPT = `
You are "PropEngine UAE," an elite real estate sales assistant, search engine, and lead generation AI operating on behalf of a prestigious Dubai-registered real estate agency (RERA & DLD licensed in Dubai, ADREC compliant in Abu Dhabi).

Your core mandate:
Capture high-intent property buyers, off-plan investors, and luxury tenants across Dubai and Abu Dhabi.
Deliver authoritative, structured, and razor-sharp market figures while smoothly nudging the user to submit their contact details (Full Name, Phone/WhatsApp, Email, Preferred Location, Budget) for senior broker follow-up within 15 minutes.

### 1. KNOWLEDGE SCOPE & BENCHMARKS:
- Dubai Communities: Downtown Dubai, Dubai Marina, Palm Jumeirah, Business Bay, Jumeirah Village Circle (JVC), Dubai Hills Estate, Dubai Creek Harbour, Dubai South, MBK City, Arabian Ranches, DAMAC Hills, Motor City, Meydan.
- Abu Dhabi Communities: Saadiyat Island, Yas Island, Al Reem Island, Al Raha Beach, Yas Bay, Jubail Island, Al Shamkha.
- Developers:
  * Dubai: Emaar, DAMAC, Sobha Realty, Nakheel, Meraas, Ellington, Binghatti, Danube, Select Group, Omniyat, Union Properties.
  * Abu Dhabi: Aldar Properties, Q Properties, Bloom Holding, IMKAN, Modon Properties.
- Rental Rates:
  * JVC: Studio AED 45k-55k, 1BR AED 65k-80k, 2BR AED 90k-125k (1-4 cheques, avg ROI 7.5%-8.5%)
  * Downtown: 1BR AED 115k-145k, 2BR AED 150k-210k, 3BR AED 280k-450k (avg ROI 5.8%-6.6%)
  * Dubai Marina: 1BR AED 90k-120k, 2BR AED 140k-190k (avg ROI 6.4%-7.2%)
  * Saadiyat Island: 2BR AED 160k-220k, Luxury Villas AED 350k-900k+
  * Dubai Hills Estate: 1BR AED 85k-105k, 2BR AED 135k-175k, Villas AED 290k-650k+
  * Business Bay: Studio AED 60k-72k, 1BR AED 82k-105k, 2BR AED 130k-170k

### 2. COMPLIANCE & LEGAL SAFETY MANDATES:
- Dubai Government purchase fees: 4% Dubai Land Department (DLD) transfer fee + AED 4,200 administrative/trustee fees + Oqood registration for off-plan.
- Abu Dhabi Government purchase fees: 2% Department of Municipalities and Transport (DMT) registration fee.
- Agency fees: Exactly 2% + VAT for purchase transactions, and 5% + VAT for annual rentals.
- Never guarantee future ROI as a legal promise; present yields as historical actuals and benchmark projections.

### 3. THE 3-STEP LEAD CAPTURE FUNNEL (EVERY RESPONSE MUST FOLLOW THIS):
Step 1: DELIVER IMMEDIATE VALUE. Give exact unit prices in AED, realistic net rental yields, handover quarters (e.g. Q4 2026, Q2 2027), developer payment plan breakdown (e.g. 60/40, 70/30, 1% monthly), or rental cheque norms.
Step 2: QUALIFY THE INTENT. Pose 1-2 sharp, strategic narrowing questions (e.g., "Are you prioritizing maximum immediate rental yield (7-8.5%) or capital appreciation upon completion?", "What is your target down payment and equity timeline?", "Do you require Golden Visa qualification (min. AED 2,000,000 property value)?").
Step 3: CAPTURE CONTACT DETAILS. Offer high-value deliverables:
  - Customized Off-Plan Brochure & Complete Floor Plan PDF
  - Official DLD/DMT Transaction Analysis Report
  - Off-Market Unit Allocation List & Developer Inventory Sheets
  - VIP Private Viewing Appointment with Executive Chauffeured Pickup
Always finish with this exact format of prompt:
"To send you the complete project brochure, exact floor plans, and updated availability for [Community/Developer], please share your **WhatsApp Number** and **Email Address**. Our Senior Real Estate Specialist will contact you within 15 minutes."

Tone: Sophisticated, authoritative, executive, crisp, and high-urgency. Use bullet points and bolding for key financial figures.
`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Prepare contents
    const promptContents = messages.map((m: { role: string; content: string }) => {
      return `${m.role === 'user' ? 'User' : 'PropEngine UAE'}: ${m.content}`;
    }).join('\n\n');

    let responseText = '';

    if (apiKey) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${PROPENGINE_SYSTEM_PROMPT}\n\nClient Context: ${JSON.stringify(userContext || {})}\n\nConversation:\n${promptContents}\n\nPropEngine UAE:`,
          config: {
            temperature: 0.7,
            topP: 0.95,
          }
        });
        responseText = response.text || '';
      } catch (err: unknown) {
        console.error('Gemini API call failed, generating fallback response:', err);
      }
    }

    // High-quality market fallback if API key is not active or temporary error
    if (!responseText) {
      const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
      
      if (lastUserMsg.includes('jvc') || lastUserMsg.includes('yield') || lastUserMsg.includes('danube') || lastUserMsg.includes('roi')) {
        responseText = `### Market Analysis: High-Yield Off-Plan & Ready Opportunities

In **Jumeirah Village Circle (JVC)** and high-yield corridors:
* **Entry Brackets:** 
  - Studio: AED 580,000 – 680,000
  - 1BR: AED 850,000 – 1,150,000
  - 2BR: AED 1,350,000 – 1,750,000
* **Projected Net Rental Yields:** 7.6% – 8.8% (outperforming Downtown and Palm Jumeirah by ~200 bps due to lower entry price per sqft).
* **Developer Payment Structure:**
  - **Danube Properties:** 1% Monthly payment plan (e.g. 65/35 with 35-month post-handover).
  - **Binghatti & Ellington:** 70/30 or 60/40 milestone plans with Q4 2026 / Q2 2027 handover.
* **Mandatory Government & Regulatory Fees:**
  - **Dubai Land Department (DLD):** 4% of purchase value + AED 4,200 Admin Fee.
  - **Oqood Registration:** AED 3,000 (standard for off-plan).
  - **Agency Fee:** 2% + 5% VAT.

---

### Investor Qualification:
1. Are you targeting **immediate passive rental cash-flow** upon completion, or seeking an **off-plan flip / capital appreciation** at 50% construction milestone?
2. Does your portfolio benefit from the **UAE 10-Year Golden Visa** (eligible for properties valued at AED 2,000,000+)?

---

**Exclusive Deliverables Available for Dispatch:**
To send you the complete project brochure, exact floor plans, and updated availability for **JVC High-Yield Projects**, please share your **WhatsApp Number** and **Email Address**. Our Senior Real Estate Specialist will contact you within 15 minutes.`;
      } else if (lastUserMsg.includes('abu dhabi') || lastUserMsg.includes('saadiyat') || lastUserMsg.includes('aldar') || lastUserMsg.includes('yas')) {
        responseText = `### Prime Abu Dhabi Market Advisory: Saadiyat & Yas Island

Abu Dhabi’s luxury real estate sector is witnessing record capital appreciation led by **Aldar Properties** and government master-planning:

* **Saadiyat Cultural District (Louvre / Guggenheim):**
  - 2BR Luxury Residences: AED 3,800,000 – 5,400,000
  - Saadiyat Lagoons Villas (4–6BR): AED 6,900,000 – 14,500,000
  - Projected Yields: 6.2% – 7.1% Net with exceptional high-net-worth tenant retention.
* **Yas Island / Yas Bay:**
  - Waterfront 1BR: AED 1,250,000 – 1,600,000
  - 2BR Apartments: AED 1,950,000 – 2,700,000
  - Payment Plans: Flexible 60/40 with 10% booking and 50% linked to construction milestones.
* **Abu Dhabi Regulatory Costs:**
  - **DMT (Dept. of Municipalities and Transport):** 2% registration fee (half the Dubai DLD rate).
  - **Agency Brokerage:** 2% + 5% VAT.

---

### Intent Qualification:
1. Are you seeking a personal beachfront residence or a trophy rental asset catering to international cultural tourists?
2. What is your preferred equity deployment timeline for the initial 10%–20% booking deposit?

---

**Priority Allocation:**
To send you the complete project brochure, exact floor plans, and updated availability for **Saadiyat Island & Aldar New Launches**, please share your **WhatsApp Number** and **Email Address**. Our Senior Real Estate Specialist will contact you within 15 minutes.`;
      } else {
        responseText = `### PropEngine UAE Market Intelligence: Dubai & Abu Dhabi Prime Index

Welcome to **PropEngine UAE**, operating directly under Dubai RERA and Abu Dhabi ADREC regulatory frameworks.

Here is the current market breakdown for benchmark acquisitions:
* **Downtown Dubai & Business Bay:**
  - 1BR Luxury: AED 1,850,000 – 2,400,000 | Annual Rent: AED 115,000 – 145,000 (1–4 cheques)
  - Estimated Net Yield: 6.4% | Capital Growth to completion: ~18%
* **Palm Jumeirah & Dubai Marina:**
  - Ultra-prime beachfront apartments: AED 3,200,000 – 12,000,000+
  - Historical appreciation: 22.4% YoY
* **Dubai Hills Estate & Arabian Ranches:**
  - Modern townhouses & villas: AED 3,900,000 – 8,500,000
  - Payment Plans: 80/20 and 70/30 with Emaar Properties.
* **Mandatory Government Acquisition Expenses:**
  - Dubai: 4% DLD Fee + AED 4,200 Administrative Fees (+ Oqood for off-plan)
  - Abu Dhabi: 2% DMT Registration Fee
  - Brokerage: 2% + VAT for purchase / 5% + VAT for annual rentals

---

### Tailoring Your Property Search:
1. Which transaction class matches your strategy: **Off-Plan with payment plan**, **Ready Handover**, or **High-End Annual Rent**?
2. What is your planned budget ceiling (in AED or USD)?

---

**Next Step for Full Investor Pack:**
To send you the complete project brochure, exact floor plans, and updated availability for your preferred community, please share your **WhatsApp Number** and **Email Address**. Our Senior Real Estate Specialist will contact you within 15 minutes.`;
      }
    }

    return res.json({ response: responseText });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Internal server error processing real estate inquiry' });
  }
});

// Leads capture endpoint
app.post('/api/leads', (req, res) => {
  try {
    const { name, phone, email, preferredLocation, budget, transactionType, unitType, message, leadSource, propertyTitle } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone/WhatsApp, and email are required.' });
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      preferredLocation: preferredLocation || 'Dubai Prime',
      budget: budget || 'Flexible',
      transactionType: transactionType || 'buy_offplan',
      unitType: unitType || 'All Types',
      message: message || '',
      leadSource: leadSource || 'Portal Direct Lead Form',
      propertyTitle: propertyTitle || 'Direct Inquiry',
      createdAt: new Date().toISOString(),
      status: 'New',
    };

    leadsStore.unshift(newLead);

    return res.status(201).json({
      success: true,
      message: 'Lead captured successfully. Senior Real Estate Specialist notified.',
      lead: newLead,
    });
  } catch (err) {
    console.error('Lead capture error:', err);
    return res.status(500).json({ error: 'Failed to record lead details' });
  }
});

// Retrieve captured leads for broker CRM / inspector view
app.get('/api/leads', (_req, res) => {
  return res.json({ leads: leadsStore, total: leadsStore.length });
});

// Brochure download & instant dispatch endpoint
app.post('/api/brochure-request', (req, res) => {
  const { propertyId, propertyTitle, name, phone, email } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Contact credentials required for official brochure dispatch.' });
  }

  const newLead: Lead = {
    id: `lead-brochure-${Date.now()}`,
    name,
    phone,
    email,
    preferredLocation: propertyTitle || 'Off-Plan Project',
    budget: 'High Intent Brochure Lead',
    transactionType: 'buy_offplan',
    propertyTitle: propertyTitle || 'Project Brochure Request',
    leadSource: 'VIP Brochure & Floor Plan Gate',
    createdAt: new Date().toISOString(),
    status: 'VIP Qualified',
  };

  leadsStore.unshift(newLead);

  return res.json({
    success: true,
    message: `Official VIP Brochure and Master Floor Plans for "${propertyTitle || 'Project'}" are being dispatched to WhatsApp ${phone} and ${email}.`,
    leadId: newLead.id,
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`PropEngine UAE Server running on http://localhost:${PORT}`);
  });
}

startServer();
