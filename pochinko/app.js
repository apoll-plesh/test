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

let isOnline = false; 
let connectionCheckInterval = null;
let deferredPrompt;

const installBtn = document.createElement('button');
installBtn.id = 'installBtn';
installBtn.textContent = '⬇ установить приложение';

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
  tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
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
    ticketsList.innerHTML = '<div class="ticket-card">нет заявок</div>';
    return;
  }
  
  ticketsList.innerHTML = filtered.map(t => `
    <div class="ticket-card">
      <h3>${escapeHtml(t.title)}</h3>
      <p>${escapeHtml(t.description || 'нет описания')}</p>
      <div class="ticket-meta">
        <span class="priority-badge priority-${t.priority}">${t.priority}</span>
        <span class="date">${new Date(t.createdAt).toLocaleDateString()}</span>
        ${!t.synced ? '<span class="unsynced-badge">⚠️ не синхронизирована</span>' : ''}
      </div>
      <div style="margin-top:10px">
        <button onclick="editTicket(${t.id})" class="edit-btn">✎</button>
        <button onclick="deleteTicket(${t.id})" class="delete-btn">🗑️</button>
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
    modalTitle.textContent = 'редактировать заявку';
    document.getElementById('title').value = t.title;
    document.getElementById('description').value = t.description;
    document.getElementById('priority').value = t.priority;
    modal.style.display = 'block';
  }
}

function updateTicket(id, title, description, priority) {
  const idx = tickets.findIndex(t => t.id === id);
  if (idx !== -1) {
    tickets[idx] = { ...tickets[idx], title, description, priority, synced: false };
    saveTickets();
    saveUnsyncedTicket(tickets[idx]);
    renderTickets();
  }
}

function deleteTicket(id) {
  if (confirm('удалить эту заявку?')) {
    const deleted = tickets.find(t => t.id === id);
    tickets = tickets.filter(t => t.id !== id);
    saveTickets();
    saveUnsyncedTicket({ id: deleted.id, _deleted: true });
    renderTickets();
  }
}

function saveUnsyncedTicket(ticket) {
  let unsynced = JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '[]');
  unsynced = unsynced.filter(t => t.id !== ticket.id);
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
    syncBtn.textContent = n > 0 ? `↺ синхронизировать (${n})` : `синхронизировано`;
  }
}

async function syncWithServer() {
  const unsynced = getUnsyncedTickets();
  if (!unsynced.length) {
    alert('нет данных для синхронизации');
    return;
  }
  
  if (!isOnline) {
    alert('нет соединения с интернетом');
    return;
  }
  
  syncBtn.disabled = true;
  syncBtn.textContent = '↺ синхронизация...';
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const t of unsynced) {
    try {
      if (t._deleted) {
        await fetch(`/api/tickets/${t.id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: t.title,
            description: t.description,
            priority: t.priority,
            createdAt: t.createdAt
          })
        });
        
        const localTicket = tickets.find(lt => lt.id === t.id);
        if (localTicket) localTicket.synced = true;
      }
      successCount++;
    } catch (err) {
      console.error(`Sync error for ${t.id}:`, err);
      errorCount++;
    }
  }
  
  if (errorCount === 0) {
    clearUnsyncedTickets();
    saveTickets();
    renderTickets();
    alert(`✅ синхронизация завершена! отправлено: ${successCount}`);
  } else {
    alert(`⚠️ синхронизация частично завершена. успешно: ${successCount}, ошибок: ${errorCount}`);
  }
  
  syncBtn.disabled = false;
  updateSyncButton();
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
      <span>📝 есть несохранённый черновик</span>
      <button onclick="restoreDraft()">восстановить</button>
      <button onclick="clearDraftAndNotify()">удалить</button>
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 15000);
  }
}

window.restoreDraft = () => {
  loadDraft();
  document.querySelector('.draft-notification')?.remove();
  addTicketBtn.click();
};

window.clearDraftAndNotify = () => {
  clearDraft();
  document.querySelector('.draft-notification')?.remove();
  alert('черновик удалён');
};

async function checkRealConnection() {
  if (!navigator.onLine) {
    console.log('браузер говорит: офлайн');
    isOnline = false;
    updateOnlineStatus();
    return;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      isOnline = true;
      console.log('✅ интернет есть');
    } else {
      isOnline = false;
      console.log('❌ ответ сервера не OK');
    }
    
    updateOnlineStatus();
    
    if (isOnline && getUnsyncedTickets().length > 0) {
      console.log('соединение восстановлено, запускаем синхронизацию...');
      setTimeout(() => syncWithServer(), 1000);
    }
    
  } catch (error) {
    console.log('❌ ошибка соединения:', error.message);
    isOnline = false;
    updateOnlineStatus();
  }
}

function updateOnlineStatus() {
  if (onlineStatus) {
    if (isOnline) {
      onlineStatus.textContent = '🟢 онлайн';
      onlineStatus.className = 'online';
      console.log('Статус обновлен: ОНЛАЙН');
    } else {
      onlineStatus.textContent = '🔴 офлайн';
      onlineStatus.className = 'offline';
      console.log('Статус обновлен: ОФЛАЙН');
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

window.addEventListener('online', () => {
  console.log('Браузерное событие: сеть появилась');
  setTimeout(checkRealConnection, 500);
});

window.addEventListener('offline', () => {
  console.log('Браузерное событие: сеть пропала');
  isOnline = false;
  updateOnlineStatus();
});

window.addEventListener('focus', () => {
  console.log('Окно в фокусе, проверяем соединение');
  checkRealConnection();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('Приложение активно, проверяем соединение');
    checkRealConnection();
  }
});

if ('connection' in navigator) {
  navigator.connection.addEventListener('change', () => {
    console.log('Изменение типа соединения:', navigator.connection.effectiveType);
    checkRealConnection();
  });
}

if (connectionCheckInterval) clearInterval(connectionCheckInterval);
connectionCheckInterval = setInterval(checkRealConnection, 10000);

ticketForm.onsubmit = (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const desc = document.getElementById('description').value;
  const priority = document.getElementById('priority').value;
  
  if (!title.trim()) {
    alert('пожалуйста, введите название заявки');
    return;
  }
  
  if (currentEditId) {
    updateTicket(currentEditId, title, desc, priority);
  } else {
    addTicket(title, desc, priority);
  }
  
  modal.style.display = 'none';
  ticketForm.reset();
  modalTitle.textContent = 'новая заявка';
  clearDraft();
};

addTicketBtn.onclick = () => {
  currentEditId = null;
  modalTitle.textContent = 'новая заявка';
  loadDraft();
  modal.style.display = 'block';
};

clearDraftBtn?.addEventListener('click', () => {
  if (confirm('очистить черновик?')) {
    clearDraft();
    alert('черновик очищен');
  }
});

closeBtn.onclick = () => {
  modal.style.display = 'none';
  ticketForm.reset();
  currentEditId = null;
  clearDraft();
};

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    ticketForm.reset();
    currentEditId = null;
    clearDraft();
  }
};

priorityFilter.onchange = () => renderTickets();
syncBtn?.addEventListener('click', syncWithServer);

['title', 'description', 'priority'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', saveDraft);
});

updateSyncButton();
showDraftNotification();
loadTickets();
checkRealConnection();
