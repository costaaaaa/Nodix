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
    <script src="https://cdn.jsdelivr.net/npm/vis-network@9.1.2/dist/vis-network.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/vis-network@9.1.2/dist/vis-network.min.css" rel="style">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
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
                        <textarea id="textInput" class="form-control border" rows="15" placeholder="• Elemento principale&#10;    • Sottoelemento&#10;        • Sottosottoelemento"></textarea>
                        <button id="generateMap" class="btn btn-primary mt-4 w-100">
                            <i class="bi bi-diagram-3 me-2"></i>Genera Mappa
                        </button>
                    </div>
                </div>
            </div>
        </div>


        <div class="row mb-5">
            <div class="col">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white border-bottom-0 pt-4 d-flex justify-content-between align-items-center">
                        <h4 class="mb-0"><i class="bi bi-diagram-3 me-2 text-primary"></i>Mappa Concettuale</h4>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="optionsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-gear"></i> Opzioni
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
                            <div class="btn-group me-2">
                                <button class="btn btn-sm btn-outline-secondary" id="zoomIn"><i class="bi bi-zoom-in"></i></button>
                                <button class="btn btn-sm btn-outline-secondary" id="zoomOut"><i class="bi bi-zoom-out"></i></button>
                            </div>
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
                        <br />
                        <div id="mapContainer" class="border rounded"></div>
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