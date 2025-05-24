$(document).ready(function () {
  let network = null;
  const container = document.getElementById("mapContainer");
  let originalContainerStyles = { height: '', width: '' };
  let isFullscreen = false;

  // Funzione per gestire lo zoom
  function setupZoom() {
    $("#zoomIn").click(function () {
      if (network) {
        const scale = network.getScale();
        network.moveTo({
          scale: scale * 1.2,
        });
      }
    });

    $("#zoomOut").click(function () {
      if (network) {
        const scale = network.getScale();
        network.moveTo({
          scale: scale * 0.8,
        });
      }
    });
  }

  // Funzione per gestire la modalità a schermo intero - CORRETTA
  function setupFullscreen() {
    const fullscreenBtn = $("#fullscreenBtn");
    const conceptMapElement = $(".concept-map");

    // Verifica esistenza degli elementi
    if (!fullscreenBtn.length || !conceptMapElement.length) {
      console.warn("Fullscreen button or .concept-map element not found.");
      return;
    }

    const conceptMapDOMElement = conceptMapElement[0];

    // Verifica che 'container' (#mapContainer) esista
    if (!container) {
      console.error("#mapContainer not found. Fullscreen will not work correctly.");
      return;
    }

    fullscreenBtn.click(function () {
      // Verifica dello stato fullscreen
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        // Salva gli stili originali di #mapContainer
        originalContainerStyles.height = $(container).css('height');
        originalContainerStyles.width = $(container).css('width');

        // Entra in modalità schermo intero
        enterFullscreen(conceptMapDOMElement);
      } else {
        // Esci dalla modalità schermo intero
        exitFullscreen();
      }
    });

    // Gestisci i cambiamenti dello stato fullscreen
    const fullscreenEvents = 'fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange';
    $(document).off(fullscreenEvents).on(fullscreenEvents, function () {
      const newFullscreenState = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement
      );
      
      handleFullscreenChange(newFullscreenState, fullscreenBtn);
    });

    // Gestisci il ridimensionamento della finestra
    $(window).off('resize.fullscreen').on('resize.fullscreen', function() {
      if (network) {
        setTimeout(() => {
          network.setSize('100%', '100%');
          network.fit({
            animation: { duration: 100, easingFunction: 'easeInOutQuad' }
          });
          network.redraw();
        }, 150);
      }
    });
  }

  // Funzione per entrare in fullscreen
  function enterFullscreen(element) {
    try {
      let fsPromise;
      
      if (element.requestFullscreen) {
        fsPromise = element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        fsPromise = element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        fsPromise = element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        fsPromise = element.msRequestFullscreen();
      } else {
        console.error("Fullscreen API not supported by this browser");
        return;
      }

      // Gestione della Promise se disponibile
      if (fsPromise && typeof fsPromise.catch === 'function') {
        fsPromise.catch(err => {
          console.error("Errore durante la richiesta di entrare in schermo intero:", err.message);
          // Se fallisce, ripristina gli stili originali di #mapContainer
          $(container).css({
            'height': originalContainerStyles.height,
            'width': originalContainerStyles.width
          });
        });
      }
    } catch (error) {
      console.error("Errore nell'attivazione fullscreen:", error);
    }
  }

  // Funzione per uscire dal fullscreen
  function exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => 
          console.error("Errore durante l'uscita da schermo intero:", err.message)
        );
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (error) {
      console.error("Errore nell'uscita da fullscreen:", error);
    }
  }

  // Funzione per gestire i cambiamenti dello stato fullscreen
  function handleFullscreenChange(newFullscreenState, fullscreenBtn) {
    isFullscreen = newFullscreenState;

    if (isFullscreen) {
      fullscreenBtn.html('<i class="bi bi-fullscreen-exit"></i> Esci');
      
      // Imposta l'altezza del container al 100% in modalità fullscreen
      $(container).css({
        'height': '100%',
        'width': '100%'
      });

      // Aggiorna il layout della rete quando si entra in fullscreen
      updateNetworkLayout();
    } else {
      fullscreenBtn.html('<i class="bi bi-arrows-fullscreen"></i> Schermo intero');
      
      // Ripristina l'altezza e larghezza originali di #mapContainer
      $(container).css({
        'height': originalContainerStyles.height || '500px',
        'width': originalContainerStyles.width || '100%'
      });
      
      // Resetta gli stili salvati
      originalContainerStyles = { height: '', width: '' };

      // Aggiorna il layout della rete quando si esce dal fullscreen
      updateNetworkLayout();
    }
  }

  // Funzione helper per aggiornare il layout della rete
  function updateNetworkLayout() {
    if (network) {
      setTimeout(() => {
        network.setSize('100%', '100%');
        network.fit({ 
          animation: { duration: 100, easingFunction: 'easeInOutQuad' } 
        });
        network.redraw();
      }, 150);
    }
  }

  // Funzione per esportare la mappa come PNG
  function setupExportPNG() {
    $("#exportPNG").click(function (e) {
      e.preventDefault();
      if (!network) return;

      // Crea un contenitore temporaneo per la cattura
      const tempContainer = $("<div></div>")
        .css({
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: container.offsetWidth + "px",
          height: container.offsetHeight + "px",
          backgroundColor: "white",
        })
        .appendTo("body");

      // Cattura la mappa
      html2canvas(container, {
        backgroundColor: "white",
        scale: 2, // Migliore qualità
        logging: false,
        useCORS: true,
      }).then((canvas) => {
        // Crea il link per il download
        const link = document.createElement("a");
        link.download = "mappa-concettuale.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        // Rimuovi il contenitore temporaneo
        tempContainer.remove();
      });
    });
  }

  // Funzione per esportare la mappa come PDF
  function setupExportPDF() {
    $("#exportPDF").click(function (e) {
      e.preventDefault();
      if (!network) return;

      // Crea un contenitore temporaneo per la cattura
      const tempContainer = $("<div></div>")
        .css({
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: container.offsetWidth + "px",
          height: container.offsetHeight + "px",
          backgroundColor: "white",
        })
        .appendTo("body");

      // Cattura la mappa
      html2canvas(container, {
        backgroundColor: "white",
        scale: 2, // Migliore qualità
        logging: false,
        useCORS: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jspdf.jsPDF({
          orientation: canvas.width > canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("mappa-concettuale.pdf");

        // Rimuovi il contenitore temporaneo
        tempContainer.remove();
      });
    });
  }

  // Funzione per aggiornare la direzione della mappa - CORRETTA
  function updateDirection(directionParam) {
    if (network) {
      // Assicurati che directionParam sia una stringa valida prima di procedere
      if (typeof directionParam !== 'string' || directionParam.trim() === '') {
        console.warn("updateDirection chiamata con direzione non valida o vuota:", directionParam);
        return;
      }

      let options = {
        layout: {
          hierarchical: {
            // CORREZIONE: usa directionParam invece di direction
            direction: directionParam.startsWith("UD")
              ? "UD"
              : directionParam.startsWith("DU")
              ? "DU"
              : directionParam.startsWith("LR")
              ? "LR"
              : "RL",
            sortMethod: "directed",
            levelSeparation: 100,
            nodeSpacing: 150,
            treeSpacing: 150,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: false,
          },
        },
      };
      network.setOptions(options);
    }
  }

  // Inizializza i controlli
  setupZoom();
  setupFullscreen();
  setupExportPNG();
  setupExportPDF();
  
  // Gestione delle direzioni tramite i link nel dropdown
  $(document).on('click', '[data-direction]', function(e) {
    e.preventDefault();
    const direction = $(this).data('direction');
    updateDirection(direction);
  });
  
  // Supporto per il vecchio select (per retrocompatibilità)
  if ($("#directionSelect").length) {
    $("#directionSelect").change(function() {
      updateDirection($(this).val());
    });
  }

  // Aggiungiamo un campo per il titolo della mappa
  if (!$("#mapTitleInput").length) {
    // Verifica quale textarea è presente nella pagina (textInput per sandbox.php o content per editor.php)
    const textareaSelector = $("#textInput").length ? "#textInput" : "#content";
    $(
      '<div class="form-group mb-3"><label for="mapTitleInput">Titolo della mappa:</label><input type="text" class="form-control" id="mapTitleInput" placeholder="Inserisci il titolo della mappa"></div>'
    ).insertBefore(textareaSelector);
  }

  $("#generateMap").click(function () {
    const title = $("#mapTitleInput").val() || "Mappa Concettuale";
    // Ottieni il testo dal textarea corretto (textInput per sandbox.php o content per editor.php)
    const text = $("#textInput").length
      ? $("#textInput").val()
      : $("#content").val();
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
        background: "#3498db",
        border: "#2980b9",
        highlight: {
          background: "#2980b9",
          border: "#2c3e50",
        },
      },
      font: {
        size: 18,
        bold: true,
      },
    });

    // Aggiorna lo stack dei genitori con il nodo titolo
    parentStack[0] = nodeId;
    nodeId++;

    // Dividi il testo in righe
    const lines = text.split("\n");

    lines.forEach((line) => {
      if (line.trim() === "") return;

      // Conta gli spazi all'inizio della riga per determinare il livello
      // Incrementiamo di 1 il livello perché il livello 1 è riservato al titolo
      const level = line.match(/^\s*/)[0].length / 4 + 2;
      const content = line.trim().replace(/^[•\-\*]\s*/, "");

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
          background: "#ecf0f1",
          border: "#2c3e50",
          highlight: {
            background: "#bdc3c7",
            border: "#2c3e50",
          },
        },
      });

      // Crea l'arco collegandolo al genitore appropriato
      // Se il livello è 2 (zero indentazione), collega al nodo titolo (ID 1)
      // Altrimenti, collega al genitore appropriato dallo stack
      const parentId = level === 2 ? 1 : parentStack[parentStack.length - 1];
      edges.push({
        from: parentId,
        to: nodeId,
        arrows: "to",
        color: {
          color: "#7f8c8d",
          highlight: "#2c3e50",
        },
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
      edges: new vis.DataSet(edges),
    };

    // Determina la direzione per la nuova mappa.
    // Usa "UD" come default se #directionSelect non esiste o non ha un valore valido.
    let layoutDirection = "UD"; // Default direction
    if ($("#directionSelect").length && typeof $("#directionSelect").val() === 'string' && $("#directionSelect").val().trim() !== '') {
        layoutDirection = $("#directionSelect").val();
    }

    const options = {
      nodes: {
        shape: "box",
        margin: 10,
        font: {
          size: 14,
        },
      },
      edges: {
        smooth: {
          type: "dynamic",
          roundness: 0.6,
        },
      },
      layout: {
        hierarchical: {
          direction: layoutDirection.startsWith("UD")
            ? "UD"
            : layoutDirection.startsWith("DU")
            ? "DU"
            : layoutDirection.startsWith("LR")
            ? "LR"
            : "RL",
          sortMethod: "directed",
          levelSeparation: 250,
          nodeSpacing: 300,
          treeSpacing: 300,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: false,
        },
      },
      physics: {
        enabled: false,
        stabilization: {
          enabled: true,
          iterations: 500,
          updateInterval: 50,
        },
        hierarchicalRepulsion: {
          nodeDistance: 300,
          centralGravity: 0.1,
          springLength: 300,
          springConstant: 0.01,
        },
        solver: "hierarchicalRepulsion",
      },
      interaction: {
        dragNodes: true, // Abilita il trascinamento dei nodi
        zoomView: false, // Disabilita lo zoom con la rotella del mouse
        dragView: true,
        navigationButtons: true, // Aggiunge pulsanti di navigazione
        keyboard: true // Abilita la navigazione da tastiera
      }
    };

    // Se è selezionata una modalità centrata, modifica il layout
    if (layoutDirection.includes("CENTER")) {
      // Trova il nodo radice (id: 1)
      const rootNode = nodes.find((n) => n.id === 1);
      if (rootNode) {
        // Imposta il nodo radice al centro
        rootNode.x = 0;
        rootNode.y = 0;
        rootNode.fixed = true;

        // Modifica il layout per i nodi figli
        options.layout.hierarchical = {
          direction: layoutDirection === "UD_CENTER" ? "UD" : "LR",
          sortMethod: "directed",
          levelSeparation: 300,
          nodeSpacing: 350,
          treeSpacing: 250,
          blockShifting: false,
          edgeMinimization: false,
          parentCentralization: false,
        };

        // Aggiungi una funzione di callback per posizionare i nodi
        options.layout.hierarchical.getPositions = function (
          nodeId,
          level,
          nodes,
          edges
        ) {
          if (nodeId === 1) return { x: 0, y: 0 };

          const parent = edges.find((e) => e.to === nodeId)?.from;
          if (!parent) return null;

          const parentNode = nodes.find((n) => n.id === parent);
          if (!parentNode) return null;

          const isVertical = layoutDirection === "UD_CENTER";
          const offset = level * 200;

          return {
            x: isVertical ? parentNode.x : parentNode.x + offset,
            y: isVertical ? parentNode.y + offset : parentNode.y,
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
    network.once("stabilized", function () {
      network.setOptions({
        layout: {
          hierarchical: {
            enabled: false,
          },
        },
        physics: {
          enabled: false,
        },
      });
    });
    
    // Aggiungi eventi per gestire il trascinamento e assicurarsi che la mappa rimanga visibile
    network.on("dragEnd", function(params) {
        // Assicurati che la rete sia completamente visibile dopo il trascinamento
        if (isFullscreen) {
            network.redraw();
        }
    });
    
    // Aggiungi evento per gestire lo zoom
    network.on("zoom", function(params) {
        // Assicurati che la rete sia completamente visibile dopo lo zoom
        if (isFullscreen) {
            network.redraw();
        }
    });
  });
});