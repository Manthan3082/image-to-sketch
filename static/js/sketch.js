document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const previewImage = document.getElementById('preview-image');
    const previewContainer = document.querySelector('.preview-container');
    const uploadPrompt = document.querySelector('.upload-prompt');
    const removeImageButton = document.getElementById('remove-image');
    const convertButton = document.getElementById('convert-button');
    const downloadButton = document.getElementById('download-button');
    const resultPlaceholder = document.getElementById('result-placeholder');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultImageContainer = document.getElementById('result-image-container');
    const resultImage = document.getElementById('result-image');
    const contrastRange = document.getElementById('contrast-range');
    const brightnessRange = document.getElementById('brightness-range');
    const contrastValue = document.getElementById('contrast-value');
    const brightnessValue = document.getElementById('brightness-value');
    const alertContainer = document.getElementById('alert-container');

    let currentFile = null;
    let currentResultFilename = null;

    updateSliderValues();
    uploadArea.addEventListener('click', () => fileInput.click());
    browseButton.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    fileInput.addEventListener('change', handleFileSelect);
    removeImageButton.addEventListener('click', (e) => { e.stopPropagation(); resetUploadArea(); });
    convertButton.addEventListener('click', convertImage);
    downloadButton.addEventListener('click', downloadImage);
    contrastRange.addEventListener('input', updateSliderValues);
    brightnessRange.addEventListener('input', updateSliderValues);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragging'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragging'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) processFile(file);
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) processFile(file);
    }

    function processFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showAlert('Please select a valid image file (JPG or PNG).', 'danger');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImage.src = e.target.result;
            uploadPrompt.classList.add('d-none');
            previewContainer.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }

    function resetUploadArea() {
        fileInput.value = '';
        currentFile = null;
        previewImage.src = '';
        uploadPrompt.classList.remove('d-none');
        previewContainer.classList.add('d-none');
    }

    function updateSliderValues() {
        contrastValue.textContent = contrastRange.value;
        brightnessValue.textContent = brightnessRange.value;
    }

    function convertImage() {
        if (!currentFile) {
            showAlert('Please select an image first.', 'warning');
            return;
        }

        resultPlaceholder.classList.add('d-none');
        resultImageContainer.classList.add('d-none');
        loadingIndicator.classList.remove('d-none');

        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('contrast', contrastRange.value);
        formData.append('brightness', brightnessRange.value);

        fetch('/convert', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loadingIndicator.classList.add('d-none');
            if (data.success) {
                currentResultFilename = data.filename;
                resultImage.src = `/download/${data.filename}?preview=true`;
                resultImageContainer.classList.remove('d-none');
                showAlert('Image converted successfully!', 'success');
            } else {
                resultPlaceholder.classList.remove('d-none');
                showAlert(data.error || 'An error occurred during conversion.', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingIndicator.classList.add('d-none');
            resultPlaceholder.classList.remove('d-none');
            showAlert('An error occurred during conversion. Please try again.', 'danger');
        });
    }

    function downloadImage() {
        if (!currentResultFilename) {
            showAlert('No converted image available for download.', 'warning');
            return;
        }

        const downloadLink = document.createElement('a');
        downloadLink.href = `/download/${currentResultFilename}`;
        downloadLink.download = 'pencil_sketch.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    function showAlert(message, type) {
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);

        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const bsAlert = new bootstrap.Alert(alertElement);
                bsAlert.close();
            }
        }, 5000);
    }
});