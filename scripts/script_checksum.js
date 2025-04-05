// Funciones para modales
function showWarningModal() {
    document.getElementById('warningModal').style.display = 'block';
}

function closeWarningModal() {
    document.getElementById('warningModal').style.display = 'none';
}

function showLoadingModal() {
    document.getElementById('loadingModal').style.display = 'block';
}

function closeLoadingModal() {
    document.getElementById('loadingModal').style.display = 'none';
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Función para pegar
document.getElementById('pasteBtn').addEventListener('click', async function() {
    const input = document.getElementById('hashToCompare');
        
    try {
        if (navigator.clipboard?.readText) {
            try {
                const text = await navigator.clipboard.readText();
                input.value = text.trim();
                return;
            } catch (error) {
                console.log('Permiso denegado, intentando método alternativo...');
            }
        }

        // Fallback para HTTP/navegadores antiguos
        input.focus();
        const success = document.execCommand('paste');
        if (!success) {
            throw new Error('No se pudo acceder al portapapeles');
        }
    } catch (error) {
        console.error('Error al pegar:', error);
        // Solución alternativa con prompt
        const clipboardText = prompt('Por favor pegue el hash manualmente (Ctrl+V):');
        if (clipboardText !== null) {
            input.value = clipboardText.trim();
        }
    }
});

// Función principal para calcular hashes
async function calculateHashes() {
    const fileInput = document.getElementById('fileInput');
    const hashToCompare = document.getElementById('hashToCompare').value.trim().toLowerCase();
    const hashResults = document.getElementById('hashResults');
        
    if (!fileInput.files.length) {
        alert('Por favor, seleccione un archivo primero.');
        return;
    }

    showLoadingModal();

    try {
        const file = fileInput.files[0];
        if (file.size > 100000000) { // 100MB
            await new Promise(resolve => {
                showWarningModal();
                document.querySelector('#warningModal button').onclick = () => {
                    closeWarningModal();
                    resolve();
                };
            });
        }

        const dataBuffer = await file.arrayBuffer();
        let resultHTML = `<div class="result"><p><b>Nombre de archivo (.ext):</b> ${file.name}</p>`;
        let matchFound = false;

        const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        for (const algo of algorithms) {
            try {
                const hashBuffer = await crypto.subtle.digest(algo, dataBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
                    
                const isMatch = hashToCompare && hashHex === hashToCompare;
                if (isMatch) matchFound = true;

                resultHTML += `
                    <p style="color: ${isMatch ? '#28a745' : '#007bff'}; margin: 5px 0;">
                        <b>${algo}:</b> ${hashHex} ${isMatch ? '✅' : ''}
                    </p>
                `;
            } catch (error) {
                console.error(`Error calculando ${algo}:`, error);
            }
        }

        hashResults.innerHTML = resultHTML + '</div>';
            
        const successModal = document.getElementById('successModal');
        successModal.querySelector('p').textContent = matchFound 
            ? '✅ Coincidencia verificada' 
            : '❌ No se encontraron coincidencias';
        successModal.style.display = 'block';

    } catch (error) {
        console.error("Error:", error);
        alert("Ocurrió un error al calcular los hashes: " + (error.message || ""));
    } finally {
        closeLoadingModal();
    }
}

// Función para actualizar el estado del botón de archivos
function updateFileButtonStatus() {
    const fileInput = document.getElementById('fileInput');
    const wrapper = fileInput.closest('.file-input-wrapper');
    const labelText = wrapper.querySelector('.button-text');
    
    if (fileInput.files && fileInput.files.length > 0) {
        wrapper.classList.add('has-files');
        labelText.textContent = '1 archivo seleccionado';
    } else {
        wrapper.classList.remove('has-files');
        labelText.textContent = 'Seleccionar archivo';
    }
}

// Función para limpiar los resultados
function clearResults() {
    const fileInput = document.getElementById('fileInput');
    fileInput.value = '';
    document.getElementById('hashToCompare').value = '';
    document.getElementById('hashResults').innerHTML = '';
    document.getElementById('successModal').style.display = 'none';
    
    updateFileButtonStatus(); // Actualiza el estado del botón
}

// Eventos
document.getElementById('fileInput').addEventListener('change', function(e) {
    updateFileButtonStatus();
    if (this.files.length > 0 && this.files[0].size > 100000000) {
        showWarningModal();
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    updateFileButtonStatus();
});
