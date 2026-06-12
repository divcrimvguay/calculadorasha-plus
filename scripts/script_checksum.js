// Mapeo de longitud de hash → algoritmo
const HASH_MAP = {
    40: { name: 'SHA-1', instance: () => sha1.create() },
    64: { name: 'SHA-256', instance: () => sha256.create() },
    96: { name: 'SHA-384', instance: () => sha384.create() },
    128: { name: 'SHA-512', instance: () => sha512.create() }
};

// Funciones para los modales
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
            const text = await navigator.clipboard.readText();
            input.value = text.trim();
            return;
        }
    } catch (error) {
        console.log('Clipboard API no disponible, usando prompt...');
    }

    const clipboardText = prompt('Por favor pegue el hash manualmente (Ctrl+V):');
    if (clipboardText !== null) {
        input.value = clipboardText.trim();
    }
});

// Detectar algoritmo por longitud del hash ingresado
function detectAlgorithm(hashInput) {
    const cleanHash = hashInput.replace(/\s/g, '').toLowerCase();
    if (/^[0-9a-f]+$/.test(cleanHash) && HASH_MAP[cleanHash.length]) {
        return HASH_MAP[cleanHash.length];
    }
    return null;
}

// Calcular hash incremental de un archivo
async function calculateIncrementalHash(file, algorithm) {
    const CHUNK_SIZE = 1024 * 1024; // 1 MB
    const hashInstance = algorithm.instance();
    
    for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
        const chunkEnd = Math.min(offset + CHUNK_SIZE, file.size);
        const chunk = file.slice(offset, chunkEnd);
        
        const chunkBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.onerror = () => reject(new Error(`Error leyendo chunk en offset ${offset}`));
            reader.readAsArrayBuffer(chunk);
        });
        
        hashInstance.update(chunkBuffer);
    }
    
    return hashInstance.hex();
}

// Función principal para calcular y verificar hashes
async function calculateHashes() {
    const fileInput = document.getElementById('fileInput');
    const hashToCompare = document.getElementById('hashToCompare').value.trim().toLowerCase();
    const hashResults = document.getElementById('hashResults');
    
    if (!fileInput.files.length) {
        alert('Por favor, seleccione un archivo primero.');
        return;
    }

    if (!hashToCompare) {
        alert('Por favor, ingrese un hash para comparar.');
        return;
    }

    const detectedAlgo = detectAlgorithm(hashToCompare);
    if (!detectedAlgo) {
        alert('El hash ingresado no es válido. Debe tener 40, 64, 96 o 128 caracteres hexadecimales.\n\nSHA-1: 40 | SHA-256: 64 | SHA-384: 96 | SHA-512: 128');
        return;
    }

    showLoadingModal();

    try {
        const file = fileInput.files[0];
        
        const hashHex = await calculateIncrementalHash(file, detectedAlgo);
        const isMatch = hashHex === hashToCompare;

        const resultHTML = `
            <div class="result">
                <p><b>Nombre de archivo (.ext):</b> ${file.name}</p>
                <p><b>Algoritmo detectado:</b> ${detectedAlgo.name}</p>
                <p style="color: #007bff;"><b>Hash calculado:</b> ${hashHex}</p>
                <p style="color: ${isMatch ? '#28a745' : '#dc3545'}; font-size: 18px; margin-top: 10px;">
                    <b>${isMatch ? '✅ COINCIDEN' : '❌ NO COINCIDEN'}</b>
                </p>
            </div>
        `;

        hashResults.innerHTML = resultHTML;
        
        const successModal = document.getElementById('successModal');
        successModal.querySelector('p').textContent = isMatch 
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
    
    updateFileButtonStatus();
}

// Eventos
document.getElementById('fileInput').addEventListener('change', function(e) {
    updateFileButtonStatus();
});

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    updateFileButtonStatus();
});
