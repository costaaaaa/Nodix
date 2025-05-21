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
                        <a class="nav-link active" href="sandbox.php">Sandbox</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="login.php">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="register.php">Registrati</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col">
                <div class="text-editor">
                    <h3>Editor di testo</h3>
                    <p class="text-muted">Inserisci il tuo testo con elenchi puntati. Usa il tab per creare sottolivelli.</p>
                    <textarea id="textInput" class="form-control" rows="15" placeholder="• Elemento principale&#10;    • Sottoelemento&#10;        • Sottosottoelemento"></textarea>
                    <button id="generateMap" class="btn btn-primary mt-3">Genera Mappa</button>
                </div>
            </div>
            
        </div>
        <div class="row">
            <div class="col">
                <div class="concept-map">
                    <h3>Mappa Concettuale</h3>
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
                    <div id="mapContainer" style="height: 500px;"></div>
                </div>
            </div>
        </div>
    </div>

    <br/><br/>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/map-generator.js"></script>
    <script>
        // Previeni il comportamento del tab
        document.getElementById('textInput').addEventListener('keydown', function(e) {
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