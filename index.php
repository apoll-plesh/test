<?php
require 'connection.php';
require 'database.php';

$action = $_GET['action'] ?? 'list';
$noteId = $_GET['id'] ?? 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'create') {
        createNote($pdo, $_SESSION['user_id'], $_POST['title'], $_POST['body']);
        header('Location: index.php');
        exit;
    }
    
    if ($action === 'edit' && $noteId) {
        updateNote($pdo, $noteId, $_SESSION['user_id'], $_POST['title'], $_POST['body']);
        header('Location: index.php');
        exit;
    }
}

if ($action === 'delete' && $noteId) {
    deleteNote($pdo, $noteId, $_SESSION['user_id']);
    header('Location: index.php');
    exit;
}

if ($action === 'toggle_pin' && $noteId) {
    togglePin($pdo, $noteId, $_SESSION['user_id']);
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Мои заметки</title>
    <style>
        body {
            margin: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0;
        }
        
        h1 {
            font-size: 1.5em;
            color: #333;
        }
        
        .btn {
            display: inline-block;
            background: #e0e0e0;
            color: #333;
            padding: 6px 12px;
            text-decoration: none;
            border: 1px solid #ccc;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn:hover {
            background: #d0d0d0;
        }
        
        .btn-success {
            background: #4CAF50;
            color: white;
            border-color: #4CAF50;
        }
        
        .btn-success:hover {
            background: #45a049;
        }
        
        .btn-danger {
            background: #f44336;
            color: white;
            border-color: #f44336;
        }
        
        .btn-danger:hover {
            background: #da190b;
        }
        
        .btn-warning {
            background: #e0e0e0;
            color: #333;
        }
        
        .form-card {
            background: white;
            padding: 20px;
            border: 1px solid #ddd;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            font-size: 14px;
            font-family: inherit;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .notes-list {
            margin-top: 20px;
        }
        
        .note-card {
            background: white;
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .note-card.pinned {
            background: #f9f9f9;
            border-left: 3px solid #4CAF50;
        }
        
        .note-title h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .pin-badge {
            background: #e0e0e0;
            padding: 2px 8px;
            font-size: 12px;
            margin-right: 10px;
        }
        
        .note-content {
            color: #555;
            line-height: 1.4;
            margin-bottom: 10px;
        }
        
        .note-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        

        
        .new-note-btn {
            margin-bottom: 20px;
        }
        
        .back-link {
            margin-top: 20px;
        }
        
        hr {
            display: none;
        }
    </style>
</head>
<body>
<div class="container">
    <?php if ($action === 'create'): ?>
    
    <h1>Новая заметка</h1>
    <div class="form-card">
        <form method="POST">
            <div class="form-group">
                <label>Заголовок</label>
                <input type="text" name="title" placeholder="Заголовок">
            </div>
            <div class="form-group">
                <label>Текст</label>
                <textarea name="body" placeholder="Текст заметки" rows="10"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-success">Сохранить</button>
                <a href="index.php" class="btn">Отмена</a>
            </div>
        </form>
    </div>

    <?php elseif ($action === 'edit' && $noteId): 
        $note = getNoteById($pdo, $noteId, $_SESSION['user_id']);
        if (!$note): ?>
            <div class="empty-state">
                <p>Заметка не найдена</p>
                <a href="index.php" class="btn">Назад</a>
            </div>
        <?php else: ?>
    
    <h1>Редактирование</h1>
    <div class="form-card">
        <form method="POST">
            <div class="form-group">
                <label>Заголовок</label>
                <input type="text" name="title" value="<?= htmlspecialchars($note['title']) ?>">
            </div>
            <div class="form-group">
                <label>Текст</label>
                <textarea name="body" rows="10"><?= htmlspecialchars($note['body']) ?></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-success">Обновить</button>
                <a href="index.php" class="btn">Отмена</a>
            </div>
        </form>
    </div>

    <?php endif; ?>

    <?php else: ?>
    
    <h1>Мои заметки</h1>
    
    <div class="new-note-btn">
        <a href="index.php?action=create" class="btn">Новая заметка</a>
    </div>
    
    <?php
    $notes = getNotesByUser($pdo, $_SESSION['user_id']);
    if (empty($notes)): ?>
        <div class="empty-state">
        </div>
    <?php else: ?>
        <div class="notes-list">
            <?php foreach ($notes as $note): ?>
                <div class="note-card <?= $note['is_pinned'] ? 'pinned' : '' ?>">
                    <div class="note-title">
                        <?php if ($note['is_pinned']): ?>
                            <span class="pin-badge">Закреплено</span>
                        <?php endif; ?>
                        <h3><?= htmlspecialchars($note['title'] ?: 'Без названия') ?></h3>
                    </div>
                    <div class="note-content">
                        <?= nl2br(htmlspecialchars(substr($note['body'], 0, 300))) ?>
                        <?php if (strlen($note['body']) > 300): ?>...<?php endif; ?>
                    </div>
                    <div class="note-actions">
                        <a href="index.php?action=edit&id=<?= $note['id'] ?>" class="btn">Редактировать</a>
                        <a href="index.php?action=delete&id=<?= $note['id'] ?>" class="btn btn-danger" onclick="return confirm('Удалить?')">Удалить</a>
                        <a href="index.php?action=toggle_pin&id=<?= $note['id'] ?>" class="btn btn-warning">
                            <?= $note['is_pinned'] ? 'Открепить' : 'Закрепить' ?>
                        </a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <?php endif; ?>
</div>
</body>
</html>