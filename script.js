(function () {
  'use strict';

  const SUPABASE_URL = 'https://scqvzdyljyfiohbvlbch.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_IUVrnRuWnWPY92T2hj41Vg_Y8N-t1PQ';

  const CHECKLIST_TASKS = [
    {
      title: '6+ Months Out',
      tasks: [
        'Choose wedding venue',
        'Set and confirm budget',
        'Book photographer / videographer',
        'Book caterer',
        'Book entertainment / band / DJ',
        'Select wedding party'
      ]
    },
    {
      title: '3 Months Out',
      tasks: [
        'Order wedding attire',
        'Send save-the-dates',
        'Book florist',
        'Schedule menu tasting',
        'Book officiant',
        'Arrange guest accommodations'
      ]
    },
    {
      title: '1 Month Out',
      tasks: [
        'Send formal invitations',
        'Finalize guest count',
        'Apply for marriage license',
        'Final dress / suit fitting',
        'Create seating chart',
        'Confirm all vendor bookings'
      ]
    },
    {
      title: 'Wedding Week',
      tasks: [
        'Attend rehearsal & rehearsal dinner',
        'Confirm final payments to vendors',
        'Pack for honeymoon',
        'Delegate day-of coordinator tasks',
        'Relax & enjoy your day'
      ]
    }
  ];

  const FALLBACK_RESPONSES = [
    "That's a thoughtful question. In the Zen approach to wedding planning, the key is balance — enjoy the process as much as the day itself. What specific area would you like guidance on?",
    "A calm mind plans a beautiful wedding. Consider what matters most to you both as a couple, and let that guide your decisions. How can I help?",
    "Wedding planning is a journey, not just a destination. Focus on what brings you joy and connection. What's on your mind?",
    "Start with your vision, then build around it. Every great wedding tells a story — yours should too. What story do you want to tell?"
  ];

  const AUTH_URL = SUPABASE_URL + '/auth/v1';

  let state = {
    onboarding: null,
    checklist: [],
    budget: []
  };

  let countdownInterval = null;
  let chatOpen = false;
  let collapsedPhases = new Set();
  let clientId = '';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const authOverlay = $('#auth-overlay');
  const authLogin = $('#auth-login');
  const authSignup = $('#auth-signup');
  const authLoader = $('#auth-loader');
  const loginForm = $('#login-form');
  const signupForm = $('#signup-form');
  const loginEmail = $('#login-email');
  const loginPassword = $('#login-password');
  const signupEmail = $('#signup-email');
  const signupPassword = $('#signup-password');
  const loginError = $('#login-error');
  const signupError = $('#signup-error');
  const showSignup = $('#show-signup');
  const showLogin = $('#show-login');

  const onboardingOverlay = $('#onboarding-overlay');
  const onboardingForm = $('#onboarding-form');
  const dashboard = $('#dashboard');
  const coupleNames = $('#couple-names');
  const displayDate = $('#display-date');
  const countdownDays = $('#countdown-days');
  const countdownHours = $('#countdown-hours');
  const countdownMinutes = $('#countdown-minutes');
  const progressFill = $('#progress-fill');
  const progressPercent = $('#progress-percent');
  const checklistCount = $('#checklist-count');
  const checklistContainer = $('#checklist-container');
  const bTotal = $('#b-total');
  const bSpent = $('#b-spent');
  const bRemaining = $('#b-remaining');
  const budgetForm = $('#budget-form');
  const expenseName = $('#expense-name');
  const expenseCost = $('#expense-cost');
  const budgetLedger = $('#budget-ledger');
  const chatToggle = $('#chat-toggle');
  const chatDrawer = $('#chat-drawer');
  const chatOverlay = $('#chat-overlay');
  const chatClose = $('#chat-close');
  const chatMessages = $('#chat-messages');
  const chatInput = $('#chat-input');
  const chatSend = $('#chat-send');

  const btnSettings = $('#btn-settings');
  const settingsOverlay = $('#settings-overlay');
  const settingsClose = $('#settings-close');
  const settingsCancel = $('#settings-cancel');
  const settingsForm = $('#settings-form');
  const settingsP1 = $('#settings-p1');
  const settingsP2 = $('#settings-p2');
  const settingsDate = $('#settings-date');
  const settingsBudget = $('#settings-budget');

  const btnLogout = $('#btn-logout');
  const logoutOverlay = $('#logout-overlay');
  const logoutClose = $('#logout-close');
  const logoutCancel = $('#logout-cancel');
  const logoutConfirm = $('#logout-confirm');

  const cardDays = $('#card-days');
  const cardTasks = $('#card-tasks');
  const cardRemaining = $('#card-remaining');
  const cardExpenses = $('#card-expenses');

  const sidebar = $('#sidebar');
  const sidebarOverlay = $('#sidebar-overlay');
  const sidebarToggle = $('#sidebar-toggle');
  const mobileMenuBtn = $('#mobile-menu-btn');
  const sidebarLinks = $$('.sidebar-link');

  // ─── Auth (Supabase REST API, no CDN) ─────────────
  function getStoredSession () {
    try { var r = localStorage.getItem('codeshakers_auth'); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }

  function clearStoredSession () {
    localStorage.removeItem('codeshakers_auth');
  }

  async function refreshToken () {
    var session = getStoredSession();
    if (!session || !session.refresh_token) return null;
    try {
      var res = await fetch(AUTH_URL + '/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      if (!res.ok) { clearStoredSession(); return null; }
      var data = await res.json();
      if (data.access_token) {
        localStorage.setItem('codeshakers_auth', JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token || session.refresh_token,
          expires_at: Date.now() + ((data.expires_in || 3600) * 1000),
          user_id: session.user_id
        }));
        return data;
      }
      clearStoredSession(); return null;
    } catch (e) { return null; }
  }

  async function getAuthToken () {
    var session = getStoredSession();
    if (!session) return null;
    if (session.expires_at < Date.now() + 60000) {
      var refreshed = await refreshToken();
      if (!refreshed) return null;
      session = getStoredSession();
    }
    return session ? session.access_token : null;
  }

  async function authSignIn (email, password) {
    var res = await fetch(AUTH_URL + '/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (data.access_token) {
      localStorage.setItem('codeshakers_auth', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + ((data.expires_in || 3600) * 1000),
        user_id: data.user ? data.user.id : null
      }));
      clientId = data.user ? data.user.id : null;
      localStorage.setItem('codeshakers_client_id', clientId);
    }
    return data;
  }

  async function authSignUp (email, password) {
    var res = await fetch(AUTH_URL + '/signup', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    return res.json();
  }

  async function authSignOut () {
    var session = getStoredSession();
    if (session && session.access_token) {
      try {
        await fetch(AUTH_URL + '/logout', {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + session.access_token }
        });
      } catch (e) {}
    }
    clearStoredSession();
    clientId = '';
    localStorage.removeItem('codeshakers_client_id');
    showAuthView('login');
    loginEmail.value = '';
    loginPassword.value = '';
    authOverlay.classList.remove('hidden');
    dashboard.classList.add('hidden');
    onboardingOverlay.classList.add('hidden');
    if (countdownInterval) clearInterval(countdownInterval);
  }

  function showAuthView (view) {
    authLogin.classList.toggle('hidden', view !== 'login');
    authSignup.classList.toggle('hidden', view !== 'signup');
    authLoader.classList.add('hidden');
  }

  function showAuthError (el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function hideAuthError (el) {
    el.classList.add('hidden');
    el.textContent = '';
  }

  function authLoading (loading) {
    authLoader.classList.toggle('hidden', !loading);
    authLogin.classList.toggle('hidden', loading);
    authSignup.classList.toggle('hidden', loading);
  }

  async function handleLogin (e) {
    e.preventDefault();
    hideAuthError(loginError);
    var email = loginEmail.value.trim();
    var password = loginPassword.value;
    if (!email || !password) return;
    authLoading(true);
    var data = await authSignIn(email, password);
    authLoading(false);
    if (data.error) {
      var msg = data.error_description || data.error || 'Invalid email or password.';
      showAuthError(loginError, msg);
    }
  }

  async function handleSignup (e) {
    e.preventDefault();
    hideAuthError(signupError);
    var email = signupEmail.value.trim();
    var password = signupPassword.value;
    if (!email || !password) return;
    if (password.length < 6) {
      showAuthError(signupError, 'Password must be at least 6 characters.');
      return;
    }
    authLoading(true);
    var data = await authSignUp(email, password);
    authLoading(false);
    if (data.error) {
      showAuthView('signup');
      showAuthError(signupError, data.error_description || data.error);
    } else if (data.id || data.user) {
      showAuthView('login');
      showAuthError(loginError, 'A verification link has been sent to ' + email + '. Click the link to verify your account, then sign in.');
      signupEmail.value = '';
      signupPassword.value = '';
    }
  }

  // Called after successful login (from boot or handleLogin)
  async function onSignedIn () {
    var session = getStoredSession();
    if (!session || !session.user_id) return;
    clientId = session.user_id;
    localStorage.setItem('codeshakers_client_id', clientId);
    authOverlay.classList.add('hidden');
    var loaded = loadState();
    if (loaded && state.onboarding) {
      initDashboard();
      loadStateFromAPI();
    } else {
      var apiLoaded = await loadStateFromAPI();
      if (apiLoaded && state.onboarding) {
        initDashboard();
      } else {
        var today = new Date().toISOString().split('T')[0];
        document.getElementById('wedding-date').setAttribute('min', today);
        onboardingOverlay.classList.remove('hidden');
      }
    }
  }

  // ─── Client ID ────────────────────────────────────
  function getOrCreateClientId () {
    let id = localStorage.getItem('codeshakers_client_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      localStorage.setItem('codeshakers_client_id', id);
    }
    return id;
  }

  // ─── API ──────────────────────────────────────────
  const API_BASE = '/api';

  async function apiGet () {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(`${API_BASE}/data?client_id=${clientId}`, { headers });
      const json = await res.json();
      return json.data;
    } catch (e) {
      return null;
    }
  }

  async function apiPut (weddingData) {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      await fetch(`${API_BASE}/data?client_id=${clientId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ wedding_data: weddingData })
      });
    } catch (e) {
    }
  }

  // ─── localStorage ──────────────────────────────────
  function saveState () {
    try {
      localStorage.setItem('codeshakers_state', JSON.stringify(state));
    } catch (e) { }
    apiPut(state);
  }

  function loadState () {
    try {
      const raw = localStorage.getItem('codeshakers_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        applyParsedState(parsed);
        return true;
      }
    } catch (e) { }
    return false;
  }

  function applyParsedState (parsed) {
    state.onboarding = parsed.onboarding || null;
    state.budget = parsed.budget || [];
    state.checklist = parsed.checklist || [];

    if (state.checklist.length > 0 && Array.isArray(state.checklist[0]) && (typeof state.checklist[0][0] === 'boolean' || state.checklist[0].length === 0)) {
      state.checklist = CHECKLIST_TASKS.map((phase, pIdx) => ({
        title: phase.title,
        tasks: phase.tasks.map((t, tIdx) => ({
          text: t,
          done: state.checklist[pIdx] ? !!state.checklist[pIdx][tIdx] : false
        }))
      }));
      saveState();
    }
  }

  async function loadStateFromAPI () {
    const remote = await apiGet();
    if (remote) {
      applyParsedState(remote);
      saveState();
      return true;
    }
    return false;
  }

  // ─── Onboarding ────────────────────────────────────
  function handleOnboarding (e) {
    e.preventDefault();
    const partner1 = $('#partner1').value.trim();
    const partner2 = $('#partner2').value.trim();
    const weddingDate = $('#wedding-date').value;
    const budget = parseFloat($('#budget').value);

    if (!partner1 || !partner2 || !weddingDate || !budget) return;

    state.onboarding = { partner1, partner2, weddingDate, budget };
    state.checklist = CHECKLIST_TASKS.map(phase => ({
      title: phase.title,
      tasks: phase.tasks.map(t => ({ text: t, done: false }))
    }));
    state.budget = [];

    saveState();
    initDashboard();
  }

  // ─── Dashboard Init ────────────────────────────────
  function initDashboard () {
    onboardingOverlay.classList.add('hidden');
    dashboard.classList.remove('hidden');

    const o = state.onboarding;
    $('#p1-name').textContent = o.partner1;
    $('#p2-name').textContent = o.partner2;
    const parts = o.weddingDate.split('-');
    const localDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    displayDate.textContent = localDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    renderChecklist();
    renderBudget();
    startCountdown();
    updateSummaryCards();

    if (chatMessages.children.length === 0) {
      appendChatMessage('Welcome to codeshakers. I\'m ZenAI, your mindful wedding planning assistant. Ask me anything about your wedding — I\'m here to help with clarity and calm.', 'bot');
    }
  }

  // ─── Sidebar ──────────────────────────────────────
  function openSidebar () {
    sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('show');
  }

  function closeSidebar () {
    sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
  }

  function toggleSidebar () {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function setActiveSection (sectionId) {
    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });

    const section = document.getElementById(`section-${sectionId}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (window.innerWidth <= 1024) {
      closeSidebar();
    }
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      if (section) {
        setActiveSection(section);
      }
    });
  });

  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // ─── Countdown ─────────────────────────────────────
  function startCountdown () {
    if (countdownInterval) clearInterval(countdownInterval);
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 60000);
  }

  function updateCountdown () {
    if (!state.onboarding) return;
    const p = state.onboarding.weddingDate.split('-');
    const target = new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59);
    const now = new Date();
    let diff = target - now;
    if (diff < 0) diff = 0;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    countdownDays.textContent = String(days).padStart(2, '0');
    countdownHours.textContent = String(hours).padStart(2, '0');
    countdownMinutes.textContent = String(minutes).padStart(2, '0');
  }

  // ─── Checklist ─────────────────────────────────────
  function renderChecklist () {
    let total = 0, done = 0;
    let html = '';

    state.checklist.forEach((phase, phaseIdx) => {
      const phaseDone = phase.tasks.filter(t => t.done).length;
      const phaseTotal = phase.tasks.length;
      total += phaseTotal;
      done += phaseDone;
      const completed = phaseTotal > 0 && phaseDone === phaseTotal;

      const isCollapsed = collapsedPhases.has(phaseIdx);
      html += `
        <div class="phase ${isCollapsed ? 'collapsed' : ''} ${completed ? 'completed' : ''}">
          <div class="phase-header" data-phase="${phaseIdx}">
            <span class="phase-icon">${completed ? '\u2713' : phaseIdx + 1}</span>
            <span class="phase-title">${phase.title}</span>
            <span class="phase-count">${phaseDone}/${phaseTotal}</span>
            <span class="phase-arrow">&#9660;</span>
          </div>
          <div class="phase-body">
      `;

      phase.tasks.forEach((task, taskIdx) => {
        html += `
          <div class="task-item ${task.done ? 'done' : ''}">
            <input type="checkbox" class="task-check" data-phase="${phaseIdx}" data-task="${taskIdx}" ${task.done ? 'checked' : ''}>
            <span class="task-label">${escapeHtml(task.text)}</span>
            <button class="btn-delete-task" data-phase="${phaseIdx}" data-task="${taskIdx}" aria-label="Delete activity">&times;</button>
          </div>
        `;
      });

      html += `
          <div class="add-task-form">
            <input type="text" class="new-task-input" id="new-task-${phaseIdx}" placeholder="Add new activity...">
            <button class="btn-add-task" data-phase="${phaseIdx}">+ Add</button>
          </div>
      `;

      html += `</div></div>`;
    });

    checklistContainer.innerHTML = html;
    checklistCount.textContent = `${done} / ${total}`;
    updateProgress(done, total);
    updateSummaryCards();

    $$('.task-check').forEach(cb => {
      cb.addEventListener('change', handleTaskToggle);
    });
    $$('.phase-header').forEach(hdr => {
      hdr.addEventListener('click', function () {
        const idx = parseInt(this.dataset.phase);
        if (collapsedPhases.has(idx)) collapsedPhases.delete(idx);
        else collapsedPhases.add(idx);
        this.parentElement.classList.toggle('collapsed');
      });
    });
    $$('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', handleDeleteTask);
    });
    $$('.btn-add-task').forEach(btn => {
      btn.addEventListener('click', handleAddTask);
    });
    $$('.new-task-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const phaseIdx = parseInt(e.target.id.replace('new-task-', ''));
          addTask(phaseIdx, e.target.value);
        }
      });
    });
  }

  function handleTaskToggle (e) {
    const cb = e.target;
    const phaseIdx = parseInt(cb.dataset.phase);
    const taskIdx = parseInt(cb.dataset.task);
    state.checklist[phaseIdx].tasks[taskIdx].done = cb.checked;
    saveState();
    renderChecklist();
  }

  function handleDeleteTask(e) {
    const btn = e.currentTarget;
    const phaseIdx = parseInt(btn.dataset.phase);
    const taskIdx = parseInt(btn.dataset.task);
    state.checklist[phaseIdx].tasks.splice(taskIdx, 1);
    saveState();
    renderChecklist();
  }

  function handleAddTask(e) {
    const btn = e.currentTarget;
    const phaseIdx = parseInt(btn.dataset.phase);
    const input = document.getElementById(`new-task-${phaseIdx}`);
    addTask(phaseIdx, input.value);
  }

  function addTask(phaseIdx, text) {
    text = text.trim();
    if (!text) return;
    state.checklist[phaseIdx].tasks.push({ text: text, done: false });
    saveState();
    renderChecklist();
    const input = document.getElementById(`new-task-${phaseIdx}`);
    if (input) input.focus();
  }

  function updateProgress (done, total) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    progressFill.style.width = pct + '%';
    progressPercent.textContent = pct + '%';
  }

  // ─── Budget ────────────────────────────────────────
  function formatCurrency (amount) {
    return 'NGN' + Math.round(amount).toLocaleString('en-US');
  }

  function renderBudget () {
    const totalBudget = state.onboarding ? state.onboarding.budget : 0;
    const spent = state.budget.reduce((sum, item) => sum + item.cost, 0);
    const remaining = totalBudget - spent;

    bTotal.textContent = formatCurrency(totalBudget);
    bSpent.textContent = formatCurrency(spent);

    const remEl = bRemaining;
    if (remaining < 0) {
      remEl.textContent = '-NGN' + Math.abs(Math.round(remaining)).toLocaleString('en-US');
      remEl.className = 'value negative';
    } else {
      remEl.textContent = formatCurrency(remaining);
      remEl.className = 'value';
    }

    updateSummaryCards();

    if (state.budget.length === 0) {
      budgetLedger.innerHTML = '<div class="ledger-empty"><span>&#10097;</span>No expenses logged yet.</div>';
    } else {
      let html = '';
      state.budget.forEach((item, idx) => {
        html += `
          <div class="ledger-item">
            <span class="expense-name">${escapeHtml(item.name)}</span>
            <span class="expense-cost">${formatCurrency(item.cost)}</span>
            <button class="btn-delete" data-idx="${idx}" aria-label="Delete expense">&times;</button>
          </div>
        `;
      });
      budgetLedger.innerHTML = html;
      $$('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function () {
          const idx = parseInt(this.dataset.idx);
          state.budget.splice(idx, 1);
          saveState();
          renderBudget();
        });
      });
    }
  }

  function handleAddExpense (e) {
    e.preventDefault();
    const name = expenseName.value.trim();
    const cost = parseFloat(expenseCost.value);
    if (!name || !cost || cost <= 0) return;
    state.budget.push({ name, cost });
    saveState();
    expenseName.value = '';
    expenseCost.value = '';
    renderBudget();
  }

  // ─── AI Chat ───────────────────────────────────────
  function toggleChat (open) {
    chatOpen = open !== undefined ? open : !chatOpen;
    chatDrawer.classList.toggle('open', chatOpen);
    chatOverlay.classList.toggle('show', chatOpen);
    if (chatOpen) chatInput.focus();
  }

  function buildAIContext () {
    let total = 0, done = 0;
    state.checklist.forEach(phase => {
      phase.tasks.forEach(t => { total++; if (t.done) done++; });
    });
    const spent = state.budget.reduce((sum, item) => sum + item.cost, 0);
    return {
      partner1: state.onboarding?.partner1 || '',
      partner2: state.onboarding?.partner2 || '',
      weddingDate: state.onboarding?.weddingDate || '',
      budget: state.onboarding?.budget || 0,
      tasksDone: done,
      tasksTotal: total,
      budgetSpent: spent,
      budgetRemaining: (state.onboarding?.budget || 0) - spent
    };
  }

  async function handleChatSend () {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';

    appendChatMessage(text, 'user');

    if (document.getElementById('typing-indicator')) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const context = buildAIContext();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context })
      });
      const data = await res.json();
      const indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
      if (data.reply) {
        appendChatMessage(data.reply, 'bot');
      } else {
        appendChatMessage('ZenAI is taking a moment to reflect. Please try again.', 'bot');
      }
    } catch (e) {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
      const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
      appendChatMessage(fallback, 'bot');
    }
  }

  function appendChatMessage (text, sender) {
    const div = document.createElement('div');
    div.className = 'chat-message ' + sender;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ─── Settings Modal ──────────────────────────────
  function openSettings () {
    const o = state.onboarding;
    settingsP1.value = o.partner1;
    settingsP2.value = o.partner2;
    settingsDate.value = o.weddingDate;
    settingsBudget.value = o.budget;
    settingsOverlay.classList.add('show');
  }

  function closeSettings () {
    settingsOverlay.classList.remove('show');
  }

  function handleSettingsSave (e) {
    e.preventDefault();
    const partner1 = settingsP1.value.trim();
    const partner2 = settingsP2.value.trim();
    const weddingDate = settingsDate.value;
    const budget = parseFloat(settingsBudget.value);
    if (!partner1 || !partner2 || !weddingDate || !budget) return;

    state.onboarding = { partner1, partner2, weddingDate, budget };
    saveState();
    closeSettings();
    initDashboard();
  }

  // ─── Logout ────────────────────────────────────────
  function openLogout () {
    logoutOverlay.classList.add('show');
  }

  function closeLogout () {
    logoutOverlay.classList.remove('show');
  }

  async function handleLogout () {
    closeLogout();
    await signOut();
  }

  // ─── Summary Cards ───────────────────────────────
  function updateSummaryCards () {
    if (!state.onboarding) return;
    const p = state.onboarding.weddingDate.split('-');
    const target = new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59);
    const now = new Date();
    let diff = target - now;
    if (diff < 0) diff = 0;
    const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
    cardDays.textContent = daysLeft;

    let total = 0, done = 0;
    state.checklist.forEach(phase => {
      phase.tasks.forEach(t => {
        total++;
        if (t.done) done++;
      });
    });
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    cardTasks.textContent = pct + '%';

    const totalBudget = state.onboarding.budget;
    const spent = state.budget.reduce((sum, item) => sum + item.cost, 0);
    const remaining = totalBudget - spent;
    if (remaining < 0) {
      cardRemaining.textContent = '-NGN' + Math.abs(Math.round(remaining)).toLocaleString('en-US');
      cardRemaining.style.color = 'var(--danger)';
    } else {
      cardRemaining.textContent = 'NGN' + Math.round(remaining).toLocaleString('en-US');
      cardRemaining.style.color = '';
    }

    cardExpenses.textContent = state.budget.length;
  }

  // ─── Utilities ─────────────────────────────────────
  function escapeHtml (str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Bootstrap ─────────────────────────────────────
  async function boot () {
    var session = getStoredSession();
    if (session && session.access_token) {
      if (session.expires_at < Date.now() + 60000) {
        var refreshed = await refreshToken();
        if (!refreshed) { showAuthView('login'); authOverlay.classList.remove('hidden'); return; }
        session = getStoredSession();
      }
      if (session && session.user_id) {
        clientId = session.user_id;
        localStorage.setItem('codeshakers_client_id', clientId);
        var loaded = loadState();
        if (loaded && state.onboarding) {
          authOverlay.classList.add('hidden');
          initDashboard();
          loadStateFromAPI();
        } else {
          var apiLoaded = await loadStateFromAPI();
          authOverlay.classList.add('hidden');
          if (apiLoaded && state.onboarding) {
            initDashboard();
          } else {
            var today = new Date().toISOString().split('T')[0];
            document.getElementById('wedding-date').setAttribute('min', today);
            onboardingOverlay.classList.remove('hidden');
          }
        }
        return;
      }
    }
    clientId = getOrCreateClientId();
    showAuthView('login');
    authOverlay.classList.remove('hidden');
  }

  // ─── Event Bindings ────────────────────────────────
  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);
  showSignup.addEventListener('click', (e) => { e.preventDefault(); showAuthView('signup'); });
  showLogin.addEventListener('click', (e) => { e.preventDefault(); showAuthView('login'); });

  onboardingForm.addEventListener('submit', handleOnboarding);
  budgetForm.addEventListener('submit', handleAddExpense);
  chatToggle.addEventListener('click', () => toggleChat(true));
  chatClose.addEventListener('click', () => toggleChat(false));
  chatOverlay.addEventListener('click', () => toggleChat(false));
  chatSend.addEventListener('click', handleChatSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleChatSend();
  });

  btnSettings.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);
  settingsCancel.addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) closeSettings();
  });
  settingsForm.addEventListener('submit', handleSettingsSave);

  btnLogout.addEventListener('click', openLogout);
  logoutClose.addEventListener('click', closeLogout);
  logoutCancel.addEventListener('click', closeLogout);
  logoutOverlay.addEventListener('click', (e) => {
    if (e.target === logoutOverlay) closeLogout();
  });
  logoutConfirm.addEventListener('click', handleLogout);

  boot();

})();
