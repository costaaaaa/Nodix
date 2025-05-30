<?php
session_start();
require_once 'config/database.php';

// Verifica se l'utente è loggato
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// Gestione delle richieste AJAX per eliminazione
if (isset($_GET['action']) && $_GET['action'] === 'delete_text' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');

    // Verifica che sia stata fornita l'ID del testo
    if (!isset($_POST['text_id']) || !is_numeric($_POST['text_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID testo non valido']);
        exit();
    }

    $text_id = (int)$_POST['text_id'];
    $user_id = $_SESSION['user_id'];

    try {
        // Verifica che il testo appartenga all'utente corrente
        $stmt = $conn->prepare("SELECT id FROM NODIX_texts WHERE id = ? AND user_id = ?");
        $stmt->execute([$text_id, $user_id]);

        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Testo non trovato o non autorizzato']);
            exit();
        }

        // Elimina il testo
        $stmt = $conn->prepare("DELETE FROM NODIX_texts WHERE id = ? AND user_id = ?");
        $stmt->execute([$text_id, $user_id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Testo eliminato con successo']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Errore durante l\'eliminazione']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Errore del database']);
    }
    exit();
}

// Gestione delle cartelle e testi
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['action'])) {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'create_folder':
                $folder_name = trim($_POST['folder_name']);
                if (!empty($folder_name)) {
                    $stmt = $conn->prepare("INSERT INTO NODIX_folders (user_id, name) VALUES (?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $folder_name]);
                }
                break;

            case 'save_text':
                $text_content = $_POST['text_content'];
                $folder_id = $_POST['folder_id'] ?? null;
                $title = trim($_POST['title']);

                if (!empty($text_content) && !empty($title)) {
                    $stmt = $conn->prepare("INSERT INTO NODIX_texts (user_id, folder_id, title, content) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $folder_id, $title, $text_content]);
                }
                break;
        }
    }
}

// Recupera le cartelle dell'utente
$stmt = $conn->prepare("SELECT * FROM NODIX_folders WHERE user_id = ? ORDER BY name");
$stmt->execute([$_SESSION['user_id']]);
$folders = $stmt->fetchAll();

// Recupera i testi dell'utente
$stmt = $conn->prepare("
    SELECT t.*, f.name as folder_name 
    FROM NODIX_texts t 
    LEFT JOIN NODIX_folders f ON t.folder_id = f.id 
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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        .folder.active {
            background-color: #e7f3ff !important;
            border-color: #007bff !important;
            color: #007bff !important;
        }

        .folder.active i {
            color: #007bff !important;
        }

        .text-item-hidden {
            display: none !important;
        }
    </style>
</head>

<body>
    <nav class="navbar navbar-expand-lg navbar-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">Nodix</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="dashboard.php"><i class="bi bi-speedometer2 me-1"></i> Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php"><i class="bi bi-box-arrow-right me-1"></i> Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container py-4">
        <div class="row">
            <!-- Sidebar con le cartelle -->
            <div class="col-md-3 mb-4 mb-md-0">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white border-bottom-0 pt-4">
                        <h4 class="mb-0"><i class="bi bi-folder me-2 text-primary"></i>Le tue cartelle</h4>
                    </div>
                    <div class="card-body">
                        <form method="POST" class="mb-4">
                            <input type="hidden" name="action" value="create_folder">
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-folder-plus"></i></span>
                                <input type="text" class="form-control" name="folder_name" placeholder="Nuova cartella">
                                <button type="submit" class="btn btn-primary"><i class="bi bi-plus"></i></button>
                            </div>
                        </form>
                        <div class="list-group list-group-flush">
                            <a href="#" class="list-group-item list-group-item-action folder border-0 ps-0" onclick="showAllTexts()">
                                <i class="bi bi-collection me-2 text-primary"></i>Tutti i testi
                            </a>
                            <?php foreach ($folders as $folder): ?>
                                <a href="#" class="list-group-item list-group-item-action folder border-0 ps-0" data-folder-id="<?php echo $folder['id']; ?>">
                                    <i class="bi bi-folder2 me-2 text-primary"></i><?php echo htmlspecialchars($folder['name']); ?>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Area principale -->
            <div class="col-md-9">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white border-bottom-0 pt-4 d-flex justify-content-between align-items-center">
                        <h4 class="mb-0"><i class="bi bi-file-text me-2 text-primary"></i>I tuoi testi</h4>
                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newTextModal">
                            <i class="bi bi-plus-lg me-2"></i>Nuovo testo
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="list-group">
                            <?php foreach ($texts as $text): ?>
                                <div class="list-group-item border mb-3 rounded shadow-sm" data-folder-id="<?php echo $text['folder_id'] ?? ''; ?>">
                                    <div class="d-flex w-100 justify-content-between align-items-center mb-2">
                                        <h5 class="mb-0 fw-bold"><?php echo htmlspecialchars($text['title']); ?></h5>
                                        <?php if ($text['folder_name']): ?>
                                            <span class="badge bg-light text-dark border">
                                                <i class="bi bi-folder me-1"></i><?php echo htmlspecialchars($text['folder_name']); ?>
                                            </span>
                                        <?php endif; ?>
                                    </div>
                                    <p class="mb-3 text-muted"><?php echo nl2br(htmlspecialchars(substr($text['content'], 0, 200))); ?>...</p>
                                    <div class="d-flex justify-content-end">
                                        <a href="editor.php?id=<?php echo $text['id']; ?>" class="btn btn-sm btn-outline-primary me-2">
                                            <i class="bi bi-pencil me-1"></i>Modifica
                                        </a>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteText(<?php echo $text['id']; ?>)">
                                            <i class="bi bi-trash me-1"></i>Elimina
                                        </button>
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
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-0">
                    <h5 class="modal-title"><i class="bi bi-file-earmark-plus me-2 text-primary"></i>Nuovo testo</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form method="POST" id="newTextForm">
                        <input type="hidden" name="action" value="save_text">
                        <div class="mb-3">
                            <label for="title" class="form-label">Titolo</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-type-h1"></i></span>
                                <input type="text" class="form-control" id="title" name="title" placeholder="Inserisci il titolo" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="folder_id" class="form-label">Cartella</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-folder"></i></span>
                                <select class="form-select" id="folder_id" name="folder_id">
                                    <option value="">Nessuna cartella</option>
                                    <?php foreach ($folders as $folder): ?>
                                        <option value="<?php echo $folder['id']; ?>"><?php echo htmlspecialchars($folder['name']); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="text_content" class="form-label">Contenuto</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-list-ul"></i></span>
                                <textarea class="form-control" id="text_content" name="text_content" rows="10" placeholder="Inserisci il contenuto usando elenchi puntati" required></textarea>
                            </div>
                            <small class="text-muted mt-1"><i class="bi bi-info-circle me-1"></i>Usa il tab per creare sottolivelli nell'elenco puntato</small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal"><i class="bi bi-x me-1"></i>Annulla</button>
                    <button type="submit" form="newTextForm" class="btn btn-primary"><i class="bi bi-save me-1"></i>Salva</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/text-editor.js"></script>
    <script>
        function deleteText(textId) {
            if (confirm('Sei sicuro di voler eliminare questo testo?')) {
                // Mostra un indicatore di caricamento
                const button = event.target.closest('button');
                const originalContent = button.innerHTML;
                button.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Eliminando...';
                button.disabled = true;

                $.ajax({
                    url: 'dashboard.php?action=delete_text',
                    type: 'POST',
                    data: {
                        text_id: textId
                    },
                    dataType: 'json',
                    success: function(response) {
                        if (response.success) {
                            // Rimuovi l'elemento dalla pagina con animazione
                            $(`button[onclick="deleteText(${textId})"]`)
                                .closest('.list-group-item')
                                .fadeOut(300, function() {
                                    $(this).remove();
                                });

                            // Mostra messaggio di successo
                            showAlert('success', response.message);
                        } else {
                            // Ripristina il pulsante e mostra errore
                            button.innerHTML = originalContent;
                            button.disabled = false;
                            showAlert('danger', response.message);
                        }
                    },
                    error: function(xhr, status, error) {
                        // Ripristina il pulsante e mostra errore
                        button.innerHTML = originalContent;
                        button.disabled = false;

                        let errorMessage = 'Errore durante l\'eliminazione del testo';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMessage = xhr.responseJSON.message;
                        }
                        showAlert('danger', errorMessage);
                    }
                });
            }
        }

        // Funzione per mostrare alert Bootstrap
        function showAlert(type, message) {
            const alertHtml = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;

            // Inserisce l'alert all'inizio del container
            $('.container.py-4').prepend(alertHtml);

            // Rimuove automaticamente l'alert dopo 5 secondi
            setTimeout(function() {
                $('.alert').fadeOut();
            }, 5000);
        }

        // Gestione della selezione delle cartelle
        $('.folder').click(function(e) {
            e.preventDefault();
            $('.folder').removeClass('active');
            $(this).addClass('active');

            const folderId = $(this).data('folder-id');
            filterTextsByFolder(folderId);
        });

        // Funzione per filtrare i testi per cartella
        function filterTextsByFolder(folderId) {
            // Seleziona solo gli elementi testo nell'area principale, non le cartelle nella sidebar
            const textItems = $('.col-md-9 .list-group .list-group-item');

            if (!folderId) {
                // Se nessuna cartella è selezionata, mostra tutti i testi
                textItems.show();
                //updateTextCount(textItems.length);
                return;
            }

            let visibleCount = 0;

            textItems.each(function() {
                const textFolderId = $(this).data('folder-id');

                if (textFolderId == folderId) {
                    $(this).show();
                    visibleCount++;
                } else {
                    $(this).hide();
                }
            });

            //updateTextCount(visibleCount);

            // Se non ci sono testi nella cartella selezionata
            if (visibleCount === 0) {
                showEmptyFolderMessage();
            } else {
                hideEmptyFolderMessage();
            }
        }

        // Funzione per aggiornare il conteggio dei testi visibili
        function updateTextCount(count) {
            const header = $('.card-header h4');
            const originalText = header.html().split(' (')[0]; // Rimuove il conteggio precedente se presente

            if (count > 0) {
                header.html(`${originalText} (${count} testo${count !== 1 ? 'i' : ''})`);
            } else {
                header.html(originalText);
            }
        }

        // Funzione per mostrare il messaggio di cartella vuota
        function showEmptyFolderMessage() {
            hideEmptyFolderMessage(); // Rimuove il messaggio precedente se esiste

            const emptyMessage = `
                <div class="alert alert-info text-center" id="emptyFolderMessage">
                    <i class="bi bi-folder2-open me-2"></i>
                    Questa cartella non contiene ancora nessun testo.
                    <br>
                    <small class="text-muted">Crea un nuovo testo e assegnalo a questa cartella.</small>
                </div>
            `;

            $('.list-group').prepend(emptyMessage);
        }

        // Funzione per nascondere il messaggio di cartella vuota
        function hideEmptyFolderMessage() {
            $('#emptyFolderMessage').remove();
        }

        // Pulsante per mostrare tutti i testi
        function showAllTexts() {
            $('.folder').removeClass('active');
            filterTextsByFolder(null);
            hideEmptyFolderMessage();
        }
    </script>
</body>

</html>