<?php
session_start();
?>
<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sandbox - Nodix</title>
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
                        <a class="nav-link active" href="sandbox.php"><!--<i class="bi bi-box"></i>--> Sandbox</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="login.php"> <!--<i class="bi bi-box-arrow-in-right"></i>--> Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="register.php"><!--<i class="bi bi-person-plus"></i>--> Registrati</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <div class="row mb-4">
            <div class="col-12 text-center mb-4">
                <h2 class="fw-bold">Sandbox Nodix</h2>
                <p class="lead text-muted">Prova subito a creare la tua mappa concettuale</p>
            </div>
        </div>

        <div class="row mb-5">
            <div class="col mb-4 mb-lg-0">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white border-bottom-0 pt-4">
                        <h4 class="mb-0"><i class="bi bi-pencil-square me-2 text-primary"></i>Editor di testo</h4>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-3">Inserisci il tuo testo con elenchi puntati. Usa il tab per creare sottolivelli.</p>
                        <div class="mb-3">
                            <input type="text" id="mapTitleInput" class="form-control" placeholder="Titolo della mappa (opzionale)">
                        </div>
                        <textarea id="textInput" class="form-control border" rows="14" placeholder="• Elemento principale&#10;    • Sottoelemento&#10;        • Sottosottoelemento"></textarea>
                        <button id="generateMap" class="btn btn-primary mt-3 w-100">
                            <i class="bi bi-diagram-3 me-2"></i>Genera Mappa
                        </button>
                    </div>
                </div>
            </div>
        </div>


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

    <br /><br />

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/map-generator.js"></script>
    <script src="js/text-editor.js"></script>
</body>

</html>