$(document).ready(function() {
    let network = null;
    const container = document.getElementById('mapContainer');
    let isFullscreen = false;

    // Funzione per gestire lo zoom
    function setupZoom() {
        $('#zoomIn').click(function() {
            if (network) {
                const scale = network.getScale();
                network.moveTo({
                    scale: scale * 1.2
                });
            }
        });

        $('#zoomOut').click(function() {
            if (network) {
                const scale = network.getScale();
                network.moveTo({
                    scale: scale * 0.8
                });
            }
        });
    }

    // Funzione per gestire la modalità a schermo intero
    function setupFullscreen() {
        const fullscreenBtn = $('#fullscreenBtn');
        const conceptMap = $('.concept-map')[0]; // Ottieni l'elemento DOM nativo

        fullscreenBtn.click(function() {
            if (!document.fullscreenElement) {
                // Entra in modalità schermo intero
                if (conceptMap.requestFullscreen) {
                    conceptMap.requestFullscreen();
                } else if (conceptMap.webkitRequestFullscreen) { /* Safari */
                    conceptMap.webkitRequestFullscreen();
                } else if (conceptMap.msRequestFullscreen) { /* IE11 */
                    conceptMap.msRequestFullscreen();
                }
            } else {
                // Esci dalla modalità schermo intero
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) { /* Safari */
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { /* IE11 */
                    document.msExitFullscreen();
                }
            }
        });

        // Gestisci i cambiamenti dello stato fullscreen
        document.onfullscreenchange = function() {
            isFullscreen = !!document.fullscreenElement;
            if (isFullscreen) {
                fullscreenBtn.html('<i class="bi bi-fullscreen-exit"></i> Esci');
                // Aggiorna il layout della rete quando si entra in fullscreen
                if (network) {
                    setTimeout(() => {
                        network.fit();
                        network.redraw();
                    }, 100);
                }
            } else {
                fullscreenBtn.html('<i class="bi bi-arrows-fullscreen"></i> Schermo intero');
                 // Aggiorna il layout della rete quando si esce dal fullscreen
                 if (network) {
                    setTimeout(() => {
                        network.fit();
                        network.redraw();
                    }, 100);
                }
            }
        };

        // Gestisci il ridimensionamento della finestra (utile anche in fullscreen)
        $(window).resize(function() {
            if (network) {
                setTimeout(() => {
                    network.fit();
                    network.redraw();
                }, 100);
            }
        });
    }

    // Funzione per esportare la mappa come PNG
    function setupExportPNG() {
        $('#exportPNG').click(function(e) {
            e.preventDefault();
            if (!network) return;

            // Crea un contenitore temporaneo per la cattura
            const tempContainer = $('<div></div>').css({
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: container.offsetWidth + 'px',
                height: container.offsetHeight + 'px',
                backgroundColor: 'white'
            }).appendTo('body');

            // Cattura la mappa
            html2canvas(container, {
                backgroundColor: 'white',
                scale: 2, // Migliore qualità
                logging: false,
                useCORS: true
            }).then(canvas => {
                // Crea il link per il download
                const link = document.createElement('a');
                link.download = 'mappa-concettuale.png';
                link.href = canvas.toDataURL('image/png');
                link.click();

                // Rimuovi il contenitore temporaneo
                tempContainer.remove();
            });
        });
    }

    // Funzione per esportare la mappa come PDF
    function setupExportPDF() {
        $('#exportPDF').click(function(e) {
            e.preventDefault();
            if (!network) return;

            // Crea un contenitore temporaneo per la cattura
            const tempContainer = $('<div></div>').css({
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: container.offsetWidth + 'px',
                height: container.offsetHeight + 'px',
                backgroundColor: 'white'
            }).appendTo('body');

            // Cattura la mappa
            html2canvas(container, {
                backgroundColor: 'white',
                scale: 2, // Migliore qualità
                logging: false,
                useCORS: true
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save('mappa-concettuale.pdf');

                // Rimuovi il contenitore temporaneo
                tempContainer.remove();
            });
        });
    }

    // Funzione per aggiornare la direzione della mappa
    function updateDirection() {
        if (network) {
            const direction = $('#directionSelect').val();
            let options = {
                layout: {
                    hierarchical: {
                        direction: direction.startsWith('UD') ? 'UD' : 
                                 direction.startsWith('DU') ? 'DU' : 
                                 direction.startsWith('LR') ? 'LR' : 'RL',
                        sortMethod: 'directed',
                        levelSeparation: 100,
                        nodeSpacing: 150,
                        treeSpacing: 150,
                        blockShifting: true,
                        edgeMinimization: true,
                        parentCentralization: false
                        // L'opzione 'alignment' non è supportata nella versione attuale di vis.js
                    }
                }
            };
            network.setOptions(options);
        }
    }

    // Inizializza i controlli
    setupZoom();
    setupFullscreen();
    setupExportPNG();
    setupExportPDF();
    $('#directionSelect').change(updateDirection);

    // Aggiungiamo un campo per il titolo della mappa
    if (!$('#mapTitleInput').length) {
        // Verifica quale textarea è presente nella pagina (textInput per sandbox.php o content per editor.php)
        const textareaSelector = $('#textInput').length ? '#textInput' : '#content';
        $('<div class="form-group mb-3"><label for="mapTitleInput">Titolo della mappa:</label><input type="text" class="form-control" id="mapTitleInput" placeholder="Inserisci il titolo della mappa"></div>').insertBefore(textareaSelector);
    }

    $('#generateMap').click(function() {
        const title = $('#mapTitleInput').val() || 'Mappa Concettuale';
        // Ottieni il testo dal textarea corretto (textInput per sandbox.php o content per editor.php)
        const text = $('#textInput').length ? $('#textInput').val() : $('#content').val();
        const nodes = [];
        const edges = [];
        let nodeId = 1;
        let parentStack = [null];
        let levelNodes = {};
        
        // Crea il nodo titolo come nodo principale
        nodes.push({
            id: nodeId,
            label: title,
            level: 1,
            color: {
                background: '#3498db',
                border: '#2980b9',
                highlight: {
                    background: '#2980b9',
                    border: '#2c3e50'
                }
            },
            font: {
                size: 18,
                bold: true
            }
        });
        
        // Aggiorna lo stack dei genitori con il nodo titolo
        parentStack[0] = nodeId;
        nodeId++;

        // Dividi il testo in righe
        const lines = text.split('\n');
        
        lines.forEach(line => {
            if (line.trim() === '') return;

            // Conta gli spazi all'inizio della riga per determinare il livello
            // Incrementiamo di 1 il livello perché il livello 1 è riservato al titolo
            const level = (line.match(/^\s*/)[0].length / 4) + 2;
            const content = line.trim().replace(/^[•\-\*]\s*/, '');

            // Rimuovi i nodi genitori non più necessari, ma mantieni almeno il nodo titolo
            while (parentStack.length > level) {
                parentStack.pop();
            }

            // Crea il nuovo nodo
            nodes.push({
                id: nodeId,
                label: content,
                level: level,
                color: {
                    background: '#ecf0f1',
                    border: '#2c3e50',
                    highlight: {
                        background: '#bdc3c7',
                        border: '#2c3e50'
                    }
                }
            });

            // Crea l'arco collegandolo al genitore appropriato
            // Se il livello è 2 (zero indentazione), collega al nodo titolo (ID 1)
            // Altrimenti, collega al genitore appropriato dallo stack
            const parentId = (level === 2) ? 1 : parentStack[parentStack.length - 1];
            edges.push({
                from: parentId,
                to: nodeId,
                arrows: 'to',
                color: {
                    color: '#7f8c8d',
                    highlight: '#2c3e50'
                }
            });


            // Aggiorna lo stack dei genitori
            // Se il livello è 2, il genitore per i nodi successivi indentati sarà il nodo corrente
            // Altrimenti, aggiorna lo stack normalmente
            if (level === 2) {
                 parentStack[2] = nodeId; // Imposta il nodo corrente come genitore per il livello 3
            } else {
                parentStack.push(nodeId);
            }
            nodeId++;
        });

        // Configurazione della rete
        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };

        const direction = $('#directionSelect').val();
        const options = {
            nodes: {
                shape: 'box',
                margin: 10,
                font: {
                    size: 14
                }
            },
            edges: {
                smooth: {
                    type: 'dynamic',
                    roundness: 0.6
                }
            },
            layout: {
                hierarchical: {
                    direction: direction.startsWith('UD') ? 'UD' : 
                             direction.startsWith('DU') ? 'DU' : 
                             direction.startsWith('LR') ? 'LR' : 'RL',
                    sortMethod: 'directed',
                    levelSeparation: 250,
                    nodeSpacing: 300,
                    treeSpacing: 300,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: false
                }
            },
            physics: {
                enabled: false,
                stabilization: {
                    enabled: true,
                    iterations: 500,
                    updateInterval: 50
                },
                hierarchicalRepulsion: {
                    nodeDistance: 300,
                    centralGravity: 0.1,
                    springLength: 300,
                    springConstant: 0.01
                },
                solver: 'hierarchicalRepulsion'
            },
            interaction: {
                dragNodes: true, // Abilita il trascinamento dei nodi
                zoomView: false, // Disabilita lo zoom con la rotella del mouse
                dragView: true
            }
        };

        // Se è selezionata una modalità centrata, modifica il layout
        if (direction.includes('CENTER')) {
            // Trova il nodo radice (id: 1)
            const rootNode = nodes.find(n => n.id === 1);
            if (rootNode) {
                // Imposta il nodo radice al centro
                rootNode.x = 0;
                rootNode.y = 0;
                rootNode.fixed = true;

                // Modifica il layout per i nodi figli
                options.layout.hierarchical = {
                    direction: direction === 'UD_CENTER' ? 'UD' : 'LR',
                    sortMethod: 'directed',
                    levelSeparation: 300,
                    nodeSpacing: 350,
                    treeSpacing: 250,
                    blockShifting: false,
                    edgeMinimization: false,
                    parentCentralization: false
                    // L'opzione 'alignment' non è supportata nella versione attuale di vis.js
                };

                // Aggiungi una funzione di callback per posizionare i nodi
                options.layout.hierarchical.getPositions = function(nodeId, level, nodes, edges) {
                    if (nodeId === 1) return { x: 0, y: 0 };
                    
                    const parent = edges.find(e => e.to === nodeId)?.from;
                    if (!parent) return null;

                    const parentNode = nodes.find(n => n.id === parent);
                    if (!parentNode) return null;

                    const isVertical = direction === 'UD_CENTER';
                    const offset = level * 200;
                    
                    return {
                        x: isVertical ? parentNode.x : (parentNode.x + offset),
                        y: isVertical ? (parentNode.y + offset) : parentNode.y
                    };
                };
            }
        }

        // Crea o aggiorna la rete
        if (network !== null) {
            network.destroy();
        }
        network = new vis.Network(container, data, options);

        // Dopo la stabilizzazione, disabilita la fisica e blocca il layout
        network.once('stabilized', function() {
            network.setOptions({
                layout: {
                    hierarchical: {
                        enabled: false
                    }
                },
                physics: {
                    enabled: false
                }
            });
        });
            });
    });
