let tickets = [];
let currentEditId = null;
const UNSYNCED_KEY = 'unsynced_tickets';
const DRAFT_KEY = 'ticket_draft';

const ticketsList = document.getElementById('ticketsList');
const priorityFilter = document.getElementById('priorityFilter');
const addTicketBtn = document.getElementById('addTicketBtn');
const modal = document.getElementById('ticketModal');
const closeBtn = document.querySelector('.close');
const ticketForm = document.getElementById('ticketForm');
const modalTitle = document.getElementById('modalTitle');
const onlineStatus = document.getElementById('onlineStatus');
const syncBtn = document.getElementById('syncBtn');
const clearDraftBtn = document.getElementById('clearDraftBtn');

function updateStatusSimple() {
    const isOnlineNow = navigator.onLine;
    if (isOnlineNow !== isOnline) {
      isOnline = isOnlineNow;
      updateOnlineStatus();
    }
  }
  
  window.addEventListener('online', () => {
    console.log('🔌 СЕТЬ ПОЯВИЛАСЬ (событие online)');
    updateStatusSimple();
    checkRealConnection(); 
  });
  
  window.addEventListener('offline', () => {
    console.log('🔌 СЕТЬ ПРОПАЛА (событие offline)');
    updateStatusSimple();
  });

let deferredPrompt;
const installBtn = document.createElement('button');
installBtn.id = 'installBtn';
installBtn.textContent = '📱 Установить приложение';
installBtn.style.cssText = 'background: #4caf50; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer;';

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const statusBar = document.querySelector('.status-bar');
  if (statusBar && !document.getElementById('installBtn')) {
    statusBar.appendChild(installBtn);
  }
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') installBtn.style.display = 'none';
    deferredPrompt = null;
  }
});

function loadTickets() {
  const saved = localStorage.getItem('tickets');
  if (saved) {
    tickets = JSON.parse(saved);
  } else {
    tickets = [{
      id: Date.now(),
      title: 'Настройка оборудования',
      description: 'Проверить сервер',
      priority: 'высокий',
      createdAt: new Date().toISOString(),
      synced: false
    }];
  }
  renderTickets();
}

function saveTickets() {
  localStorage.setItem('tickets', JSON.stringify(tickets));
}

function renderTickets() {
  let filtered = tickets.filter(t => 
    priorityFilter.value === 'all' || t.priority === priorityFilter.value
  );
  
  if (!filtered.length) {
    ticketsList.innerHTML = '<div class="ticket-card">Нет заявок</div>';
    return;
  }
  
  ticketsList.innerHTML = filtered.map(t => `
    <div class="ticket-card">
      <h3>${escapeHtml(t.title)}</h3>
      <p>${escapeHtml(t.description || 'Нет описания')}</p>
      <div class="ticket-meta">
        <span class="priority-badge">${t.priority}</span>
        <span class="date">${new Date(t.createdAt).toLocaleDateString()}</span>
        ${!t.synced ? '<span class="unsynced-badge">⚠️ Не синхр.</span>' : ''}
      </div>
      <div style="margin-top:10px">
        <button onclick="editTicket(${t.id})">✏️</button>
        <button onclick="deleteTicket(${t.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function addTicket(title, description, priority) {
  const newTicket = {
    id: Date.now(),
    title,
    description,
    priority,
    createdAt: new Date().toISOString(),
    synced: false
  };
  
  tickets.push(newTicket);
  saveTickets();
  saveUnsyncedTicket(newTicket);
  renderTickets();
}

function editTicket(id) {
  const t = tickets.find(t => t.id === id);
  if (t) {
    currentEditId = id;
    modalTitle.textContent = 'Редактировать';
    document.getElementById('title').value = t.title;
    document.getElementById('description').value = t.description;
    document.getElementById('priority').value = t.priority;
    modal.style.display = 'block';
  }
}

function updateTicket(id, title, description, priority) {
  const idx = tickets.findIndex(t => t.id === id);
  if (idx !== -1) {
    tickets[idx] = {
      ...tickets[idx],
      title,
      description,
      priority,
      synced: false
    };
    saveTickets();
    saveUnsyncedTicket(tickets[idx]);
    renderTickets();
  }
}

function deleteTicket(id) {
  if (confirm('Удалить?')) {
    const deleted = tickets.find(t => t.id === id);
    tickets = tickets.filter(t => t.id !== id);
    saveTickets();
    saveUnsyncedTicket({ id: deleted.id, _deleted: true });
    renderTickets();
  }
}

function saveUnsyncedTicket(ticket) {
  let unsynced = JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '[]');
  unsynced.push({ ...ticket, unsyncedAt: new Date().toISOString() });
  localStorage.setItem(UNSYNCED_KEY, JSON.stringify(unsynced));
  updateSyncButton();
}

function getUnsyncedTickets() {
  return JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '[]');
}

function clearUnsyncedTickets() {
  localStorage.removeItem(UNSYNCED_KEY);
  updateSyncButton();
}

function updateSyncButton() {
  const n = getUnsyncedTickets().length;
  if (syncBtn) {
    syncBtn.textContent = n > 0 ? `🔄 Синхр (${n})` : `🔄 Синхр`;
  }
}

async function syncWithServer() {
  const unsynced = getUnsyncedTickets();
  if (!unsynced.length) {
    alert('Нет данных для синхронизации');
    return;
  }
  
  if (!isOnline) {
    alert('Нет соединения с интернетом');
    return;
  }
  
  syncBtn.disabled = true;
  syncBtn.textContent = '🔄 Синхр...';
  
  try {
    for (const t of unsynced) {
      if (t._deleted) {
        const response = await fetch(`/api/tickets/${t.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Ошибка удаления ${t.id}`);
      } else {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: t.title,
            description: t.description,
            priority: t.priority,
            createdAt: t.createdAt
          })
        });
        if (!response.ok) throw new Error(`Ошибка отправки ${t.id}`);
        
        const localTicket = tickets.find(lt => lt.id === t.id);
        if (localTicket) localTicket.synced = true;
      }
    }
    
    clearUnsyncedTickets();
    saveTickets();
    renderTickets();
    alert('✅ Синхронизация завершена');
  } catch(e) {
    console.error('Sync error:', e);
    alert('❌ Ошибка синхронизации: ' + e.message);
  } finally {
    syncBtn.disabled = false;
    updateSyncButton();
  }
}

function saveDraft() {
  const draft = {
    title: document.getElementById('title')?.value || '',
    description: document.getElementById('description')?.value || '',
    priority: document.getElementById('priority')?.value || 'средний'
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  if (clearDraftBtn) clearDraftBtn.style.display = 'inline-block';
}

function loadDraft() {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    const d = JSON.parse(draft);
    document.getElementById('title').value = d.title || '';
    document.getElementById('description').value = d.description || '';
    document.getElementById('priority').value = d.priority || 'средний';
    return true;
  }
  return false;
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  if (clearDraftBtn) clearDraftBtn.style.display = 'none';
}

function showDraftNotification() {
  if (localStorage.getItem(DRAFT_KEY)) {
    const notif = document.createElement('div');
    notif.className = 'draft-notification';
    notif.innerHTML = `
      <span>📝 Есть несохранённый черновик</span>
      <button onclick="restoreDraft()">Восстановить</button>
      <button onclick="clearDraftAndNotify()">Удалить</button>
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 15000);
  }
}

function restoreDraft() {
  loadDraft();
  document.querySelector('.draft-notification')?.remove();
  addTicketBtn.click();
}

function clearDraftAndNotify() {
  clearDraft();
  document.querySelector('.draft-notification')?.remove();
  alert('Черновик удалён');
}

let isOnline = false;

function updateOnlineStatus() {
  if (isOnline) {
    onlineStatus.textContent = '🟢 Онлайн';
    onlineStatus.className = 'online';
    console.log('Статус: ОНЛАЙН');
    const unsynced = getUnsyncedTickets();
    if (unsynced.length > 0) syncWithServer();
  } else {
    onlineStatus.textContent = '🔴 Офлайн';
    onlineStatus.className = 'offline';
    console.log('Статус: ОФЛАЙН');
  }
}

async function checkRealConnection() {
  try {
    const response = await fetch('/api/check', {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const wasOnline = isOnline;
    isOnline = response.ok;
    if (wasOnline !== isOnline) updateOnlineStatus();
  } catch (e) {
    if (isOnline) {
      isOnline = false;
      updateOnlineStatus();
    }
  }
}

window.addEventListener('online', () => {
  console.log('Браузер говорит: сеть появилась');
  checkRealConnection();
});

window.addEventListener('offline', () => {
  console.log('Браузер говорит: сеть пропала');
  isOnline = false;
  updateOnlineStatus();
});

setInterval(checkRealConnection, 5000);
checkRealConnection();

ticketForm.onsubmit = (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const desc = document.getElementById('description').value;
  const priority = document.getElementById('priority').value;
  
  if (currentEditId) {
    updateTicket(currentEditId, title, desc, priority);
  } else {
    addTicket(title, desc, priority);
  }
  
  modal.style.display = 'none';
  ticketForm.reset();
  modalTitle.textContent = 'Новая заявка';
  clearDraft();
};

addTicketBtn.onclick = () => {
  currentEditId = null;
  modalTitle.textContent = 'Новая заявка';
  loadDraft();
  modal.style.display = 'block';
};

clearDraftBtn?.addEventListener('click', () => {
  clearDraft();
  alert('Черновик очищен');
});

closeBtn.onclick = () => {
  modal.style.display = 'none';
  ticketForm.reset();
  currentEditId = null;
};

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    ticketForm.reset();
    currentEditId = null;
  }
};

priorityFilter.onchange = () => renderTickets();
syncBtn?.addEventListener('click', syncWithServer);

['title', 'description', 'priority'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', saveDraft);
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    }[m];
  });
}

updateSyncButton();
showDraftNotification();
loadTickets();