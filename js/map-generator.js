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
        $('#fullscreenBtn').click(function() {
            const conceptMap = $('.concept-map');
            
            if (!isFullscreen) {
                // Salva la posizione originale
                conceptMap.data('original-parent', conceptMap.parent());
                conceptMap.data('original-index', conceptMap.index());
                
                // Crea un contenitore a schermo intero
                const fullscreenContainer = $('<div class="fullscreen-map"></div>');
                conceptMap.appendTo(fullscreenContainer);
                fullscreenContainer.appendTo('body');
                
                // Aggiorna il layout della rete
                if (network) {
                    setTimeout(() => {
                        network.fit();
                        network.redraw();
                    }, 100);
                }
                
                isFullscreen = true;
                $(this).html('<i class="bi bi-fullscreen-exit"></i> Esci');
            } else {
                // Ripristina la posizione originale
                const originalParent = conceptMap.data('original-parent');
                const originalIndex = conceptMap.data('original-index');
                conceptMap.appendTo(originalParent);
                
                // Rimuovi il contenitore a schermo intero
                $('.fullscreen-map').remove();
                
                // Aggiorna il layout della rete
                if (network) {
                    setTimeout(() => {
                        network.fit();
                        network.redraw();
                    }, 100);
                }
                
                isFullscreen = false;
                $(this).html('<i class="bi bi-arrows-fullscreen"></i> Schermo intero');
            }
        });

        // Gestisci l'uscita dalla modalità a schermo intero con il tasto ESC
        $(document).keyup(function(e) {
            if (e.key === "Escape" && isFullscreen) {
                $('#fullscreenBtn').click();
            }
        });

        // Gestisci il ridimensionamento della finestra
        $(window).resize(function() {
            if (isFullscreen && network) {
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
                        levelSeparation: 150,
                        nodeSpacing: 200,
                        treeSpacing: 200,
                        blockShifting: true,
                        edgeMinimization: true,
                        parentCentralization: true,
                        alignment: direction.includes('CENTER') ? 'center' : 'undefined'
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

    $('#generateMap').click(function() {
        const text = $('#textInput').val();
        const nodes = [];
        const edges = [];
        let nodeId = 1;
        let parentStack = [null];
        let levelNodes = {};

        // Dividi il testo in righe
        const lines = text.split('\n');
        
        lines.forEach(line => {
            if (line.trim() === '') return;

            // Conta gli spazi all'inizio della riga per determinare il livello
            const level = (line.match(/^\s*/)[0].length / 4) + 1;
            const content = line.trim().replace(/^[•\-\*]\s*/, '');

            // Rimuovi i nodi genitori non più necessari
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

            // Crea l'arco se c'è un genitore
            if (parentStack[parentStack.length - 1] !== null) {
                edges.push({
                    from: parentStack[parentStack.length - 1],
                    to: nodeId,
                    arrows: 'to',
                    color: {
                        color: '#7f8c8d',
                        highlight: '#2c3e50'
                    }
                });
            }

            // Aggiorna lo stack dei genitori
            parentStack.push(nodeId);
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
                    type: 'cubicBezier',
                    forceDirection: direction.startsWith('UD') || direction.startsWith('DU') ? 'horizontal' : 'vertical'
                }
            },
            layout: {
                hierarchical: {
                    direction: direction.startsWith('UD') ? 'UD' : 
                             direction.startsWith('DU') ? 'DU' : 
                             direction.startsWith('LR') ? 'LR' : 'RL',
                    sortMethod: 'directed',
                    levelSeparation: 150,
                    nodeSpacing: 200,
                    treeSpacing: 200,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true,
                    alignment: direction.includes('CENTER') ? 'center' : 'undefined'
                }
            },
            physics: false,
            interaction: {
                zoomView: true,
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
                    levelSeparation: 150,
                    nodeSpacing: 200,
                    treeSpacing: 200,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true,
                    alignment: 'center'
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
    });
}); 