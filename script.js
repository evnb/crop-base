document.addEventListener('DOMContentLoaded', function () {
    const imageInput = document.getElementById('imageInput');
    const image = document.getElementById('image');
    const cropButton = document.getElementById('cropButton');
    const canvas = document.getElementById('canvas');
    let cropper;

    imageInput.addEventListener('change', function (event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.onload = function (e) {
                image.src = e.target.result;
                if (cropper) {
                    cropper.destroy();
                }
                cropper = new Cropper(image, {
                    aspectRatio: 16 / 9,
                    viewMode: 1,
                });
            };
            reader.readAsDataURL(files[0]);
        }
    });

    cropButton.addEventListener('click', function () {
        if (cropper) {
            const croppedCanvas = cropper.getCroppedCanvas();
            canvas.width = croppedCanvas.width;
            canvas.height = croppedCanvas.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(croppedCanvas, 0, 0);
            // You can now use the cropped image data
            const croppedImageDataURL = canvas.toDataURL('image/png');
            console.log(croppedImageDataURL);
            // Optionally, you can display or download the cropped image
        }
    });
}); 