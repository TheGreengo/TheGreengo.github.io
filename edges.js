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
            orig.style.height = "450px";
            orig.style.width  = "auto";
    };
    reader.readAsDataURL(file);
  }
});

const SOBEL_X = [
    [-1,0,1],
    [-2,0,2],
    [-1,0,1]
];

const SOBEL_Y = [
    [-1,-2,-1],
    [ 0, 0, 0],
    [ 1, 2, 1]
];

// returns a 5x5 gaussian kernel matrix
function get_gauss(sigma) {
    let res = [];
    for (let i = 0; i < 5; i++) {
        res[i] = [0, 0, 0, 0, 0];
    }
    // r = exp(-1 /(2 * \sigma^2))
    let r     = Math.exp(-1 * (2 * (sigma * sigma)));
    let total = 0;
    // G'(x,y) = r^{x^2 + y^2}
    for (let i = -2; i < 3; i++) {
        for (let j = -2; j < 3; j++) {
            res[i + 2][j + 2] = r ** ((i * i) + (j * j));
            total  += r ** ((i * i) + (j * j));
        }
    }
    // then normalize
    for (let i = -2; i < 3; i++) {
        for (let j = -2; j < 3; j++) {
            res[i + 2][j + 2] /= total;
        }
    }
    return res;
}

// given a 5x5 matrix, an old image data, and a new one
// populate the new one with the resulting convolution
function mat_conv_5_5(n_data, o_data, h, w, kern) {
    // make new image data
    for (let i = 2; i < h - 2; i++) {
        for (let j = 2; j < w - 2; j++) {
            n_data[i][j] = 0;
            for (let k = -2; k < 3; k++) {
                for (let l = -2; l < 3; l++) {
                    n_data[i][j] += o_data[i+k][j+l] * kern[k+2][l+2];
                }
            }
        }
    }
}

function apply_thresh(three, h, w) {
    let thresh = document.getElementById("threshold").value;
    console.log(thresh);
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            if ((three[i][j] / 255) < thresh) {
                three[i][j] = 0;
            } else {
                three[i][j] = 255;
            }
        }
    }
}

// subtract the two matrices together and scale it to 255
function bitify_neg(one, two, three, h, w) {
    let tau = document.getElementById("tau").value;
    let maxi = 0;
    let mini = 0;
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            let temp = ((1 + tau) * one[i][j]) - (tau * two[i][j]);
            three[i][j] = temp;
            if (temp > maxi) {
                maxi = three[i][j];
            }
            if (temp < mini) {
                mini = three[i][j];
            }
        }
    }
    let thing = maxi - mini;
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            let temp = three[i][j] - mini;
            temp = temp / thing;
            three[i][j] = Math.trunc(temp * 255);
        }
    }
}

// add the two matrices together and scale it to 255
function bitify(one, two, three, h, w) {
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            three[i][j] = Math.sqrt(
                (one[i][j] * one[i][j]) +
                (two[i][j] * two[i][j])
            );
        }
    }
    let maxi = 0;
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            if (three[i][j] > maxi) {
                maxi = three[i][j];
            }
        }
    }
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            three[i][j] = Math.trunc((three[i][j] / maxi) * 255);
        }
    }
}

function get_2d(h, w) {
    res = [];
    for (let i = 0; i < h; i++) {
        res[i] = []
        for (let j = 0; j < w; j++) {
            res[i][j] = 0.0;
        }
    }
    return res;
}

function mat_conv_3_3(n_data, o_data, h, w, kern) {
    // make new image data
    for (let i = 1; i < h - 1; i++) {
        for (let j = 1; j < w - 1; j++) {
            n_data[i][j] = 0;
            for (let k = -1; k < 2; k++) {
                for (let l = -1; l < 2; l++) {
                    n_data[i][j] += o_data[i+k][j+l] * kern[k+1][l+1];
                }
            }
        }
    }
}

// Difference in Gaussians:
// - make 2 gaussian convolution kernels
//   - scalar on Gaussian
// - apply these 2
// - get the difference
// - apply a thresholding function?
// Equation: (1 - \tau)G_1 - \tau G_2
// - then T(u) = 1 if u > \eps else 0 
// - OR   T(u) = 1 if u > \eps else 1 + tanh(\phi * (u - \eps))

function thang() {
    height = orig.height;
    width  = orig.width
    nuev.height = height;
    nuev.width  = width;

    sig1 = document.getElementById("sig").value;
    k    = document.getElementById("k").value;
    sig2 = k * sig1;
    kern1 = get_gauss(sig1);
    kern2 = get_gauss(sig2);
    console.log(kern1);
    console.log(kern2);

    ctx1 = orig.getContext('2d');
    const old = ctx1.getImageData(0, 0, width, height);
    ctx2 = nuev.getContext('2d');
    let basic  = get_2d(height, width);
    let output = get_2d(height, width);
    let x_data = get_2d(height, width);
    let y_data = get_2d(height, width);
    const imageData = ctx2.createImageData(width, height);
    // here's where we populate the new data
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = 4 * (x + y * width);
            const oldbw = old.data.slice(index, index + 3);
            const obwsu = oldbw.reduce((a,b) => a + b);
            const old_f = Math.trunc(obwsu / 3);
            basic[y][x] = old_f;
        }
    }
    mat_conv_5_5(x_data, basic, height, width, kern1);
    console.log(x_data);
    mat_conv_5_5(y_data, basic, height, width, kern2);
    console.log(y_data);
    bitify_neg(y_data, x_data, output, height, width);
    apply_thresh(output, height, width);
    console.log(output);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = 4 * (x + y * width);
            imageData.data[index]     = output[y][x];
            imageData.data[index + 1] = output[y][x];
            imageData.data[index + 2] = output[y][x];
            imageData.data[index + 3] = 255;
        }
    }
    ctx2.putImageData(imageData, 0, 0);
    nuev.style.height = "450px";
    nuev.style.width  = "auto";
    console.log("Clickity clackity");
}

function thing() {
    height = orig.height;
    width  = orig.width
    nuev.height = height;
    nuev.width  = width;
    ctx1 = orig.getContext('2d');
    const old = ctx1.getImageData(0, 0, width, height);
    ctx2 = nuev.getContext('2d');
    let basic  = get_2d(height, width);
    let output = get_2d(height, width);
    let x_data = get_2d(height, width);
    let y_data = get_2d(height, width);
    const imageData = ctx2.createImageData(width, height);
    // here's where we populate the new data
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = 4 * (x + y * width);
            const oldbw = old.data.slice(index, index + 3);
            const obwsu = oldbw.reduce((a,b) => a + b);
            const old_f = Math.trunc(obwsu / 3);
            basic[y][x] = old_f;
        }
    }
    mat_conv_3_3(x_data, basic, height, width, SOBEL_X);
    mat_conv_3_3(y_data, basic, height, width, SOBEL_Y);
    bitify(x_data, y_data, output, height, width);
    console.log(x_data);
    console.log(y_data);
    console.log(output);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = 4 * (x + y * width);
            imageData.data[index]     = output[y][x];
            imageData.data[index + 1] = output[y][x];
            imageData.data[index + 2] = output[y][x];
            imageData.data[index + 3] = 255;
        }
    }
    ctx2.putImageData(imageData, 0, 0);
    nuev.style.height = "450px";
    nuev.style.width  = "auto";
    console.log("Clickity clackity");
}

// Right now, this grabs the old image data and 
document.getElementById('img_conv').addEventListener('click', thang);
