<?php
session_start();
require_once 'config/database.php';

// Verifica se l'utente è loggato
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// Recupera il testo se viene specificato un ID
$text = null;
if (isset($_GET['id'])) {
    $stmt = $conn->prepare("SELECT * FROM texts WHERE id = ? AND user_id = ?");
    $stmt->execute([$_GET['id'], $_SESSION['user_id']]);
    $text = $stmt->fetch();
    
    if (!$text) {
        header("Location: dashboard.php");
        exit();
    }
}

// Gestione del salvataggio
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title']);
    $content = $_POST['content'];
    $folder_id = $_POST['folder_id'] ?? null;
    
    if (!empty($title) && !empty($content)) {
        if (isset($_GET['id'])) {
            // Aggiorna il testo esistente
            $stmt = $conn->prepare("UPDATE texts SET title = ?, content = ?, folder_id = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$title, $content, $folder_id, $_GET['id'], $_SESSION['user_id']]);
        } else {
            // Crea un nuovo testo
            $stmt = $conn->prepare("INSERT INTO texts (user_id, title, content, folder_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$_SESSION['user_id'], $title, $content, $folder_id]);
        }
        header("Location: dashboard.php");
        exit();
    }
}

// Recupera le cartelle dell'utente
$stmt = $conn->prepare("SELECT * FROM folders WHERE user_id = ? ORDER BY name");
$stmt->execute([$_SESSION['user_id']]);
$folders = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $text ? 'Modifica' : 'Nuovo'; ?> Testo - Nodix</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/vis-network@9.1.2/dist/vis-network.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/vis-network@9.1.2/dist/vis-network.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
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
                        <a class="nav-link" href="dashboard.php">Dashboard</a>
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
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title"><?php echo $text ? 'Modifica' : 'Nuovo'; ?> Testo</h5>
                        <form method="POST" id="textForm">
                            <div class="mb-3">
                                <label for="title" class="form-label">Titolo</label>
                                <input type="text" class="form-control" id="title" name="title" value="<?php echo $text ? htmlspecialchars($text['title']) : ''; ?>" required>
                            </div>
                            <div class="mb-3">
                                <label for="folder_id" class="form-label">Cartella</label>
                                <select class="form-select" id="folder_id" name="folder_id">
                                    <option value="">Nessuna cartella</option>
                                    <?php foreach ($folders as $folder): ?>
                                        <option value="<?php echo $folder['id']; ?>" <?php echo ($text && $text['folder_id'] == $folder['id']) ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($folder['name']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="content" class="form-label">Contenuto</label>
                                <textarea class="form-control" id="content" name="content" rows="15" required><?php echo $text ? htmlspecialchars($text['content']) : ''; ?></textarea>
                                <small class="text-muted">Usa il tab per creare sottolivelli nell'elenco puntato</small>
                            </div>
                            <div class="d-flex justify-content-between">
                                <button type="button" class="btn btn-primary" id="generateMap">Genera Mappa</button>
                                <button type="submit" class="btn btn-success">Salva</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Mappa Concettuale</h5>
                        <div class="d-flex justify-content-end mb-2">
                            <select class="form-select form-select-sm me-2" id="directionSelect" style="width: auto;">
                                <option value="UD">Dall'alto al basso</option>
                                <option value="DU">Dal basso all'alto</option>
                                <option value="LR">Da sinistra a destra</option>
                                <option value="RL">Da destra a sinistra</option>
                                <option value="UD_CENTER">Centro → Verticale</option>
                                <option value="LR_CENTER">Centro → Orizzontale</option>
                            </select>
                            <button class="btn btn-sm btn-outline-secondary me-2" id="zoomIn">+</button>
                            <button class="btn btn-sm btn-outline-secondary me-2" id="zoomOut">-</button>
                            <button class="btn btn-sm btn-outline-primary me-2" id="fullscreenBtn">
                                <i class="bi bi-arrows-fullscreen"></i> Schermo intero
                            </button>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-success dropdown-toggle" type="button" id="exportDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-download"></i> Esporta
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="exportDropdown">
                                    <li><a class="dropdown-item" href="#" id="exportPNG"><i class="bi bi-file-image"></i> Esporta come PNG</a></li>
                                    <li><a class="dropdown-item" href="#" id="exportPDF"><i class="bi bi-file-pdf"></i> Esporta come PDF</a></li>
                                </ul>
                            </div>
                        </div>
                        <div id="mapContainer" style="height: 600px;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/map-generator.js"></script>
    <script>
        // Gestione del tab nell'editor
        document.getElementById('content').addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
    </script>
</body>
</html> 