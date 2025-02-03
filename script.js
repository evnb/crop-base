document.addEventListener('DOMContentLoaded', function () {
    const image = document.getElementById('image');
    const fileInput = document.getElementById('fileInput');
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
        zoom(event) {
            const cropBoxData = cropper.getCropBoxData();
            event.detail.ratio;
            
            setTimeout(() => {
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
        },
        crop(event) {
            event.detail.x = Math.round(event.detail.x);
            event.detail.y = Math.round(event.detail.y);
            event.detail.width = Math.round(event.detail.width);
            event.detail.height = Math.round(event.detail.height);
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
                const dataUrl = croppedCanvas.toDataURL('image/png');
                // You can handle the cropped image data here
                console.log('Cropped image data:', dataUrl);
                break;
            case 'reset':
                cropper.reset();
                break;
        }
    });
}); 