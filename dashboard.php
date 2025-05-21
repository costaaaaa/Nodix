<?php
session_start();
require_once 'config/database.php';

// Verifica se l'utente è loggato
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// Gestione delle cartelle
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'create_folder':
                $folder_name = trim($_POST['folder_name']);
                if (!empty($folder_name)) {
                    $stmt = $conn->prepare("INSERT INTO folders (user_id, name) VALUES (?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $folder_name]);
                }
                break;
            
            case 'save_text':
                $text_content = $_POST['text_content'];
                $folder_id = $_POST['folder_id'] ?? null;
                $title = trim($_POST['title']);
                
                if (!empty($text_content) && !empty($title)) {
                    $stmt = $conn->prepare("INSERT INTO texts (user_id, folder_id, title, content) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $folder_id, $title, $text_content]);
                }
                break;
        }
    }
}

// Recupera le cartelle dell'utente
$stmt = $conn->prepare("SELECT * FROM folders WHERE user_id = ? ORDER BY name");
$stmt->execute([$_SESSION['user_id']]);
$folders = $stmt->fetchAll();

// Recupera i testi dell'utente
$stmt = $conn->prepare("
    SELECT t.*, f.name as folder_name 
    FROM texts t 
    LEFT JOIN folders f ON t.folder_id = f.id 
    WHERE t.user_id = ? 
    ORDER BY t.created_at DESC
");
$stmt->execute([$_SESSION['user_id']]);
$texts = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Nodix</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="index.php">Nodix</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="sandbox.php">Sandbox</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <!-- Sidebar con le cartelle -->
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Le tue cartelle</h5>
                        <form method="POST" class="mb-3">
                            <input type="hidden" name="action" value="create_folder">
                            <div class="input-group">
                                <input type="text" class="form-control" name="folder_name" placeholder="Nuova cartella">
                                <button type="submit" class="btn btn-primary">+</button>
                            </div>
                        </form>
                        <div class="list-group">
                            <?php foreach ($folders as $folder): ?>
                                <a href="#" class="list-group-item list-group-item-action folder" data-folder-id="<?php echo $folder['id']; ?>">
                                    <?php echo htmlspecialchars($folder['name']); ?>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Area principale -->
            <div class="col-md-9">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">I tuoi testi</h5>
                        <div class="mb-3">
                            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newTextModal">
                                Nuovo testo
                            </button>
                        </div>
                        <div class="list-group">
                            <?php foreach ($texts as $text): ?>
                                <div class="list-group-item">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h5 class="mb-1"><?php echo htmlspecialchars($text['title']); ?></h5>
                                        <small>
                                            <?php if ($text['folder_name']): ?>
                                                Cartella: <?php echo htmlspecialchars($text['folder_name']); ?>
                                            <?php endif; ?>
                                        </small>
                                    </div>
                                    <p class="mb-1"><?php echo nl2br(htmlspecialchars(substr($text['content'], 0, 200))); ?>...</p>
                                    <div class="btn-group">
                                        <a href="editor.php?id=<?php echo $text['id']; ?>" class="btn btn-sm btn-outline-primary">Modifica</a>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteText(<?php echo $text['id']; ?>)">Elimina</button>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal per nuovo testo -->
    <div class="modal fade" id="newTextModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Nuovo testo</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form method="POST" id="newTextForm">
                        <input type="hidden" name="action" value="save_text">
                        <div class="mb-3">
                            <label for="title" class="form-label">Titolo</label>
                            <input type="text" class="form-control" id="title" name="title" required>
                        </div>
                        <div class="mb-3">
                            <label for="folder_id" class="form-label">Cartella</label>
                            <select class="form-select" id="folder_id" name="folder_id">
                                <option value="">Nessuna cartella</option>
                                <?php foreach ($folders as $folder): ?>
                                    <option value="<?php echo $folder['id']; ?>"><?php echo htmlspecialchars($folder['name']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="text_content" class="form-label">Contenuto</label>
                            <textarea class="form-control" id="text_content" name="text_content" rows="10" required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="submit" form="newTextForm" class="btn btn-primary">Salva</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function deleteText(textId) {
            if (confirm('Sei sicuro di voler eliminare questo testo?')) {
                // Implementare la logica di eliminazione
            }
        }

        // Gestione della selezione delle cartelle
        $('.folder').click(function(e) {
            e.preventDefault();
            $('.folder').removeClass('active');
            $(this).addClass('active');
            // Implementare il filtraggio dei testi per cartella
        });
    </script>
</body>
</html> 