/**
 * Emmanuel Real Estate - Node.js Express API & CRM Server
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ============================================================================
// RATE LIMITING & ANTI-SPAM PROTECTION
// "Stop people from sending too many forms quickly."
// ============================================================================

const submissionCooldowns = new Map(); // ip -> timestamp
const ipSubmissionCounts = new Map();  // ip -> { count, resetTime }

function rateLimitAndSpamCheck(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // 1. Minimum 10 seconds between submissions from same IP
  const lastTime = submissionCooldowns.get(ip);
  if (lastTime && (now - lastTime) < 10000) {
    return res.status(429).json({ 
      error: 'Please wait a few seconds before submitting another confidential inquiry.' 
    });
  }

  // 2. Maximum 10 submissions per hour
  let tracker = ipSubmissionCounts.get(ip);
  if (!tracker || now > tracker.resetTime) {
    tracker = { count: 0, resetTime: now + 3600000 };
    ipSubmissionCounts.set(ip, tracker);
  }

  if (tracker.count >= 12) {
    return res.status(429).json({ 
      error: 'Submission threshold reached for this session. Please call our DIFC desk directly at +971 4 820 9000.' 
    });
  }

  tracker.count++;
  submissionCooldowns.set(ip, now);

  // 3. Honeypot check for automated bots
  const { honeypot } = req.body;
  if (honeypot && String(honeypot).trim() !== '') {
    return res.status(400).json({ error: 'Automated spam submission detected.' });
  }

  // 4. Basic name and phone verification
  const name = req.body.name || req.body.owner_name;
  const phone = req.body.phone;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Please enter a valid legal or representative name.' });
  }

  if (!phone || String(phone).trim().length < 7) {
    return res.status(400).json({ error: 'Please enter a valid telephone or WhatsApp contact number.' });
  }

  next();
}

// Standardized User-Facing Success Response
const STANDARD_THANK_YOU_MESSAGE = "Thank you. An Emmanuel Real Estate advisor will contact you within 24 hours.";

// ============================================================================
// PUBLIC PORTFOLIO & LEAD SUBMISSION ENDPOINTS
// ============================================================================

// Database & System Status
app.get('/api/status', async (req, res) => {
  try {
    const stats = await db.getAdminDashboardStats();
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Developers
app.get('/api/developers', async (req, res) => {
  try {
    const developers = await db.getDevelopers();
    res.json(developers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agents
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await db.getAgents();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Properties
app.get('/api/properties', async (req, res) => {
  try {
    const filters = {
      community: req.query.community,
      type: req.query.type,
      bedrooms: req.query.bedrooms,
      max_price: req.query.max_price
    };
    const properties = await db.getProperties(filters);
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await db.getPropertyById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Off-Plan Projects
app.get('/api/offplan', async (req, res) => {
  try {
    const projects = await db.getOffPlanProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/offplan/:id', async (req, res) => {
  try {
    const project = await db.getOffPlanProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Off-plan project not found.' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Form 1: General Leads & Register Interest
app.post('/api/leads', rateLimitAndSpamCheck, async (req, res) => {
  try {
    const { name, phone, email, budget_aed, preferred_community, property_type, property_name, source_form, message, payment_method, timeframe } = req.body;
    const lead = await db.createLead({
      name,
      phone,
      email,
      budget_aed: budget_aed ? parseInt(budget_aed, 10) : null,
      preferred_community,
      property_type,
      property_name,
      source_form: source_form || 'Website Registration',
      payment_method,
      timeframe,
      message
    });

    res.json({
      success: true,
      leadId: lead.id,
      score: lead.score,
      score_label: lead.score_label,
      message: STANDARD_THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Form 2: Book a Viewing
app.post('/api/viewings', rateLimitAndSpamCheck, async (req, res) => {
  try {
    const { name, phone, email, property_name, property_id, viewing_date, viewing_time, notes, source_form } = req.body;

    const lead = await db.createLead({
      name,
      phone,
      email,
      property_name: property_name || 'Curated Residence',
      property_id: property_id ? parseInt(property_id, 10) : null,
      preferred_community: property_name ? property_name.split(' ')[0] : 'Dubai',
      source_form: source_form || 'Book a Viewing Form',
      payment_method: 'Cash',
      timeframe: 'Immediate',
      message: `Scheduled private inspection for ${property_name} on ${viewing_date} at ${viewing_time}. Special requests: ${notes || 'None'}`
    });

    const viewing = await db.createViewing({
      lead_id: lead.id,
      lead_name: name,
      property_name: property_name || 'Curated Residence',
      property_id: property_id ? parseInt(property_id, 10) : null,
      agent_name: lead.agent_name || 'Alexander Wright',
      viewing_date: `${viewing_date} ${viewing_time || ''}`.trim(),
      notes
    });

    res.json({
      success: true,
      viewingId: viewing.id,
      message: STANDARD_THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Form 3: Instant Callback
app.post('/api/callback', rateLimitAndSpamCheck, async (req, res) => {
  try {
    const { name, phone, preferred_time, notes, source_form } = req.body;
    await db.createLead({
      name,
      phone,
      source_form: source_form || 'Floating Call Me Back Button',
      payment_method: 'Cash',
      timeframe: 'Immediate',
      message: `Callback requested for: ${preferred_time || 'Immediate'}. Inquiring about: ${notes || 'General Portfolio'}`
    });

    res.json({
      success: true,
      message: STANDARD_THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Form 4: Sell Valuation
app.post('/api/valuation', rateLimitAndSpamCheck, async (req, res) => {
  try {
    const { name, phone, email, property_community, property_type, bedrooms, asking_price_aed, notes, source_form } = req.body;
    await db.createLead({
      name,
      phone,
      email,
      preferred_community: property_community,
      property_type,
      budget_aed: asking_price_aed ? parseInt(asking_price_aed, 10) : null,
      source_form: source_form || 'Sell Your Property Page',
      payment_method: 'Cash',
      timeframe: 'Immediate',
      message: `Property Valuation Request: ${bedrooms || ''} ${property_type || ''} in ${property_community || ''}. Expected asking: AED ${asking_price_aed || 'TBD'}. Notes: ${notes || 'None'}`
    });

    res.json({
      success: true,
      message: STANDARD_THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Form 5: Download Brochure
app.post('/api/brochure', rateLimitAndSpamCheck, async (req, res) => {
  try {
    const { name, phone, email, project_title, investor_profile, source_form } = req.body;
    await db.createLead({
      name,
      phone,
      email,
      property_name: project_title,
      source_form: source_form || 'Off-Plan Brochure Download Form',
      payment_method: 'Cash',
      timeframe: '1-3 Months',
      message: `Brochure and floorplans unlocked for ${project_title}. Investor profile: ${investor_profile || 'General'}`
    });

    res.json({
      success: true,
      message: STANDARD_THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// AUTHENTICATION & PRIVATE ADMIN CRM API
// ============================================================================

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = await db.verifyStaffLogin(email.trim(), password.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid executive credentials.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        agent_id: user.agent_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bell Notifications Count (Refreshes every 60s)
app.get('/api/admin/notifications', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'admin';
    const agentName = req.headers['x-agent-name'] || '';

    const leads = await db.getLeads({}, userRole, agentName);
    const newLeads = leads.filter(l => l.status === 'New');

    res.json({
      count: newLeads.length,
      recent: newLeads.slice(0, 5).map(l => ({
        id: l.id,
        name: l.name,
        score: l.score,
        score_label: l.score_label,
        community: l.preferred_community,
        source: l.source_form,
        created_at: l.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Dashboard Summary Metrics
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'admin';
    const agentName = req.headers['x-agent-name'] || '';

    const stats = await db.getAdminDashboardStats(userRole, agentName);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leads List (Role-protected: Agents only see their own leads)
app.get('/api/admin/leads', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'admin';
    const agentName = req.headers['x-agent-name'] || '';

    const filters = {
      status: req.query.status,
      score_label: req.query.score_label,
      agent: req.query.agent,
      search: req.query.search
    };

    const leads = await db.getLeads(filters, userRole, agentName);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Leads to Excel (CSV format) - Defined before :id route
app.get('/api/admin/leads/export', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'admin';
    const agentName = req.headers['x-agent-name'] || '';
    const leads = await db.getLeads({}, userRole, agentName);

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Score', 'Rating', 'Stage', 'Budget (AED)', 'Community', 'Property', 'Source Form', 'Assigned Agent', 'Date'];
    const rows = leads.map(l => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      l.score || 50,
      l.score_label || 'WARM',
      l.status || 'New',
      l.budget_aed || '',
      `"${l.preferred_community || ''}"`,
      `"${(l.property_name || '').replace(/"/g, '""')}"`,
      `"${(l.source_form || '').replace(/"/g, '""')}"`,
      `"${l.agent_name || ''}"`,
      `"${(l.created_at || '').substring(0, 10)}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="emmanuel_real_estate_leads.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Lead with Notes
app.get('/api/admin/leads/:id', async (req, res) => {
  try {
    const lead = await db.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Lead (Stage drag & drop, assigned agent, notes)
app.patch('/api/admin/leads/:id', async (req, res) => {
  try {
    const updated = await db.updateLead(req.params.id, req.body);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Note to Lead
app.post('/api/admin/leads/:id/notes', async (req, res) => {
  try {
    const { author, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Note content cannot be empty.' });
    const note = await db.addLeadNote(req.params.id, author || 'Admin', content);
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Lead Won: Prompt sale price, compute 2% commission, record sale, mark property Sold
app.post('/api/admin/leads/:id/won', async (req, res) => {
  try {
    const { sale_price_aed, property_title, agent_name } = req.body;
    const sale = await db.markLeadWon(req.params.id, sale_price_aed, property_title, agent_name);
    res.json({
      success: true,
      sale,
      message: `Deal closed! Recorded AED ${sale.commission_aed.toLocaleString()} (2% commission) and marked property as Sold.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Viewings
app.get('/api/admin/viewings', async (req, res) => {
  try {
    const viewings = await db.getViewings();
    res.json(viewings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stale Leads (no activity for 3+ days)
app.get('/api/admin/stale-leads', async (req, res) => {
  try {
    const stale = await db.getStaleLeads();
    res.json(stale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent Leaderboard
app.get('/api/admin/leaderboard', async (req, res) => {
  try {
    const agents = await db.getAgents();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Property Management (Add, Edit, Delete)
app.post('/api/admin/properties', async (req, res) => {
  try {
    const prop = await db.saveProperty(req.body);
    res.json({ success: true, property: prop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/properties/:id', async (req, res) => {
  try {
    const prop = await db.saveProperty(req.body, req.params.id);
    res.json({ success: true, property: prop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/properties/:id', async (req, res) => {
  try {
    await db.deleteProperty(req.params.id);
    res.json({ success: true, message: 'Property removed from inventory.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Off-Plan Project Management (Add, Edit, Delete)
app.post('/api/admin/offplan', async (req, res) => {
  try {
    const proj = await db.saveOffPlanProject(req.body);
    res.json({ success: true, project: proj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/offplan/:id', async (req, res) => {
  try {
    const proj = await db.saveOffPlanProject(req.body, req.params.id);
    res.json({ success: true, project: proj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/offplan/:id', async (req, res) => {
  try {
    await db.deleteOffPlanProject(req.params.id);
    res.json({ success: true, message: 'Project removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clean friendly URLs
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));
app.get('/admin-login.html', (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));

app.get('/properties', (req, res) => res.sendFile(path.join(__dirname, 'properties.html')));
app.get('/property-detail', (req, res) => res.sendFile(path.join(__dirname, 'property-detail.html')));
app.get('/offplan', (req, res) => res.sendFile(path.join(__dirname, 'offplan.html')));
app.get('/offplan-detail', (req, res) => res.sendFile(path.join(__dirname, 'offplan-detail.html')));
app.get('/calculator', (req, res) => res.sendFile(path.join(__dirname, 'calculator.html')));
app.get('/sell', (req, res) => res.sendFile(path.join(__dirname, 'sell.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));

// 404 Page Not Found Handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// 500 Internal Server Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal luxury advisory server error.' });
  }
  res.status(500).sendFile(path.join(__dirname, '500.html'));
});

async function start() {
  await db.initDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`EMMANUEL REAL ESTATE - CRM & PLATFORM`);
    console.log(`Server listening on port ${PORT}`);
    console.log(`➜ Website:      http://localhost:${PORT}/`);
    console.log(`➜ Admin Portal: http://localhost:${PORT}/admin-login.html`);
    console.log(`=======================================================`);
  });
}

if (require.main === module) {
  start();
} else {
  db.initDatabase().catch(err => console.error(err));
}

module.exports = app;
