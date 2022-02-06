function createModel(_vertices, _uvs, _normals, _faces) {
  let length = _faces.length;
  function getFace(index) {
    let face = [];
    for (let i = 0; i < 3; i++) {
      face.push({
        vertice: _vertices[_faces[index - 1][i][0] - 1],
        uv: _uvs[_faces[index - 1][i][1] - 1],
        normal: _normals[_faces[index - 1][i][2] - 1],
      });
    }
    return face;
  }
  return { getFace, length };
}

async function createTexture(url, width, height) {
  let dom_canvas = document.createElement("canvas");
  dom_canvas.width = width;
  dom_canvas.height = height;
  let ctx = dom_canvas.getContext("2d");

  function getTexture(uv) {
    let u = uv[0] * width;
    let v = uv[1] * height;
    let color = [];
    let index = (Math.floor(u) + Math.floor(v) * width) * 4;
    for (let i = 0; i < 4; i++) {
      color.push(img_data[index + i] / 255);
    }
    return color;
  }

  let img_data = await new Promise((resolve, reject) => {
    let texture = new Image(width, height);
    texture.src = url;
    texture.onload = () => {
      ctx.drawImage(texture, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height).data);
    };
    texture.onerror = () => reject("Texture Error....");
  });

  return getTexture;
}

function createCanvas(targetDom, width, height) {
  let dom_canvas = document.createElement("canvas");
  let ctx = dom_canvas.getContext("2d");
  let frameBuffer = ctx.getImageData(0, 0, width, height);
  dom_canvas.width = width;
  dom_canvas.height = height;
  dom_canvas.style = "background-color:black";
  targetDom.appendChild(dom_canvas);

  function drawPixel(x, y, color) {
    let index = (Math.floor(x) + Math.floor(y) * width) * 4;
    for (let i = 0; i < 4; i++) {
      frameBuffer.data[index + i] = color[i] * 255;
    }
  }

  function draw() {
    ctx.putImageData(frameBuffer, 0, 0);
  }

  function clear() {
    ctx.clearRect(0, 0, width, height);
    frameBuffer = ctx.getImageData(0, 0, width, height);
  }

  return { drawPixel, draw, clear };
}
