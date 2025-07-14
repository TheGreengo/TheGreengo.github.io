console.log("Edge-detection script");
const orig = document.getElementById('orig');
const nuev = document.getElementById('nuevo');

document.getElementById('img-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload  = function(e) {
            ctx        = orig.getContext('2d');
            const img  = new Image();
            img.src    = e.target.result;
            img.onload = () => {
                orig.height = img.height;
                orig.width  = img.width;
                ctx.drawImage(img, 0, 0);
            }
            orig.style.height = "300px";
            orig.style.width  = "auto";
    };
    reader.readAsDataURL(file);
  }
});

// Right now, this grabs the old image data and 
document.getElementById('img_conv').addEventListener('click', 
    function () {
        height = orig.height;
        width  = orig.width
        nuev.height = height;
        nuev.width  = width;
        ctx1 = orig.getContext('2d');
        const old = ctx1.getImageData(0, 0, width, height);
        ctx2 = nuev.getContext('2d');
        const imageData = ctx2.createImageData(width, height);
        // here's where we populate the new data
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = 4 * (x + y * width);
                const oldin = (4 * width * height) - index;
                imageData.data[index]     = old.data[oldin];
                imageData.data[index + 1] = old.data[oldin + 1];
                imageData.data[index + 2] = old.data[oldin + 2];
                imageData.data[index + 3] = old.data[oldin + 3];
            }
        }
        ctx2.putImageData(imageData, 0, 0);
        nuev.style.height = "300px";
        nuev.style.width  = "auto";
        console.log("Clickity clackity");
    }
);
