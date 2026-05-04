const STORAGE_KEY = 'student-note';
let notes = [];

const noteInput = document.getElementById('noteInput');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const notesList = document.getElementById('notesList');

function loadNotes() {
    const savedNotes = localStorage.getItem(STORAGE_KEY);
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    } else {
        notes = [];
    }
    renderNotes();
}

function saveNotesToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function saveNote() {
    const noteText = noteInput.value.trim();
    if (noteText === '') {
        alert('введите текст заметки');
        return;
    }
    
    const newNote = {
        id: Date.now(),
        text: noteText,
        date: new Date().toLocaleString('ru-RU')
    };
    
    notes.unshift(newNote);
    saveNotesToStorage();
    noteInput.value = '';
    renderNotes();
    
    saveBtn.textContent = 'сохранено!';
    setTimeout(() => {
        saveBtn.textContent = 'сохранить';
    }, 1500);
}

function clearForm() {
    if (noteInput.value.trim() !== '') {
        if (confirm('очистить поле ввода?')) {
            noteInput.value = '';
        }
    }
}

function deleteNote(id) {
    if (confirm('удалить заметку?')) {
        notes = notes.filter(note => note.id !== id);
        saveNotesToStorage();
        renderNotes();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderNotes() {
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-message">Нет сохранённых заметок</div>';
        return;
    }
    
    let html = '';
    notes.forEach(note => {
        html += `
            <div class="note-item">
                <div class="note-content">${escapeHtml(note.text)}</div>
                <button class="delete-note" data-id="${note.id}">удалить</button>
                <div style="clear: both;"></div>
            </div>
        `;
    });
    
    notesList.innerHTML = html;
    
    document.querySelectorAll('.delete-note').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.getAttribute('data-id'));
            deleteNote(id);
        });
    });
}

saveBtn.addEventListener('click', saveNote);
clearBtn.addEventListener('click', clearForm);
noteInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        saveNote();
    }
});

loadNotes();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(registration => {
          console.log('Service Worker зарегистрирован:', registration.scope);
        })
        .catch(error => {
          console.log('Ошибка регистрации Service Worker:', error);
        });
    });
  }