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
    $stmt = $conn->prepare("SELECT * FROM NODIX_texts WHERE id = ? AND user_id = ?");
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
        $map_state = !empty($_POST['map_state']) ? $_POST['map_state'] : null;
        // Valida che sia JSON valido prima di salvare
        if ($map_state !== null && json_decode($map_state) === null) {
            $map_state = null;
        }

        if (isset($_GET['id'])) {
            // Aggiorna il testo esistente
            $stmt = $conn->prepare("UPDATE NODIX_texts SET title = ?, content = ?, folder_id = ?, map_state = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$title, $content, $folder_id, $map_state, $_GET['id'], $_SESSION['user_id']]);
        } else {
            // Crea un nuovo testo
            $stmt = $conn->prepare("INSERT INTO NODIX_texts (user_id, title, content, folder_id, map_state) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$_SESSION['user_id'], $title, $content, $folder_id, $map_state]);
        }
        header("Location: dashboard.php");
        exit();
    }
}

// Recupera le cartelle dell'utente
$stmt = $conn->prepare("SELECT * FROM NODIX_folders WHERE user_id = ? ORDER BY name");
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
    <script src="js/d3.min.js"></script>
    <script src="js/markmap-view.js"></script>
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
                            <input type="hidden" name="map_state" id="map_state">
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
                    <div class="card-header bg-white border-bottom-0 pt-4">
                        <h4 class="mb-0"><i class="bi bi-diagram-3 me-2 text-primary"></i>Mappa Concettuale</h4>
                    </div>
                    <div class="card-body concept-map">

                        <div class="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
                            <!-- Livello espansione -->
                            <div class="btn-group" id="expandLevelControl" title="Livello espansione iniziale">
                                <button class="btn btn-sm btn-outline-secondary" id="expandLevelMinus" title="Comprimi un livello"><i class="bi bi-dash"></i></button>
                                <span class="btn btn-sm btn-outline-secondary disabled" id="expandLevelDisplay" style="min-width:36px;pointer-events:none">2</span>
                                <button class="btn btn-sm btn-outline-secondary" id="expandLevelPlus" title="Espandi un livello"><i class="bi bi-plus"></i></button>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary" id="expandAllBtn" title="Espandi tutto"><i class="bi bi-node-plus"></i></button>
                            <button class="btn btn-sm btn-outline-secondary" id="collapseAllBtn" title="Comprimi tutto"><i class="bi bi-node-minus"></i></button>

                            <div class="toolbar-sep"></div>

                            <!-- Distanza nodi -->
                            <div class="btn-group" id="nodeDistanceControl" title="Spaziatura nodi">
                                <button class="btn btn-sm btn-outline-secondary" id="nodeDistanceMinus" title="Diminuisci spaziatura"><i class="bi bi-dash"></i></button>
                                <input type="number" min="20" max="400" step="10" id="nodeDistanceValue" class="form-control form-control-sm text-center px-1" value="80" style="width:60px;height:31px;appearance:textfield">
                                <button class="btn btn-sm btn-outline-secondary" id="nodeDistancePlus" title="Aumenta spaziatura"><i class="bi bi-plus"></i></button>
                            </div>

                            <div class="toolbar-sep"></div>

                            <!-- Zoom + Fit -->
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary" id="zoomOut" title="Zoom out"><i class="bi bi-zoom-out"></i></button>
                                <button class="btn btn-sm btn-outline-secondary" id="fitMapBtn" title="Adatta alla finestra"><i class="bi bi-aspect-ratio"></i></button>
                                <button class="btn btn-sm btn-outline-secondary" id="zoomIn" title="Zoom in"><i class="bi bi-zoom-in"></i></button>
                            </div>

                            <!-- Fullscreen -->
                            <button class="btn btn-sm btn-outline-primary" id="fullscreenBtn" title="Schermo intero"><i class="bi bi-arrows-fullscreen"></i></button>

                            <!-- Export -->
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-success dropdown-toggle" type="button" id="exportDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-download"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="exportDropdown">
                                    <li><a class="dropdown-item" href="#" id="exportPNG"><i class="bi bi-file-image me-1"></i>Esporta PNG</a></li>
                                    <li><a class="dropdown-item" href="#" id="exportPDF"><i class="bi bi-file-pdf me-1"></i>Esporta PDF</a></li>
                                </ul>
                            </div>
                        </div>
                        <div id="mapContainer"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <?php
    // Inietta lo stato della mappa salvato come variabile JS (sicuro via json_encode)
    $savedMapState = ($text && !empty($text['map_state'])) ? json_decode($text['map_state']) : null;
    ?>
    <script>window.NODIX_MAP_STATE = <?php echo json_encode($savedMapState, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;</script>
    <script src="js/map-generator.js"></script>
    <script src="js/text-editor.js"></script>
</body>

</html>