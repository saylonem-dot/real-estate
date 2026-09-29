/**
 * Emmanuel Real Estate - Admin CRM Client Controller
 * Executive Dashboard, Real-time Bell Notifications (60s), Kanban Pipeline,
 * Lead Scoring (0-100), Deal Won Workflow (2% Commission), Viewings,
 * Leaderboard, Stale Leads Alert, and Inventory Management.
 */

// Global State
let currentUser = null;
let allLeads = [];
let allViewings = [];
let allAgents = [];
let allProperties = [];
let allOffPlan = [];
let currentLeadInDrawer = null;
let currentTab = 'tab-dashboard';

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Authenticate Executive Session
  const userJson = localStorage.getItem('emmanuel_admin_user') || localStorage.getItem('jay_admin_user');
  if (!userJson) {
    window.location.href = './admin-login.html';
    return;
  }

  try {
    currentUser = JSON.parse(userJson);
  } catch (e) {
    localStorage.removeItem('emmanuel_admin_user');
    localStorage.removeItem('jay_admin_user');
    window.location.href = './admin-login.html';
    return;
  }

  // Set Profile in Header
  setupUserProfile();

  // 2. Setup Navigation Tabs
  setupNavTabs();

  // 3. Setup Notification Bell (Polling every 60s)
  setupNotifications();

  // 4. Load Initial CRM Data
  await refreshAllData();

  // 5. Setup Event Listeners
  setupEventListeners();
});

// ============================================================================
// AUTHENTICATION & HEADERS
// ============================================================================

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (currentUser) {
    headers['x-user-role'] = currentUser.role || 'admin';
    headers['x-agent-name'] = currentUser.name || '';
  }
  return headers;
}

function setupUserProfile() {
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-display-role');
  const avatarEl = document.getElementById('user-avatar');

  if (nameEl) nameEl.textContent = currentUser.name || 'Executive User';
  if (roleEl) {
    roleEl.textContent = currentUser.role === 'admin' 
      ? 'Principal Director' 
      : `Advisory Partner (${currentUser.name.split(' ')[0]})`;
  }
  if (avatarEl) {
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatarEl.textContent = initials || 'AD';
  }

  // If user is agent, hide Inventory management or clarify view
  if (currentUser.role !== 'admin') {
    const invTab = document.getElementById('nav-inventory');
    if (invTab) invTab.style.display = 'none';
  }

  // Logout Handler
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('emmanuel_admin_user');
    localStorage.removeItem('jay_admin_user');
    window.location.href = './admin-login.html';
  });
}

// ============================================================================
// TABS NAVIGATION
// ============================================================================

function setupNavTabs() {
  const navBtns = document.querySelectorAll('.admin-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add('active');

      currentTab = targetTab;

      // Tab specific refresh if needed
      if (targetTab === 'tab-kanban') renderKanbanBoard();
      else if (targetTab === 'tab-leads') renderLeadsTable();
      else if (targetTab === 'tab-viewings') renderViewingsTable();
      else if (targetTab === 'tab-leaderboard') renderLeaderboard();
      else if (targetTab === 'tab-stale') renderStaleLeads();
      else if (targetTab === 'tab-inventory') renderPropertiesTable();
    });
  });
}

// ============================================================================
// NOTIFICATION BELL (EVERY 60 SECONDS)
// Requirement: "Add a bell icon in the admin area that shows how many new leads
// came in. Refresh it every minute."
// ============================================================================

let notificationTimer = null;

function setupNotifications() {
  const bellBtn = document.getElementById('bell-btn');
  const dropdown = document.getElementById('notification-dropdown');

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== bellBtn) {
      dropdown.classList.remove('show');
    }
  });

  // Initial check
  fetchNotifications();

  // Auto-refresh every 60,000 ms (1 minute)
  if (notificationTimer) clearInterval(notificationTimer);
  notificationTimer = setInterval(fetchNotifications, 60000);
}

async function fetchNotifications() {
  try {
    const res = await fetch('/api/admin/notifications', {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const data = await res.json();
    const countEl = document.getElementById('bell-count');
    const listEl = document.getElementById('notification-list');
    const syncTimeEl = document.getElementById('notif-sync-time');

    if (countEl) {
      countEl.textContent = data.count || 0;
      if (data.count > 0) {
        countEl.classList.add('pulse');
      } else {
        countEl.classList.remove('pulse');
      }
    }

    if (syncTimeEl) {
      const now = new Date();
      syncTimeEl.textContent = `Synced: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (listEl) {
      if (!data.recent || data.recent.length === 0) {
        listEl.innerHTML = `<div style="padding: 1.25rem; font-size: 0.75rem; color: #9CA3AF; text-align: center;">No new uncontacted inquiries in queue.</div>`;
      } else {
        listEl.innerHTML = data.recent.map(item => `
          <div class="notification-item" onclick="openLeadById(${item.id})">
            <div class="notification-item-title">
              <span>${item.name}</span>
              <span class="lead-score-badge ${getBadgeClass(item.score_label)}">${item.score} ${item.score_label}</span>
            </div>
            <div class="notification-item-meta">
              <span>${item.community || 'Dubai'} • Source: ${item.source || 'Website'}</span>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Notification sync failed:', err);
  }
}

// ============================================================================
// DATA REFRESH & SYNCHRONIZATION
// ============================================================================

async function refreshAllData() {
  try {
    // 1. Dashboard summary
    const dashRes = await fetch('/api/admin/dashboard', { headers: getAuthHeaders() });
    if (dashRes.ok) {
      const stats = await dashRes.json();
      renderDashboard(stats);
    }

    // 2. Leads list
    const leadsRes = await fetch('/api/admin/leads', { headers: getAuthHeaders() });
    if (leadsRes.ok) {
      allLeads = await leadsRes.json();
      renderKanbanBoard();
      renderLeadsTable();
    }

    // 3. Viewings
    const viewingsRes = await fetch('/api/admin/viewings', { headers: getAuthHeaders() });
    if (viewingsRes.ok) {
      allViewings = await viewingsRes.json();
      renderViewingsTable();
    }

    // 4. Agents / Leaderboard
    const agentsRes = await fetch('/api/admin/leaderboard', { headers: getAuthHeaders() });
    if (agentsRes.ok) {
      allAgents = await agentsRes.json();
      renderLeaderboard();
    }

    // 5. Stale leads
    const staleRes = await fetch('/api/admin/stale-leads', { headers: getAuthHeaders() });
    if (staleRes.ok) {
      const staleLeads = await staleRes.json();
      renderStaleLeads(staleLeads);
    }

    // 6. Properties & Off-plan (if admin)
    if (currentUser.role === 'admin') {
      const propRes = await fetch('/api/properties');
      if (propRes.ok) {
        allProperties = await propRes.json();
        renderPropertiesTable();
      }

      const offplanRes = await fetch('/api/offplan');
      if (offplanRes.ok) {
        allOffPlan = await offplanRes.json();
        renderOffPlanTable();
      }
    }
  } catch (err) {
    console.error('Data refresh error:', err);
  }
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

function renderDashboard(stats) {
  if (!stats) return;

  // KPIs
  document.getElementById('kpi-leads-today').textContent = stats.newLeadsToday || 0;
  document.getElementById('kpi-leads-sub').textContent = `${stats.totalNewLeads || 0} total new leads in queue`;
  document.getElementById('kpi-pipeline-val').textContent = `AED ${(stats.totalPipelineValue || 0).toLocaleString()}`;
  document.getElementById('kpi-viewings').textContent = stats.viewingsThisWeek || 0;
  document.getElementById('kpi-sales-month').textContent = `AED ${(stats.totalSalesThisMonth || 0).toLocaleString()}`;
  document.getElementById('kpi-commission-sub').textContent = `Agency Commission (2%): AED ${(stats.totalCommissionThisMonth || 0).toLocaleString()}`;

  // Stage Progress Bars
  const barsContainer = document.getElementById('stage-breakdown-bars');
  if (barsContainer && stats.stages) {
    const total = stats.totalLeads || 1;
    const stageColors = {
      'New': '#3B82F6',
      'Contacted': '#6366F1',
      'Viewing': '#EC4899',
      'Offer': '#F59E0B',
      'Won': '#10B981',
      'Lost': '#6B7280'
    };

    barsContainer.innerHTML = Object.entries(stats.stages).map(([stage, count]) => {
      const pct = Math.round((count / total) * 100);
      const color = stageColors[stage] || '#B8975A';
      return `
        <div class="stage-bar-item">
          <div class="stage-bar-header">
            <span>${stage} (${count} leads)</span>
            <span style="color: ${color}; font-weight: 500;">${pct}%</span>
          </div>
          <div class="stage-progress-track">
            <div class="stage-progress-fill" style="width: ${pct}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Lead Scores
  if (stats.scores) {
    document.getElementById('count-hot-leads').textContent = stats.scores.HOT || 0;
    document.getElementById('count-warm-leads').textContent = stats.scores.WARM || 0;
    document.getElementById('count-cold-leads').textContent = stats.scores.COLD || 0;
  }
}

// ============================================================================
// KANBAN PIPELINE BOARD WITH DRAG & DROP
// Requirement: "A board where I drag leads between stages (New, Contacted,
// Viewing, Offer, Won, Lost, and so on)"
// ============================================================================

function renderKanbanBoard() {
  const stages = ['New', 'Contacted', 'Viewing', 'Offer', 'Won', 'Lost'];

  stages.forEach(stage => {
    const colContainer = document.getElementById(`cards-${stage}`);
    const countEl = document.getElementById(`count-stage-${stage}`);
    if (!colContainer) return;

    const stageLeads = allLeads.filter(l => (l.status || 'New') === stage);
    if (countEl) countEl.textContent = stageLeads.length;

    colContainer.innerHTML = stageLeads.map(lead => `
      <div class="kanban-card" draggable="true" data-id="${lead.id}" onclick="openLeadById(${lead.id})">
        <div class="card-top">
          <span class="lead-score-badge ${getBadgeClass(lead.score_label)}">
            ${lead.score || 50} ${lead.score_label || 'WARM'}
          </span>
          <span class="card-source-tag" title="Source: ${lead.source_form || 'Website'}">${lead.source_form || 'Web'}</span>
        </div>
        <div class="card-name">${lead.name}</div>
        <div class="card-budget">AED ${(lead.budget_aed || 0).toLocaleString()}</div>
        <div style="font-size: 0.72rem; color: #D1D5DB; margin-bottom: 0.25rem;">
          ${lead.property_name || lead.preferred_community || 'Dubai Prime'}
        </div>
        <div class="card-meta">
          <span>Advisor: ${lead.agent_name || 'Unassigned'}</span>
          <span>#${lead.id}</span>
        </div>
      </div>
    `).join('');
  });

  // Attach Drag & Drop handlers to all cards and columns
  initDragAndDrop();
}

function initDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const dropzones = document.querySelectorAll('.kanban-cards');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dropzones.forEach(zone => zone.classList.remove('drag-over'));
    });
  });

  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');

      const leadId = e.dataTransfer.getData('text/plain');
      const targetStage = zone.getAttribute('data-stage');

      if (!leadId || !targetStage) return;

      const lead = allLeads.find(l => String(l.id) === String(leadId));
      if (!lead || lead.status === targetStage) return;

      // Special Trigger: If dropped into Won stage, prompt for sale price & 2% commission!
      if (targetStage === 'Won') {
        openWonModal(lead);
        return;
      }

      // Move stage immediately
      await updateLeadStage(leadId, targetStage);
    });
  });
}

async function updateLeadStage(leadId, newStage) {
  try {
    const res = await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStage })
    });

    if (!res.ok) throw new Error('Failed to update stage');

    // Update in-memory
    const idx = allLeads.findIndex(l => String(l.id) === String(leadId));
    if (idx !== -1) allLeads[idx].status = newStage;

    renderKanbanBoard();
    renderLeadsTable();

    // Refresh notifications and dashboard stats
    fetchNotifications();
    const dashRes = await fetch('/api/admin/dashboard', { headers: getAuthHeaders() });
    if (dashRes.ok) renderDashboard(await dashRes.json());
  } catch (err) {
    alert('Error moving lead: ' + err.message);
  }
}

// ============================================================================
// LEADS DIRECTORY TABLE
// ============================================================================

function renderLeadsTable() {
  const tbody = document.getElementById('leads-table-body');
  if (!tbody) return;

  const searchQuery = (document.getElementById('lead-search')?.value || '').toLowerCase().trim();
  const stageFilter = document.getElementById('filter-stage')?.value || '';
  const scoreFilter = document.getElementById('filter-score')?.value || '';
  const agentFilter = document.getElementById('filter-agent')?.value || '';

  let filtered = [...allLeads];

  if (searchQuery) {
    filtered = filtered.filter(l => 
      (l.name && l.name.toLowerCase().includes(searchQuery)) ||
      (l.phone && l.phone.includes(searchQuery)) ||
      (l.email && l.email.toLowerCase().includes(searchQuery)) ||
      (l.property_name && l.property_name.toLowerCase().includes(searchQuery)) ||
      (l.preferred_community && l.preferred_community.toLowerCase().includes(searchQuery))
    );
  }

  if (stageFilter) filtered = filtered.filter(l => l.status === stageFilter);
  if (scoreFilter) filtered = filtered.filter(l => l.score_label === scoreFilter);
  if (agentFilter) filtered = filtered.filter(l => l.agent_name === agentFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 2rem; color: #9CA3AF;">No leads match your search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => `
    <tr>
      <td>
        <span class="lead-score-badge ${getBadgeClass(lead.score_label)}">
          ${lead.score || 50} ${lead.score_label || 'WARM'}
        </span>
      </td>
      <td>
        <span style="font-weight: 500; color: #FFFFFF; font-size: 0.75rem;">${lead.status || 'New'}</span>
      </td>
      <td>
        <div style="font-weight: 500; color: #FFFFFF;">${lead.name}</div>
        <div style="font-size: 0.7rem; color: var(--admin-text-muted);">${lead.email || 'No email provided'}</div>
      </td>
      <td>
        <span style="font-family: monospace; color: #D1D5DB;">${lead.phone || '-'}</span>
      </td>
      <td style="color: var(--admin-gold); font-weight: 500;">
        AED ${(lead.budget_aed || 0).toLocaleString()}
      </td>
      <td>
        <div style="color: #FFFFFF;">${lead.preferred_community || 'Dubai'}</div>
        <div style="font-size: 0.7rem; color: var(--admin-text-muted);">${lead.property_name || 'General Inquiry'}</div>
      </td>
      <td>
        <span style="color: #93C5FD; font-size: 0.72rem;">${lead.source_form || 'Website'}</span>
      </td>
      <td>
        <span style="color: #D1D5DB; font-size: 0.75rem;">${lead.agent_name || 'Unassigned'}</span>
      </td>
      <td style="font-size: 0.7rem; color: var(--admin-text-muted);">
        ${(lead.created_at || '').substring(0, 10)}
      </td>
      <td>
        <button type="button" class="action-link" onclick="openLeadById(${lead.id})">Open Dossier</button>
      </td>
    </tr>
  `).join('');
}

// Download Excel CSV
document.getElementById('btn-export-excel')?.addEventListener('click', () => {
  window.location.href = '/api/admin/leads/export';
});

// Search & Filter listeners
['lead-search', 'filter-stage', 'filter-score', 'filter-agent'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', renderLeadsTable);
});

// ============================================================================
// LEAD DETAILS DRAWER
// Requirement: "A page for each lead: details, notes, change stage, assign an
// agent, book a viewing, and Call and WhatsApp buttons"
// ============================================================================

async function openLeadById(leadId) {
  try {
    const res = await fetch(`/api/admin/leads/${leadId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lead not found');

    const lead = await res.json();
    currentLeadInDrawer = lead;

    // Populate Drawer Elements
    document.getElementById('drawer-lead-id').textContent = `Lead Dossier #${lead.id}`;
    document.getElementById('drawer-lead-name').textContent = lead.name;

    const badgeEl = document.getElementById('drawer-score-badge');
    badgeEl.className = `lead-score-badge ${getBadgeClass(lead.score_label)}`;
    badgeEl.textContent = `${lead.score} ${lead.score_label}`;

    // Contact Buttons
    const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');
    document.getElementById('drawer-call-btn').href = `tel:${cleanPhone}`;
    
    const waText = encodeURIComponent(`Good day ${lead.name}, this is Emmanuel Real Estate connecting regarding your inquiry for ${lead.property_name || 'luxury residences in Dubai'}.`);
    document.getElementById('drawer-wa-btn').href = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}`;

    // Selectors
    document.getElementById('drawer-stage-select').value = lead.status || 'New';
    document.getElementById('drawer-agent-select').value = lead.agent_name || 'Alexander Wright';

    // Details Grid
    document.getElementById('drawer-phone').textContent = lead.phone || 'None';
    document.getElementById('drawer-email').textContent = lead.email || 'None';
    document.getElementById('drawer-budget').textContent = `AED ${(lead.budget_aed || 0).toLocaleString()}`;
    document.getElementById('drawer-payment-method').textContent = lead.payment_method || 'Cash Buyer';
    document.getElementById('drawer-community').textContent = lead.preferred_community || 'Dubai Prime';
    document.getElementById('drawer-property').textContent = lead.property_name || 'General Portfolio';
    document.getElementById('drawer-source-form').textContent = lead.source_form || 'Website Registration';
    document.getElementById('drawer-timeframe').textContent = lead.timeframe || 'Immediate';
    document.getElementById('drawer-message').textContent = lead.message || 'No additional client comments.';

    // Notes
    renderDrawerNotes(lead.notes || []);

    // Open Drawer
    document.getElementById('lead-drawer').classList.add('open');
  } catch (err) {
    alert('Error opening lead: ' + err.message);
  }
}

function closeLeadDrawer() {
  document.getElementById('lead-drawer').classList.remove('open');
  currentLeadInDrawer = null;
}

function renderDrawerNotes(notes) {
  const container = document.getElementById('drawer-notes-list');
  if (!container) return;

  if (!notes || notes.length === 0) {
    container.innerHTML = `<div style="font-size: 0.75rem; color: #9CA3AF; padding: 0.5rem 0;">No advisor notes logged yet. Use the field below to document calls, viewing feedback, or client requirements.</div>`;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="note-item">
      <div class="note-meta">
        <span>${n.author || 'Advisor'}</span>
        <span>${(n.created_at || '').substring(0, 16).replace('T', ' ')}</span>
      </div>
      <div class="note-content">${n.content}</div>
    </div>
  `).join('');
}

// Stage Selector in Drawer
document.getElementById('drawer-stage-select')?.addEventListener('change', async (e) => {
  if (!currentLeadInDrawer) return;
  const newStage = e.target.value;

  if (newStage === 'Won') {
    closeLeadDrawer();
    openWonModal(currentLeadInDrawer);
    return;
  }

  await updateLeadStage(currentLeadInDrawer.id, newStage);
  currentLeadInDrawer.status = newStage;
});

// Agent Assigner in Drawer
document.getElementById('drawer-agent-select')?.addEventListener('change', async (e) => {
  if (!currentLeadInDrawer) return;
  const newAgent = e.target.value;

  try {
    const res = await fetch(`/api/admin/leads/${currentLeadInDrawer.id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ agent_name: newAgent })
    });
    if (!res.ok) throw new Error('Failed to reassign agent');

    currentLeadInDrawer.agent_name = newAgent;
    const idx = allLeads.findIndex(l => l.id === currentLeadInDrawer.id);
    if (idx !== -1) allLeads[idx].agent_name = newAgent;

    renderKanbanBoard();
    renderLeadsTable();
  } catch (err) {
    alert('Error reassigning advisor: ' + err.message);
  }
});

// Post Note in Drawer
document.getElementById('add-note-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentLeadInDrawer) return;

  const content = document.getElementById('note-input').value.trim();
  if (!content) return;

  try {
    const res = await fetch(`/api/admin/leads/${currentLeadInDrawer.id}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        author: currentUser.name || 'Advisor',
        content
      })
    });

    if (!res.ok) throw new Error('Failed to post note');
    const data = await res.json();

    if (!currentLeadInDrawer.notes) currentLeadInDrawer.notes = [];
    currentLeadInDrawer.notes.unshift(data.note);

    renderDrawerNotes(currentLeadInDrawer.notes);
    document.getElementById('note-input').value = '';

    // Update stale list since activity occurred
    const staleRes = await fetch('/api/admin/stale-leads', { headers: getAuthHeaders() });
    if (staleRes.ok) renderStaleLeads(await staleRes.json());
  } catch (err) {
    alert('Error adding note: ' + err.message);
  }
});

// ============================================================================
// DEAL WON WORKFLOW (2% COMMISSION & MARK PROPERTY SOLD)
// Requirement: "When a lead is marked 'Won', ask for the sale price, work out
// a 2% commission, and mark the property as sold"
// ============================================================================

let leadToCloseWon = null;

function triggerDealWon() {
  if (currentLeadInDrawer) {
    const lead = currentLeadInDrawer;
    closeLeadDrawer();
    openWonModal(lead);
  }
}

function openWonModal(lead) {
  leadToCloseWon = lead;
  const modal = document.getElementById('won-modal');
  modal.classList.add('open');

  const priceInput = document.getElementById('won-sale-price');
  const propInput = document.getElementById('won-property-title');
  const agentSelect = document.getElementById('won-agent-name');

  priceInput.value = lead.budget_aed || 20000000;
  propInput.value = lead.property_name || 'Prime Dubai Residence';
  agentSelect.value = lead.agent_name || 'Alexander Wright';

  updateCommissionPreview();
}

function closeWonModal() {
  document.getElementById('won-modal').classList.remove('open');
  leadToCloseWon = null;
}

function updateCommissionPreview() {
  const price = Number(document.getElementById('won-sale-price').value) || 0;
  const commission = Math.round(price * 0.02); // 2% commission
  document.getElementById('modal-commission-preview').textContent = `AED ${commission.toLocaleString()}`;
}

document.getElementById('won-sale-price')?.addEventListener('input', updateCommissionPreview);

document.getElementById('won-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!leadToCloseWon) return;

  const salePrice = Number(document.getElementById('won-sale-price').value);
  const propertyTitle = document.getElementById('won-property-title').value.trim();
  const agentName = document.getElementById('won-agent-name').value;

  try {
    const res = await fetch(`/api/admin/leads/${leadToCloseWon.id}/won`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        sale_price_aed: salePrice,
        property_title: propertyTitle,
        agent_name: agentName
      })
    });

    if (!res.ok) throw new Error('Failed to record completed sale');
    const data = await res.json();

    closeWonModal();
    alert(`🎉 ${data.message}`);

    // Refresh CRM
    await refreshAllData();
  } catch (err) {
    alert('Error closing deal: ' + err.message);
  }
});

// ============================================================================
// VIEWINGS SCHEDULE TABLE
// ============================================================================

function renderViewingsTable() {
  const tbody = document.getElementById('viewings-table-body');
  if (!tbody) return;

  if (allViewings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #9CA3AF;">No private inspections currently booked.</td></tr>`;
    return;
  }

  tbody.innerHTML = allViewings.map(v => `
    <tr>
      <td style="color: var(--admin-text-muted);">#${v.id}</td>
      <td style="font-weight: 500; color: #FFFFFF;">${v.lead_name}</td>
      <td style="color: var(--admin-gold);">${v.property_name}</td>
      <td>${v.agent_name || 'Alexander Wright'}</td>
      <td style="font-weight: 500; color: #FFFFFF;">${v.viewing_date}</td>
      <td>
        <span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(52, 211, 153, 0.15); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.3);">
          ${v.status || 'Scheduled'}
        </span>
      </td>
      <td style="font-size: 0.75rem; color: #D1D5DB; max-width: 250px;">
        ${v.notes || 'Standard executive viewing dossier prepared.'}
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// AGENT LEADERBOARD (TARGET VS. CLOSED VOLUME & COMMISSION)
// Requirement: "Agent leaderboard against monthly targets"
// ============================================================================

function renderLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  container.innerHTML = allAgents.map((agent, index) => {
    const target = Number(agent.monthly_target_aed) || 60000000;
    const closed = Number(agent.closed_month_aed) || 0;
    const pct = Math.min(100, Math.round((closed / target) * 100));
    const commission = Math.round(closed * 0.02); // 2% commission earned

    return `
      <div class="leaderboard-card">
        <div class="leaderboard-header">
          <img src="${agent.image}" alt="${agent.name}" class="agent-avatar-img">
          <div>
            <div style="font-family: var(--font-heading); font-size: 1.4rem; color: #FFFFFF;">${agent.name}</div>
            <div style="font-size: 0.7rem; color: var(--admin-gold); text-transform: uppercase; letter-spacing: 0.12em;">${agent.role}</div>
            <div style="font-size: 0.68rem; color: var(--admin-text-muted);">${agent.focus}</div>
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 0.35rem;">
            <span style="color: var(--admin-text-muted);">Monthly Target Progress</span>
            <span style="color: var(--admin-gold); font-weight: 600;">${pct}%</span>
          </div>
          <div class="stage-progress-track">
            <div class="stage-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-top: 1px solid var(--admin-border); padding-top: 1rem;">
          <div>
            <div class="detail-item-label">Closed This Month</div>
            <div style="font-size: 0.95rem; color: #FFFFFF; font-weight: 500;">AED ${closed.toLocaleString()}</div>
          </div>
          <div>
            <div class="detail-item-label">Target (AED)</div>
            <div style="font-size: 0.95rem; color: var(--admin-text-muted);">AED ${target.toLocaleString()}</div>
          </div>
          <div>
            <div class="detail-item-label">Commission Earned (2%)</div>
            <div style="font-size: 0.95rem; color: #34D399; font-weight: 600;">AED ${commission.toLocaleString()}</div>
          </div>
          <div>
            <div class="detail-item-label">Direct Contact</div>
            <div style="font-size: 0.8rem; color: #93C5FD;">${agent.phone}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// STALE LEADS (3+ DAYS WITHOUT ACTIVITY)
// Requirement: "A list of leads with no activity for 3+ days"
// ============================================================================

function renderStaleLeads(staleLeads = null) {
  const tbody = document.getElementById('stale-table-body');
  const countTabEl = document.getElementById('stale-tab-count');
  if (!tbody) return;

  const leads = staleLeads || allLeads.filter(l => {
    if (l.status === 'Won' || l.status === 'Lost') return false;
    const lastDate = l.last_activity_date ? new Date(l.last_activity_date) : new Date(l.created_at);
    const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 3;
  });

  if (countTabEl) countTabEl.textContent = leads.length > 0 ? `(${leads.length})` : '';

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #34D399;">Excellent! All active leads have recent advisor updates.</td></tr>`;
    return;
  }

  tbody.innerHTML = leads.map(l => {
    const lastDate = l.last_activity_date ? new Date(l.last_activity_date) : new Date(l.created_at);
    const diffDays = Math.max(3, Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24)));

    return `
      <tr>
        <td><span class="stale-badge">⚠️ Follow-up Due</span></td>
        <td style="font-weight: 500; color: #FFFFFF;">${l.name}</td>
        <td style="font-family: monospace;">${l.phone || '-'}</td>
        <td><span style="font-size: 0.72rem; color: var(--admin-gold);">${l.status}</span></td>
        <td style="color: var(--admin-gold);">AED ${(l.budget_aed || 0).toLocaleString()}</td>
        <td>${l.agent_name || 'Unassigned'}</td>
        <td style="color: #F87171; font-weight: 600;">${diffDays} days ago</td>
        <td>
          <button type="button" class="action-link" onclick="openLeadById(${l.id})">Follow Up Now →</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// INVENTORY MANAGEMENT (PROPERTIES & PROJECTS CRUD)
// Requirement: "Let me add, edit, and remove properties and projects"
// ============================================================================

function switchInventory(type) {
  const readyBtn = document.getElementById('inv-tab-ready');
  const offplanBtn = document.getElementById('inv-tab-offplan');
  const readySec = document.getElementById('inventory-ready-section');
  const offplanSec = document.getElementById('inventory-offplan-section');
  const addBtn = document.getElementById('btn-add-inventory');

  if (type === 'ready') {
    readyBtn.classList.add('active');
    offplanBtn.classList.remove('active');
    readySec.style.display = 'block';
    offplanSec.style.display = 'none';
    if (addBtn) addBtn.textContent = '+ Add New Residence';
  } else {
    offplanBtn.classList.add('active');
    readyBtn.classList.remove('active');
    readySec.style.display = 'none';
    offplanSec.style.display = 'block';
    if (addBtn) addBtn.textContent = '+ Add Off-Plan Project';
  }
}

function renderPropertiesTable() {
  const tbody = document.getElementById('properties-table-body');
  if (!tbody) return;

  tbody.innerHTML = allProperties.map(p => `
    <tr>
      <td style="font-weight: 500; color: #FFFFFF;">${p.title}</td>
      <td>${p.community}</td>
      <td>${p.type}</td>
      <td>${p.bedrooms} Beds / ${p.bathrooms} Baths</td>
      <td style="color: var(--admin-gold); font-weight: 500;">AED ${(p.price_aed || 0).toLocaleString()}</td>
      <td>
        <span style="font-size: 0.68rem; padding: 0.2rem 0.5rem; ${p.status === 'Sold' ? 'background: rgba(239, 68, 68, 0.2); color: #F87171;' : 'background: rgba(16, 185, 129, 0.2); color: #34D399;'}">
          ${p.status || 'Available'}
        </span>
      </td>
      <td>
        <button type="button" class="action-link" onclick="editProperty(${p.id})">Edit</button>
        <span style="color: var(--admin-border); margin: 0 0.4rem;">|</span>
        <button type="button" class="action-link" style="color: #F87171;" onclick="deleteProperty(${p.id})">Remove</button>
      </td>
    </tr>
  `).join('');
}

function renderOffPlanTable() {
  const tbody = document.getElementById('offplan-table-body');
  if (!tbody) return;

  tbody.innerHTML = allOffPlan.map(o => `
    <tr>
      <td style="font-weight: 500; color: #FFFFFF;">${o.title}</td>
      <td style="color: var(--admin-gold);">${o.developer_name}</td>
      <td>${o.community}</td>
      <td style="color: var(--admin-gold); font-weight: 500;">From AED ${(o.starting_price_aed || 0).toLocaleString()}</td>
      <td>${o.handover_date}</td>
      <td style="color: #34D399;">${o.est_roi || '8.5% Net'}</td>
      <td>
        <button type="button" class="action-link" style="color: #F87171;" onclick="deleteOffPlanProject(${o.id})">Remove</button>
      </td>
    </tr>
  `).join('');
}

function openAddInventoryModal() {
  document.getElementById('property-form').reset();
  document.getElementById('prop-id').value = '';
  document.getElementById('inv-modal-title').textContent = 'Add Ready Residence';
  document.getElementById('inventory-modal').classList.add('open');
}

function closeInventoryModal() {
  document.getElementById('inventory-modal').classList.remove('open');
}

function editProperty(id) {
  const p = allProperties.find(x => x.id === id);
  if (!p) return;

  document.getElementById('prop-id').value = p.id;
  document.getElementById('prop-title').value = p.title;
  document.getElementById('prop-community').value = p.community;
  document.getElementById('prop-type').value = p.type;
  document.getElementById('prop-beds').value = p.bedrooms;
  document.getElementById('prop-baths').value = p.bathrooms;
  document.getElementById('prop-sqft').value = p.built_up_sqft;
  document.getElementById('prop-price').value = p.price_aed;
  document.getElementById('prop-status').value = p.status || 'Available';
  document.getElementById('prop-image').value = p.image || '';
  document.getElementById('prop-description').value = p.description || '';

  document.getElementById('inv-modal-title').textContent = 'Edit Residence Specifications';
  document.getElementById('inventory-modal').classList.add('open');
}

document.getElementById('property-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('prop-id').value;
  const data = {
    title: document.getElementById('prop-title').value.trim(),
    community: document.getElementById('prop-community').value,
    type: document.getElementById('prop-type').value,
    bedrooms: document.getElementById('prop-beds').value,
    bathrooms: document.getElementById('prop-baths').value,
    built_up_sqft: document.getElementById('prop-sqft').value,
    price_aed: document.getElementById('prop-price').value,
    status: document.getElementById('prop-status').value,
    image: document.getElementById('prop-image').value.trim(),
    description: document.getElementById('prop-description').value.trim()
  };

  try {
    const url = id ? `/api/admin/properties/${id}` : '/api/admin/properties';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Failed to save property');

    closeInventoryModal();
    const propRes = await fetch('/api/properties');
    if (propRes.ok) allProperties = await propRes.json();
    renderPropertiesTable();
    alert('Property saved to agency inventory.');
  } catch (err) {
    alert('Error saving property: ' + err.message);
  }
});

async function deleteProperty(id) {
  if (!confirm('Are you sure you want to remove this residence from the agency inventory?')) return;
  try {
    const res = await fetch(`/api/admin/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete property');

    allProperties = allProperties.filter(p => p.id !== id);
    renderPropertiesTable();
  } catch (err) {
    alert('Error removing property: ' + err.message);
  }
}

async function deleteOffPlanProject(id) {
  if (!confirm('Are you sure you want to remove this off-plan development?')) return;
  try {
    const res = await fetch(`/api/admin/offplan/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete off-plan project');

    allOffPlan = allOffPlan.filter(o => o.id !== id);
    renderOffPlanTable();
  } catch (err) {
    alert('Error removing project: ' + err.message);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getBadgeClass(label) {
  if (label === 'HOT') return 'badge-hot';
  if (label === 'WARM') return 'badge-warm';
  return 'badge-cold';
}

function setupEventListeners() {
  // ESC key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLeadDrawer();
      closeWonModal();
      closeInventoryModal();
    }
  });
}
