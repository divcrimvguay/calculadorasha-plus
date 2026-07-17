const calculatedHashes = [];

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

function showSuccessModal() {
    document.getElementById('successModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Función para formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${size} ${units[i]}`;
}

// Función principal para calcular hashes
async function calculateHashes() {
    const fileInput = document.getElementById('fileInput');
    const hashResults = document.getElementById('hashResults');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecciona al menos un archivo para calcular los hashes.');
        return;
    }

    showWarningModal();

    await new Promise(resolve => {
        const modalButton = document.querySelector('#warningModal button');
        const handler = () => {
            modalButton.removeEventListener('click', handler);
            closeWarningModal();
            showLoadingModal();
            resolve();
        };
        modalButton.addEventListener('click', handler);
    });

    try {
        // Mostrar el contenedor de resultados
        document.getElementById('resultsContainer').style.display = 'block';

        for (const file of fileInput.files) {
            const hash = await calculateFileHash(file);
            calculatedHashes.push(hash);
            
            const resultElement = document.createElement('div');
            resultElement.classList.add('result');
            resultElement.innerHTML = `
                <p><b>Nombre de archivo (.ext):</b> ${hash.filename}</p>
                <p><b>Tamaño de archivo:</b><span style="color: #007bff;"> ${hash.sizeFormatted}</span></p>
                <p><b>Hash SHA-512:</b><span style="color: #28a745;"> ${hash.hash}</span></p>
            `;
            hashResults.appendChild(resultElement);
        }
        
        showSuccessModal();
    } catch (error) {
        console.error("Error calculando hashes:", error);
        alert("Ocurrió un error al calcular los hashes");
    } finally {
        closeLoadingModal();
    }
}

async function calculateFileHash(file) {
    const CHUNK_SIZE = 1024 * 1024; // 1 MB
    const hashInstance = sha512.create();
    
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
    
    return {
        filename: file.name,
        hash: hashInstance.hex(),
		size: file.size,
        sizeFormatted: formatFileSize(file.size)
    };
}

// Función para imprimir resultados
function printResults() {
    if (calculatedHashes.length === 0) {
        alert('No hay ningún reporte para imprimir.');
        return;
    }

    const currentDate = new Date();
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const time24h = `${hours}:${minutes}:${seconds}`;
    const printWindow = window.open('', '_blank');
    
	printWindow.document.write(`<!DOCTYPE html>
	<html lang="es">
	<head>
		<meta charset="UTF-8">
		<title>Reporte Hash SHA-512</title>
		<meta name="author" content="Miguel Santiago Kremzky (Auditor/Consultor/Técnico/Programador en Redes y Sistemas Informáticos - Perito en Informática Forense - Especialista en Ciberseguridad) :)">
		<link rel="shortcut icon" href="images/favicon.png">
		<style>
			@media print {
				.logo {
					display: block;
				}
			}
			@page {
				size: carta;
			}
			body {
				margin: 15mm;
				font-family: Arial, sans-serif;
			}
			.logo {
				width: 43%;
				max-width: 43px;
				margin: 0 auto;
				margin-top: -50px;
				display: block;
			}
			.container {
				text-align: center;
				display: block;
				margin-bottom: 2px;
				font-size: 12px;
			}
			.line {
				border-top: 1px solid black;
				max-width: 100%;
				margin: 5px auto;
			}
			h2 {
				text-align: center;
				margin-top: 2px;
				margin-bottom: 0;
			}
			li {
				overflow-wrap: break-word;
			}
		</style>
	</head>
	<body>
		<div class="container">
			<img class="logo" src="images/logo_1.png" alt="Escudo Policía de Entre Ríos">
			<b>POLICÍA DE ENTRE RÍOS<br>Calculadora Algorítmica SHA+ (versión 3.5.5)</b>
		</div>
		<div class="line"></div>
		<h2>REPORTE HASH SHA-512</h2>
		<div style="text-align: left; margin-bottom: 2px;">
			<b>Fecha:</b> ${currentDate.toLocaleDateString()} - <b>Hora:</b> ${time24h}
			<span style="float: right;"><b>Reporte Nº:</b> .......... <b>/</b> ..........</span>
		</div>
		<div class="line"></div>
		<ol>`);

    calculatedHashes.forEach(item => {
        printWindow.document.write(`
		<li>
			<b>Nombre de archivo (.ext):</b> ${item.filename}<br>
			<b>Tamaño de archivo:</b> ${item.sizeFormatted}<br>
			<b>Hash SHA-512:</b> ${item.hash}<br><br>
		</li>
        `);
    });

    printWindow.document.write(`
        </ol>
    </body>
    </html>
    `);

    // Esperar a que cargue la imagen antes de imprimir
    const logo = printWindow.document.querySelector('.logo');
    if (logo.complete) {
        printWindow.document.close();
        printWindow.print();
    } else {
        logo.onload = function() {
            printWindow.document.close();
            printWindow.print();
        };
    }
}

// Función para limpiar resultados
function clearResults() {
    const hashResults = document.getElementById('hashResults');
    hashResults.innerHTML = '';
    calculatedHashes.length = 0;

    // Ocultar el contenedor de resultados
    document.getElementById('resultsContainer').style.display = 'none';

    const fileInput = document.getElementById('fileInput');
    fileInput.value = '';
    updateFileButtonStatus();
}

// Actualizar estado del botón de archivos
function updateFileButtonStatus() {
    const fileInput = document.getElementById('fileInput');
    const wrapper = fileInput.closest('.file-input-wrapper');
    const labelText = wrapper.querySelector('.button-text');
    
    if (fileInput.files && fileInput.files.length > 0) {
        wrapper.classList.add('has-files');
        labelText.textContent = fileInput.files.length === 1 
            ? '1 archivo seleccionado' 
            : `${fileInput.files.length} archivos seleccionados`;
    } else {
        wrapper.classList.remove('has-files');
        labelText.textContent = 'Seleccionar archivos';
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Configurar evento para el input de archivos
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', updateFileButtonStatus);
    
    // Inicializar estado del botón
    updateFileButtonStatus();

});
