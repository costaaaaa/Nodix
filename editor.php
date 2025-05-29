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
    $title = trim($_POST['mapTitleInput']);
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
    <link href="https://cdn.jsdelivr.net/npm/vis-network@9.1.2/dist/vis-network.min.css" rel="text/plain">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <?php
    include_once './config/database.php';
    insert_logo();
    ?>
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
                        <a class="nav-link" href="dashboard.php"><i class="bi bi-speedometer2 me-1"></i> Dashboard</a>
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
            <div class="col mb-4 mb-md-0">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white border-bottom-0 pt-4">
                        <h4 class="mb-0"><i class="bi bi-pencil-square me-2 text-primary"></i><?php echo $text ? 'Modifica' : 'Nuovo'; ?> Testo</h4>
                    </div>
                    <div class="card-body">
                        <form method="POST" id="textForm">
                            <div class="mb-3">
                                <label for="mapTitleInput" class="form-label">Titolo</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-type-h1"></i></span>
                                    <input type="text" class="form-control" id="mapTitleInput" name="mapTitleInput" value="<?php echo $text ? htmlspecialchars($text['title']) : ''; ?>" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="folder_id" class="form-label">Cartella</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-folder"></i></span>
                                    <select class="form-select" id="folder_id" name="folder_id">
                                        <option value="">Nessuna cartella</option>
                                        <?php foreach ($folders as $folder): ?>
                                            <option value="<?php echo $folder['id']; ?>" <?php echo ($text && $text['folder_id'] == $folder['id']) ? 'selected' : ''; ?>>
                                                <?php echo htmlspecialchars($folder['name']); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="content" class="form-label">Contenuto</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-list-ul"></i></span>
                                    <textarea class="form-control" id="content" name="content" rows="15" required><?php echo $text ? htmlspecialchars($text['content']) : ''; ?></textarea>
                                </div>
                                <small class="text-muted mt-1"><i class="bi bi-info-circle me-1"></i>Usa il tab per creare sottolivelli nell'elenco puntato</small>
                            </div>
                            <div class="d-flex justify-content-between">
                                <button type="button" class="btn btn-primary" id="generateMap"><i class="bi bi-diagram-3 me-2"></i>Genera Mappa</button>
                                <button type="submit" class="btn btn-success"><i class="bi bi-save me-2"></i>Salva</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <br />
        <div class="row mb-5">
            <div class="col">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white border-bottom-0 pt-4 d-flex justify-content-between align-items-center">
                        <h4 class="mb-0"><i class="bi bi-diagram-3 me-2 text-primary"></i>Mappa Concettuale</h4>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="optionsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-gear"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="optionsDropdown">
                                <li>
                                    <h6 class="dropdown-header">Direzione</h6>
                                </li>
                                <li><a class="dropdown-item" href="#" data-direction="UD">Dall'alto al basso</a></li>
                                <li><a class="dropdown-item" href="#" data-direction="DU">Dal basso all'alto</a></li>
                                <li><a class="dropdown-item" href="#" data-direction="LR">Da sinistra a destra</a></li>
                                <li><a class="dropdown-item" href="#" data-direction="RL">Da destra a sinistra</a></li>
                                <li><a class="dropdown-item" href="#" data-direction="UD_CENTER">Centro → Verticale</a></li>
                                <li><a class="dropdown-item" href="#" data-direction="LR_CENTER">Centro → Orizzontale</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body concept-map">

                        <div class="d-flex justify-content-end mb-3">
                            <div class="btn-group me-2" id="nodeDistanceControl">
                                <button class="btn btn-sm btn-outline-secondary" id="nodeDistanceMinus" title="Diminuisci distanza">
                                    <i class="bi bi-dash"></i>
                                </button>
                                <input type="number" min="50" max="400" step="10" id="nodeDistanceValue" class="form-control form-control-sm text-center px-1" value="150" style="width:70px; max-width:70px; height:38px; line-height:1.2; font-size:1.1em; appearance: textfield;">
                                <button class="btn btn-sm btn-outline-secondary" id="nodeDistancePlus" title="Aumenta distanza">
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <div class="btn-group me-2">
                                <button class="btn btn-sm btn-outline-secondary" id="zoomIn" title="Zoom in">
                                    <i class="bi bi-zoom-in"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary" id="zoomOut" title="Zoom out">
                                    <i class="bi bi-zoom-out"></i>
                                </button>
                            </div>
                            <button class="btn btn-sm btn-outline-primary me-2" id="fullscreenBtn" title="Fullscreen">
                                <i class="bi bi-arrows-fullscreen"></i>
                            </button>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-success dropdown-toggle" type="button" id="exportDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-download"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="exportDropdown">
                                    <li><a class="dropdown-item" href="#" id="exportPNG"><i class="bi bi-file-image"></i> Esporta come PNG</a></li>
                                    <li><a class="dropdown-item" href="#" id="exportPDF"><i class="bi bi-file-pdf"></i> Esporta come PDF</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="mb-3" id="mapContainer" class="border rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/map-generator.js"></script>
    <script src="js/text-editor.js"></script>
</body>

</html>