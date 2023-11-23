const calculatedHashes = [];

async function calculateHashes() {
	const fileInput = document.getElementById('fileInput');
	const hashResults = document.getElementById('hashResults');
    
	if (fileInput.files.length === 0) {
		alert('Por favor, selecciona al menos un archivo para calcular los hashes.');
		return;
	}

	showWarningModal();

	await new Promise(resolve => {
		const modalButton = document.querySelector('#warningModal button');
		modalButton.addEventListener('click', () => {
			closeWarningModal();
			showLoadingModal();
			resolve();
		});
	});

	for (const file of fileInput.files) {
		const reader = new FileReader();
        
		await new Promise(resolve => {
			reader.onload = async function(event) {
				const dataBuffer = event.target.result;
				const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
				const fileInfo = {
					filename: file.name,
					hash: hashHex
				};

				calculatedHashes.push(fileInfo);

				const resultElement = document.createElement('div');
				resultElement.classList.add('result');
				resultElement.innerHTML = `
					<p><b>Nombre de archivo (.ext):</b> ${fileInfo.filename}</p>
					<p><span style="color: #007bff;"><b>Hash SHA-1:</b> ${fileInfo.hash}</span></p>
				`;
				hashResults.appendChild(resultElement);
				resolve();
			};

			reader.readAsArrayBuffer(file);
		});
	}

	closeLoadingModal();
	showSuccessModal();
}

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

function printResults() {
	if (calculatedHashes.length === 0) {
		alert('No hay ningún reporte para imprimir.');
		return;
	}

	const currentDateArgentina = new Date();
	const formattedDate = currentDateArgentina.toLocaleDateString();
	const formattedTime = currentDateArgentina.toLocaleTimeString();

	const printWindow = window.open('', '_blank');
	printWindow.document.write(`<!DOCTYPE html>
	<html lang="es">
	<head>
		<meta charset="UTF-8">
		<title>Reporte Hash SHA-1</title>
		<meta name="author" content="Miguel Santiago Kremzky (Auditor/Técnico/Programador en Redes y Sistemas Informáticos - Perito en Informática Forense - Especialista en Ciberseguridad) :)">
		<link rel="shortcut icon" href="imagenes/favicon.png">
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
			<img class="logo" src="imagenes/logo_1.png" alt="Escudo Policía de Entre Ríos">
			<b>POLICÍA DE ENTRE RÍOS<br>Calculadora Algorítmica SHA+ (versión 2.6.8)</b>
		</div>
		<div class="line"></div>
		<h2>REPORTE HASH SHA-1</h2>
		<div style="text-align: left; margin-bottom: 2px;">
			<b>Fecha y Hora:</b> ${formattedDate} - ${formattedTime}.
			<span style="float: right;"><b>Reporte Nº:</b> .......... <b>/</b> ..........</span>
		</div>
		<div class="line"></div>
		<ol>`);

	calculatedHashes.forEach(item => {
		printWindow.document.write(`
		<li>
			<b>Nombre de archivo (.ext):</b> ${item.filename}<br>
			<b>Hash SHA-1:</b> ${item.hash}<br><br>
		</li>`);
	});

	printWindow.document.write(`
		</ol>
	</body>
	</html>`);

	printWindow.document.querySelector('.logo').onload = function () {
		printWindow.document.close();
		printWindow.print();
	};
}

function clearResults() {
	const hashResults = document.getElementById('hashResults');
	hashResults.innerHTML = '';
	calculatedHashes.length = 0;
	const fileInput = document.getElementById('fileInput');
	fileInput.value = '';
}
