$(document).ready(function () {
  let network = null;
  const container = document.getElementById("mapContainer");
  let originalContainerStyles = { height: '', width: '' };
  let isFullscreen = false;

  // Variabile globale per memorizzare i dati grezzi dei nodi e degli archi analizzati
  // Questi dati dovrebbero essere la "fonte di verità" pulita, senza x,y,physics impostati dal layout.
  let currentMapData = { nodes: [], edges: [] };

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

  // Funzione per gestire la modalità a schermo intero
  function setupFullscreen() {
    const fullscreenBtn = $("#fullscreenBtn");
    const conceptMapElement = $(".concept-map");

    if (!fullscreenBtn.length || !conceptMapElement.length) {
      console.warn("Bottone fullscreen o elemento .concept-map non trovato.");
      return;
    }

    const conceptMapDOMElement = conceptMapElement[0];

    if (!container) {
      console.error("#mapContainer non trovato. Lo schermo intero non funzionerà correttamente.");
      return;
    }

    fullscreenBtn.click(function () {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        originalContainerStyles.height = $(container).css('height');
        originalContainerStyles.width = $(container).css('width');
        enterFullscreen(conceptMapDOMElement);
      } else {
        exitFullscreen();
      }
    });

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

  function enterFullscreen(element) {
    try {
      let fsPromise;
      if (element.requestFullscreen) fsPromise = element.requestFullscreen();
      else if (element.webkitRequestFullscreen) fsPromise = element.webkitRequestFullscreen();
      else if (element.mozRequestFullScreen) fsPromise = element.mozRequestFullScreen();
      else if (element.msRequestFullscreen) fsPromise = element.msRequestFullscreen();
      else { console.error("API Fullscreen non supportata."); return; }

      if (fsPromise && typeof fsPromise.catch === 'function') {
        fsPromise.catch(err => {
          console.error("Errore entrando in schermo intero:", err.message);
          $(container).css({
            'height': originalContainerStyles.height,
            'width': originalContainerStyles.width
          });
        });
      }
    } catch (error) { console.error("Errore attivazione fullscreen:", error); }
  }

  function exitFullscreen() {
    try {
      if (document.exitFullscreen) document.exitFullscreen().catch(err => console.error("Errore uscendo da schermo intero:", err.message));
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (error) { console.error("Errore uscita fullscreen:", error); }
  }

  function handleFullscreenChange(newFullscreenState, fullscreenBtn) {
    isFullscreen = newFullscreenState;
    if (isFullscreen) {
      fullscreenBtn.html('<i class="bi bi-fullscreen-exit"></i> Esci');
      $(container).css({ 'height': '100%', 'width': '100%' });
    } else {
      fullscreenBtn.html('<i class="bi bi-arrows-fullscreen"></i> Schermo intero');
      $(container).css({
        'height': originalContainerStyles.height || '500px',
        'width': originalContainerStyles.width || '100%'
      });
      originalContainerStyles = { height: '', width: '' };
    }
    updateNetworkLayout();
  }

  function updateNetworkLayout() {
    if (network) {
      setTimeout(() => {
        network.setSize('100%', '100%');
        network.fit({ animation: { duration: 100, easingFunction: 'easeInOutQuad' } });
        network.redraw();
      }, 150);
    }
  }

  function setupExportPNG() {
    $("#exportPNG").click(function (e) {
      e.preventDefault();
      if (!network) return;
      const tempContainer = $("<div></div>").css({
        position: "absolute", left: "-9999px", top: "-9999px",
        width: container.offsetWidth + "px", height: container.offsetHeight + "px",
        backgroundColor: "white",
      }).appendTo("body");
      html2canvas(container, { backgroundColor: "white", scale: 2, logging: false, useCORS: true })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = "mappa-concettuale.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
          tempContainer.remove();
        });
    });
  }

  function setupExportPDF() {
    $("#exportPDF").click(function (e) {
      e.preventDefault();
      if (!network) return;
      const tempContainer = $("<div></div>").css({
        position: "absolute", left: "-9999px", top: "-9999px",
        width: container.offsetWidth + "px", height: container.offsetHeight + "px",
        backgroundColor: "white",
      }).appendTo("body");
      html2canvas(container, { backgroundColor: "white", scale: 2, logging: false, useCORS: true })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jspdf.jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px", format: [canvas.width, canvas.height],
          });
          pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
          pdf.save("mappa-concettuale.pdf");
          tempContainer.remove();
        });
    });
  }

  // La funzione createCenteredVerticalLayout MODIFICA i nodi passati (aggiunge x,y,physics:false).
  // Questo è il motivo per cui dobbiamo passare una COPIA PROFONDA.
  function createCenteredVerticalLayout(nodes, edges) {
    // Creiamo una copia profonda dei nodi per essere sicuri di non modificare l'originale
    const layoutNodes = JSON.parse(JSON.stringify(nodes));
    const layoutEdges = JSON.parse(JSON.stringify(edges));

    const titleNode = layoutNodes.find(node => node.id === 1);
    const level2Nodes = layoutNodes.filter(node => node.level === 2);

    const centerY = 0;
    const verticalSpacingLevel2 = 200;
    const horizontalSpacingLevel2 = 250;

    if (titleNode) {
      titleNode.x = 0;
      titleNode.y = centerY;
      titleNode.physics = false; // Disabilita la fisica per questo nodo specifico
    }

    const halfCount = Math.ceil(level2Nodes.length / 2);
    const topNodes = level2Nodes.slice(0, halfCount);
    const bottomNodes = level2Nodes.slice(halfCount);

    topNodes.forEach((node, index) => {
      node.x = (index - (topNodes.length - 1) / 2) * horizontalSpacingLevel2;
      node.y = centerY - verticalSpacingLevel2;
      node.physics = false; // Disabilita la fisica
      positionChildrenVertically(node, layoutNodes, layoutEdges, -1);
    });

    bottomNodes.forEach((node, index) => {
      node.x = (index - (bottomNodes.length - 1) / 2) * horizontalSpacingLevel2;
      node.y = centerY + verticalSpacingLevel2;
      node.physics = false; // Disabilita la fisica
      positionChildrenVertically(node, layoutNodes, layoutEdges, 1);
    });

    return { nodes: layoutNodes, edges: layoutEdges };
  }

  function positionChildrenVertically(parentNode, allNodes, edges, directionSign) {
    const children = edges
      .filter(edge => edge.from === parentNode.id)
      .map(edge => allNodes.find(node => node.id === edge.to))
      .filter(child => child);

    if (children.length === 0) return;

    const childVerticalOffset = 150;
    const childHorizontalSpacing = 180;

    children.forEach((child, index) => {
      child.x = parentNode.x + (index - (children.length - 1) / 2) * childHorizontalSpacing;
      child.y = parentNode.y + (directionSign * childVerticalOffset);
      child.physics = false; // Disabilita la fisica
      positionChildrenVertically(child, allNodes, edges, directionSign);
    });
  }

  // NUOVA FUNZIONE: Layout orizzontale centrato
  function createCenteredHorizontalLayout(nodes, edges) {
    const layoutNodes = JSON.parse(JSON.stringify(nodes));
    const layoutEdges = JSON.parse(JSON.stringify(edges));

    const titleNode = layoutNodes.find(node => node.id === 1);
    const level2Nodes = layoutNodes.filter(node => node.level === 2);

    const centerX = 0;
    const horizontalSpacingLevel2 = 200; // Spaziatura orizzontale per nodi di livello 2
    const verticalSpacingLevel2 = 100;   // Spaziatura verticale per nodi di livello 2 (li disperde un po')

    if (titleNode) {
      titleNode.x = centerX;
      titleNode.y = 0; // Centro verticale
      titleNode.physics = false;
    }

    const halfCount = Math.ceil(level2Nodes.length / 2);
    const leftNodes = level2Nodes.slice(0, halfCount);
    const rightNodes = level2Nodes.slice(halfCount);

    leftNodes.forEach((node, index) => {
      node.x = centerX - horizontalSpacingLevel2; // A sinistra del centro
      node.y = (index - (leftNodes.length - 1) / 2) * verticalSpacingLevel2;
      node.physics = false;
      positionChildrenHorizontally(node, layoutNodes, layoutEdges, -1); // Espansione a sinistra
    });

    rightNodes.forEach((node, index) => {
      node.x = centerX + horizontalSpacingLevel2; // A destra del centro
      node.y = (index - (rightNodes.length - 1) / 2) * verticalSpacingLevel2;
      node.physics = false;
      positionChildrenHorizontally(node, layoutNodes, layoutEdges, 1); // Espansione a destra
    });

    return { nodes: layoutNodes, edges: layoutEdges };
  }

  function positionChildrenHorizontally(parentNode, allNodes, edges, directionSign) {
    const children = edges
      .filter(edge => edge.from === parentNode.id)
      .map(edge => allNodes.find(node => node.id === edge.to))
      .filter(child => child);

    if (children.length === 0) return;

    const childHorizontalOffset = 150; // Offset orizzontale per i figli
    const childVerticalSpacing = 100;    // Spaziatura verticale tra i figli

    children.forEach((child, index) => {
      child.x = parentNode.x + (directionSign * childHorizontalOffset);
      child.y = parentNode.y + (index - (children.length - 1) / 2) * childVerticalSpacing;
      child.physics = false;
      positionChildrenHorizontally(child, allNodes, edges, directionSign);
    });
  }
  
  // Funzione per generare/aggiornare il network Vis.js
  function initializeNetwork(nodesData, edgesData, options, selectedDirection) {
    if (network !== null) {
      network.destroy(); // Distruggi l'istanza esistente
      network = null;
    }

    network = new vis.Network(container, { nodes: new vis.DataSet(nodesData), edges: new vis.DataSet(edgesData) }, options);

    // Per layout gerarchici, disabilita la fisica dopo la stabilizzazione
    if (selectedDirection !== "UD_CENTER" && selectedDirection !== "LR_CENTER" && options.physics && options.physics.enabled) {
      network.once("stabilizationIterationsDone", function () {
        console.log("Stabilizzazione layout gerarchico completata. Disabilito fisica."); // DEBUG
        network.setOptions({
            physics: { enabled: false }, // Disabilita la fisica dopo la stabilizzazione
            layout: { hierarchical: { enabled: true } } // Mantiene il layout gerarchico attivo ma statico
        });
        network.fit();
      });
    } else if (selectedDirection === "UD_CENTER" || selectedDirection === "LR_CENTER"){
          network.fit(); // Fit per i layout centrati che sono già statici
    }
    
    network.on("dragEnd", function(params) { if (isFullscreen) network.redraw(); });
    network.on("zoom", function(params) { if (isFullscreen) network.redraw(); });
  }

  function updateDirection(directionParam) {
    if (!currentMapData.nodes.length) {
      console.warn("Impossibile aggiornare la direzione: dati della mappa non disponibili.");
      return;
    }

    let nodesToUse;
    let edgesToUse = JSON.parse(JSON.stringify(currentMapData.edges)); // Sempre una copia profonda degli edges

    let visOptions = {
      nodes: { shape: "box", margin: 10, font: { size: 14 } },
      edges: { smooth: { type: "dynamic", roundness: 0.6 } },
      interaction: { dragNodes: true, zoomView: false, dragView: true, navigationButtons: true, keyboard: true }
    };

    if (directionParam === "UD_CENTER") {
      // Per UD_CENTER, prepariamo i nodi con x, y e physics:false
      const centeredData = createCenteredVerticalLayout(currentMapData.nodes, currentMapData.edges);
      nodesToUse = centeredData.nodes;
      
      console.log("UD_CENTER: Nodi preparati per Vis.js (con x,y,physics:false):", nodesToUse); // DEBUG
      
      visOptions.layout = { hierarchical: false }; // Disabilita il layout gerarchico
      visOptions.physics = { enabled: false }; // Disabilita la fisica per tutti i nodi

    } else if (directionParam === "LR_CENTER") {
      // Per LR_CENTER, prepariamo i nodi con x, y e physics:false per il layout orizzontale centrato
      const centeredData = createCenteredHorizontalLayout(currentMapData.nodes, currentMapData.edges);
      nodesToUse = centeredData.nodes;

      console.log("LR_CENTER: Nodi preparati per Vis.js (con x,y,physics:false):", nodesToUse); // DEBUG

      visOptions.layout = { hierarchical: false }; // Disabilita il layout gerarchico
      visOptions.physics = { enabled: false }; // Disabilita la fisica per tutti i nodi

    } else { // Gestione per layout gerarchici standard (UD, DU, LR, RL)
      // Per i layout gerarchici, puliamo i nodi da x, y e physics
      nodesToUse = currentMapData.nodes.map(node => {
        const cleanedNode = {};
        for (const key in node) {
            // Copia tutte le proprietà tranne x, y, physics
            if (key !== 'x' && key !== 'y' && key !== 'physics') {
                cleanedNode[key] = node[key];
            }
        }
        
        // Assicurati che 'level' sia definito.
        if (typeof cleanedNode.level === 'undefined' || cleanedNode.level === null) {
            console.error("ERRORE RILEVATO (updateDirection - Hierarchical): Nodo con ID", cleanedNode.id, "manca della proprietà 'level'! Assegnazione a 1 per fallback. NODO:", cleanedNode);
            cleanedNode.level = 1;
        }
        return cleanedNode;
      });

      console.log("Hierarchical Layout: Nodi preparati per Vis.js (puliti, con level):", nodesToUse); // DEBUG
      
      visOptions.layout = {
        hierarchical: {
          enabled: true, // ABILITA il layout gerarchico
          direction: directionParam.startsWith("UD") ? "UD" :
                     directionParam.startsWith("DU") ? "DU" :
                     directionParam.startsWith("LR") ? "LR" : "RL",
          sortMethod: "directed",
          levelSeparation: 150,
          nodeSpacing: 200,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
        },
      };
      visOptions.physics = {
        enabled: true, // ABILITA la fisica per la stabilizzazione iniziale
        stabilization: {
          enabled: true,
          iterations: 1000,
          fit: true
        }
      };
    }
    
    // Inizializza o ricrea il network con i nuovi dati e opzioni
    initializeNetwork(nodesToUse, edgesToUse, visOptions, directionParam);
  }

  // Inizializza i controlli
  setupZoom();
  setupFullscreen();
  setupExportPNG();
  setupExportPDF();
  
  $(document).on('click', '[data-direction]', function(e) {
    e.preventDefault();
    const direction = $(this).data('direction');
    
    // Rimuovi il warning per LR_CENTER, ora che lo implementiamo
    // if (direction === "LR_CENTER") {
    //     console.warn("Layout LR_CENTER non ancora implementato.");
    //     return;
    // }

    $('[data-direction]').removeClass('active');
    $(this).addClass('active');
    
    updateDirection(direction);
  });
  
  if ($("#directionSelect").length) {
    $("#directionSelect").change(function() {
      updateDirection($(this).val());
    });
  }

  if (!$("#mapTitleInput").length) {
    const textareaSelector = $("#textInput").length ? "#textInput" : "#content";
    $(
      '<div class="form-group mb-3"><label for="mapTitleInput">Titolo della mappa:</label><input type="text" class="form-control" id="mapTitleInput" placeholder="Inserisci il titolo della mappa"></div>'
    ).insertBefore(textareaSelector);
  }

  $("#generateMap").click(function () {
    const title = $("#mapTitleInput").val() || "Mappa Concettuale";
    const text = $("#textInput").length ? $("#textInput").val() : $("#content").val();
    
    let nodes = [];
    let edges = [];
    let nodeIdCounter = 1;

    const titleNodeId = nodeIdCounter++;
    nodes.push({
      id: titleNodeId,
      label: title,
      level: 1, // Il titolo è sempre al livello 1
      color: { background: "#3498db", border: "#2980b9", highlight: { background: "#2980b9", border: "#2c3e50" }},
      font: { size: 18, bold: true },
    });

    // parentStack memorizza oggetti: { id: nodeId, level: nodeLevel }
    let parentStack = [{ id: titleNodeId, level: 1 }];

    const lines = text.split("\n");
    lines.forEach((line) => {
      if (line.trim() === "") return;

      const indentation = line.match(/^\s*/)[0].length;
      // Ogni 4 spazi = 1 livello di indentazione.
      // Il nodo titolo è a livello 1. I suoi figli diretti sono livello 2.
      // Quindi, 0 spazi di indentazione = livello 2.
      // 4 spazi = livello 3.
      const intendedDepthRelativeToRoot = indentation / 4;
      const calculatedCurrentNodeLevel = 2 + intendedDepthRelativeToRoot;


      const content = line.trim().replace(/^[•\-\*]\s*/, "");
      const currentNodeId = nodeIdCounter++;

      // Trova il genitore corretto nello stack.
      // Il genitore di un nodo a calculatedCurrentNodeLevel N deve essere un nodo a livello N-1.
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= calculatedCurrentNodeLevel) {
        parentStack.pop();
      }
      
      let actualParentNode;
      if (parentStack.length > 0) {
        actualParentNode = parentStack[parentStack.length - 1];
      } else {
        // Se lo stack è vuoto qui, significa che un nodo è più "alto" del titolo,
        // o è un errore nell'input. Assegniamo il titolo come fallback.
        console.warn(`Stack dei genitori vuoto per la riga: "${line}". Assegno il titolo come genitore di fallback.`);
        actualParentNode = { id: titleNodeId, level: 1 };
      }
      
      // Il livello VisJS del nodo corrente dovrebbe essere il livello del suo genitore + 1.
      // Questo è il modo più affidabile per i layout gerarchici.
      const visNodeLevel = actualParentNode.level + 1;
      
      nodes.push({
        id: currentNodeId,
        label: content,
        level: visNodeLevel, // Livello assegnato per Vis.js
        color: { background: "#ecf0f1", border: "#2c3e50", highlight: { background: "#bdc3c7", border: "#2c3e50" }},
      });

      edges.push({
        from: actualParentNode.id,
        to: currentNodeId,
        arrows: "to",
        color: { color: "#7f8c8d", highlight: "#2c3e50" },
      });

      parentStack.push({ id: currentNodeId, level: visNodeLevel });
    });
    
    // IMPORTANTISSIMO: currentMapData deve contenere i nodi con i livelli corretti
    // MA SENZA le proprietà x, y, physics impostate da createCenteredVerticalLayout
    // per non interferire con i layout gerarchici standard.
    // E' la nostra "fonte di verità" pulita.
    currentMapData = {
        nodes: nodes.map(node => {
            const cleanNode = {};
            for (const key in node) {
                // Copia tutte le proprietà tranne x, y, physics
                if (key !== 'x' && key !== 'y' && key !== 'physics') {
                    cleanNode[key] = node[key];
                }
            }
            // Verifica che il livello sia sempre presente dopo la creazione iniziale
            if (typeof cleanNode.level === 'undefined' || cleanNode.level === null) {
                console.error("ERRORE GRAVE (generateMap - initial cleanup): Nodo con ID", cleanNode.id, "manca di 'level' anche dopo la creazione! Assegnazione a 1 per prevenire crash. NODO:", cleanNode);
                cleanNode.level = 1;
            }
            return cleanNode;
        }),
        edges: JSON.parse(JSON.stringify(edges))
    };
    
    const activeDirectionElement = $('[data-direction].active');
    let selectedDirection = "UD";
    if (activeDirectionElement.length > 0) {
        selectedDirection = activeDirectionElement.data('direction');
    } else if ($("#directionSelect").length && typeof $("#directionSelect").val() === 'string' && $("#directionSelect").val().trim() !== '') {
        selectedDirection = $("#directionSelect").val();
    }

    let nodesToUseForInitialGeneration;
    let visOptionsForInitialGeneration = {
      nodes: { shape: "box", margin: 10, font: { size: 14 } },
      edges: { smooth: { type: "dynamic", roundness: 0.6 } },
      interaction: { dragNodes: true, zoomView: false, dragView: true, navigationButtons: true, keyboard: true },
    };

    if (selectedDirection === "UD_CENTER") {
      const centeredData = createCenteredVerticalLayout(currentMapData.nodes, currentMapData.edges);
      nodesToUseForInitialGeneration = centeredData.nodes;
      
      console.log("Generate Map - UD_CENTER: Nodi preparati per Vis.js (con x,y,physics:false):", nodesToUseForInitialGeneration); // DEBUG
      
      visOptionsForInitialGeneration.layout = { hierarchical: false };
      visOptionsForInitialGeneration.physics = { enabled: false };

    } else if (selectedDirection === "LR_CENTER") {
        const centeredData = createCenteredHorizontalLayout(currentMapData.nodes, currentMapData.edges);
        nodesToUseForInitialGeneration = centeredData.nodes;

        console.log("Generate Map - LR_CENTER: Nodi preparati per Vis.js (con x,y,physics:false):", nodesToUseForInitialGeneration); // DEBUG

        visOptionsForInitialGeneration.layout = { hierarchical: false };
        visOptionsForInitialGeneration.physics = { enabled: false };

    } else { // Layout gerarchico standard (UD, DU, LR, RL)
      nodesToUseForInitialGeneration = currentMapData.nodes.map(n => {
          const cleanedNode = {};
          for (const key in n) {
              if (key !== 'x' && key !== 'y' && key !== 'physics') {
                  cleanedNode[key] = n[key];
              }
          }
          if (typeof cleanedNode.level === 'undefined' || cleanedNode.level === null) {
              console.error("ERRORE CRITICO (generateMap hierarchical): Nodo con ID", cleanedNode.id, "manca di 'level'! Assegnazione a 1 per prevenire crash. NODO:", cleanedNode);
              cleanedNode.level = 1;
          }
          return cleanedNode;
      });

      console.log("Generate Map - Hierarchical: Nodi preparati per Vis.js (puliti, con level):", nodesToUseForInitialGeneration); // DEBUG
      visOptionsForInitialGeneration.layout = {
        hierarchical: {
          enabled: true, // Abilita il layout gerarchico
          direction: selectedDirection.startsWith("UD") ? "UD" :
                     selectedDirection.startsWith("DU") ? "DU" :
                     selectedDirection.startsWith("LR") ? "LR" : "RL",
          sortMethod: "directed", levelSeparation: 150, nodeSpacing: 200, treeSpacing: 200,
          blockShifting: true, edgeMinimization: true, parentCentralization: true,
        },
      };
      visOptionsForInitialGeneration.physics = {
          enabled: true,
          stabilization: { enabled: true, iterations: 1000, fit: true }
      };
    }
    
    // Inizializza il network per la prima volta
    initializeNetwork(nodesToUseForInitialGeneration, currentMapData.edges, visOptionsForInitialGeneration, selectedDirection);
  });
});