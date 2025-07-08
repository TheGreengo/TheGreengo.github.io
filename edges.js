console.log("Edge-detection script")

document.getElementById('img-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const orig = document.getElementById('original');

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
        orig.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

