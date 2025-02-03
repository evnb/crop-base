document.addEventListener('DOMContentLoaded', function () {
    const image = document.getElementById('image');
    const preview = document.getElementById('preview');
    const fileInput = document.getElementById('fileInput');
    // Add references to the info elements
    const cropX = document.getElementById('cropX');
    const cropY = document.getElementById('cropY');
    const cropWidth = document.getElementById('cropWidth');
    const cropHeight = document.getElementById('cropHeight');
    let cropper = null;

    // Initialize cropper options
    const cropperOptions = {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        modal: false,
        guides: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        zoomOnWheel: true,
        wheelZoomRatio: 0.1,
        crop(event) {
            // Round and update the display
            const x = Math.round(event.detail.x);
            const y = Math.round(event.detail.y);
            const width = Math.round(event.detail.width);
            const height = Math.round(event.detail.height);
            
            cropX.textContent = x;
            cropY.textContent = y;
            cropWidth.textContent = width;
            cropHeight.textContent = height;

            event.detail.x = x;
            event.detail.y = y;
            event.detail.width = width;
            event.detail.height = height;
        },
        zoom(event) {
            // Store both crop box and crop data before zoom
            const cropBoxData = cropper.getCropBoxData();
            const cropData = cropper.getData(true); // true = rounded values
            
            console.log('Zoom ratio:', event.detail.ratio);
            console.log('Crop data before zoom:', cropData);
            
            setTimeout(() => {
                // Restore both the visual box and the actual crop coordinates
                cropper.setData(cropData);
                cropper.setCropBoxData(cropBoxData);
            }, 0);
        },
        ready() {
            const cropBoxData = cropper.getCropBoxData();
            cropBoxData.left = Math.round(cropBoxData.left);
            cropBoxData.top = Math.round(cropBoxData.top);
            cropBoxData.width = Math.round(cropBoxData.width);
            cropBoxData.height = Math.round(cropBoxData.height);
            cropper.setCropBoxData(cropBoxData);
        }
    };

    // Handle file input
    fileInput.addEventListener('change', function (e) {
        const files = e.target.files;
        if (!files || !files[0]) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            image.src = e.target.result;
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(image, cropperOptions);
        };
        reader.readAsDataURL(files[0]);
    });

    // Handle toolbar buttons
    document.querySelector('.toolbar').addEventListener('click', function (event) {
        const target = event.target.closest('button[data-method]');
        if (!target || !cropper) return;

        const method = target.dataset.method;
        switch (method) {
            case 'crop':
                const croppedCanvas = cropper.getCroppedCanvas({
                    imageSmoothingEnabled: false
                });
                preview.src = croppedCanvas.toDataURL('image/png');
                break;
            case 'download':
                if (preview.src) {
                    const link = document.createElement('a');
                    link.download = 'cropped-image.png';
                    link.href = preview.src;
                    link.click();
                }
                break;
            case 'reset':
                cropper.reset();
                preview.src = '';
                break;
        }
    });
}); 