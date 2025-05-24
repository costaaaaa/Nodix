/**
 * Gestione dell'editor di testo per Nodix
 * Questo file contiene le funzionalità per migliorare l'esperienza di editing
 * con la gestione del tasto Tab e Backspace per la creazione di elenchi puntati
 */

function setupTextEditor(editorId) {
    const editor = document.getElementById(editorId);
    if (!editor) return;
    
    editor.addEventListener('keydown', function(e) {
        // Gestione del tasto Tab
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
        }

        // Gestione del tasto Backspace
        if (e.key === 'Backspace' && this.selectionStart === this.selectionEnd) {
            const start = this.selectionStart;
            const currentLine = this.value.substring(0, start).split('\n').pop();

            // Verifica se la riga contiene solo spazi e se ci sono almeno 4 spazi
            if (currentLine.trim() === '' && currentLine.length >= 4 && /^\s+$/.test(currentLine)) {
                e.preventDefault();
                // Rimuovi 4 spazi
                const lineStart = start - currentLine.length;
                const newStart = start - 4;
                this.value = this.value.substring(0, lineStart) + currentLine.substring(0, currentLine.length - 4) + this.value.substring(start);
                this.selectionStart = this.selectionEnd = newStart;
            }
        }
    });
}

// Inizializza l'editor quando il documento è pronto
document.addEventListener('DOMContentLoaded', function() {
    // Cerca l'editor nella pagina sandbox
    const sandboxEditor = document.getElementById('textInput');
    if (sandboxEditor) {
        setupTextEditor('textInput');
    }
    
    // Cerca l'editor nella pagina editor
    const contentEditor = document.getElementById('content');
    if (contentEditor) {
        setupTextEditor('content');
    }

    // Inizializza anche per dashboard.php
    const dashboardTextContent = document.getElementById('text_content');
    if (dashboardTextContent) {
        setupTextEditor('text_content');
    }
});