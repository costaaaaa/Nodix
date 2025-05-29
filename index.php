<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nodix - Organizza le tue idee, visualizza il tuo sapere</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
    <?php
    include_once './config/database.php';
    insert_logo();
    ?>
</head>

<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark">
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
                        <a class="nav-link" href="login.php">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="register.php">Registrati</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <header class="hero-section py-5">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6 text-center text-lg-start">
                    <h1 class="display-4 fw-bold mb-4">Nodix</h1>
                    <p class="lead mb-4">Organizza le tue idee, visualizza il tuo sapere</p>
                    <p class="mb-5">Trasforma i tuoi appunti in mappe concettuali interattive. Semplifica la comprensione e la memorizzazione di concetti complessi.</p>
                    <div class="d-grid gap-2 d-sm-flex justify-content-sm-start">
                        <a href="sandbox.php" class="btn btn-primary btn-lg px-4 gap-3">Prova Nodix</a>
                        <a href="register.php" class="btn btn-outline-secondary btn-lg px-4">Registrati</a>
                    </div>
                </div>
                <div class="col-lg-6 d-none d-lg-block text-center mt-4 mt-lg-0">
                    <img src="./media/mappa-concettuale.png" alt="Esempio di mappa concettuale" class="img-fluid rounded shadow-lg">
                </div>
            </div>
        </div>
    </header>

    <section class="features py-5">
        <div class="container">
            <h2 class="text-center mb-5">Come funziona Nodix</h2>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="feature-card p-4 text-center">
                        <div class="feature-icon mb-3">
                            <i class="bi bi-pencil-square fs-1"></i>
                        </div>
                        <h3>Scrivi</h3>
                        <p>Inserisci il tuo testo strutturato con elenchi puntati e sottolivelli.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card p-4 text-center">
                        <div class="feature-icon mb-3">
                            <i class="bi bi-diagram-3 fs-1"></i>
                        </div>
                        <h3>Visualizza</h3>
                        <p>Genera automaticamente mappe concettuali interattive dai tuoi appunti.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card p-4 text-center">
                        <div class="feature-icon mb-3">
                            <i class="bi bi-share fs-1"></i>
                        </div>
                        <h3>Condividi</h3>
                        <p>Esporta le tue mappe in formato PNG o PDF per condividerle facilmente.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="cta-section py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-10 col-lg-8 text-center">
                    <h2 class="mb-4 text-light">Pronto a organizzare le tue idee?</h2>
                    <p class="lead mb-4 text-light">Prova subito Nodix nella modalità sandbox senza registrazione o crea un account per salvare i tuoi progetti.</p>
                    <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
                        <a href="sandbox.php" class="btn btn-light btn-lg px-4 gap-3">Prova Nodix</a>
                        <a href="register.php" class="btn btn-outline-light btn-lg px-4">Registrati</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="footer py-4">
        <div class="container">
            <div class="row">
                <div class="col-12 text-center">
                    <p class="mb-0">© 2025 Nodix - Tutti i diritti riservati</p>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>