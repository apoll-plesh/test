<?php
function createNote(PDO $pdo, int $userId, string $title, string $body): int {
    $stmt = $pdo->prepare(
        'INSERT INTO notes (user_id, title, body) VALUES (:uid, :title, :body)'
    );
    $stmt->execute([':uid' => $userId, ':title' => $title, ':body' => $body]);
    return (int)$pdo->lastInsertId();
}

function getNotesByUser(PDO $pdo, int $userId): array {
    $stmt = $pdo->prepare(
        'SELECT n.* FROM notes n
         WHERE n.user_id = :uid
         ORDER BY n.is_pinned DESC, n.updated_at DESC'
    );
    $stmt->execute([':uid' => $userId]);
    return $stmt->fetchAll();
}

function getNoteById(PDO $pdo, int $id, int $userId) {
    $stmt = $pdo->prepare('SELECT * FROM notes WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);
    return $stmt->fetch();
}

function updateNote(PDO $pdo, int $id, int $userId, string $title, string $body): int {
    $stmt = $pdo->prepare('UPDATE notes SET title = ?, body = ? WHERE id = ? AND user_id = ?');
    $stmt->execute([$title, $body, $id, $userId]);
    return $stmt->rowCount();
}

function deleteNote(PDO $pdo, int $id, int $userId): int {
    $stmt = $pdo->prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    return $stmt->rowCount();
}

function togglePin(PDO $pdo, int $id, int $userId): int {
    $stmt = $pdo->prepare('UPDATE notes SET is_pinned = NOT is_pinned WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    return $stmt->rowCount();
}
?>