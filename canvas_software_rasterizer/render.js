function verticeShader(pts, m, v, p) {
  pts = glMatrix.vec4.fromValues(...pts, 1);  //转为齐次坐标
  let mv = glMatrix.mat4.create();  //世界坐标和摄影机坐标转换
  glMatrix.mat4.mul(mv, v, m);
  let mvp = glMatrix.mat4.create();
  glMatrix.mat4.mul(mvp, p, mv);

  let clip_position = glMatrix.vec4.create();
  glMatrix.vec4.transformMat4(clip_position, pts, mvp);
  return clip_position;
}

function faceCulling(pts) {
  //背面剔除, 返回fasle为需要被剔除
  let p0 = glMatrix.vec3.create();
  glMatrix.vec3.negate(p0, pts[0]);

  let p0p1 = glMatrix.vec3.create();
  glMatrix.vec3.add(p0p1, pts[1], p0);

  let p0p2 = glMatrix.vec3.create();
  glMatrix.vec3.add(p0p2, pts[2], p0);

  let n = glMatrix.vec3.create();
  glMatrix.vec3.cross(n, p0p1, p0p2);
  glMatrix.vec3.normalize(n, n);

  return glMatrix.vec3.dot(n, glMatrix.vec3.fromValues(0, 0, -1)) > 0 ? true : false;
}

//简单齐次裁剪函数, false为需要裁剪
function clipSpaceCull(pts, near, far) {
  let [x, y, z, w] = pts;
  if (w >= near && w <= far && x >= -w && x <= w && y >= -w && y <= w &&
      z >= -w && z <= w)
    return true;
  return false;
}

//视口变换
function viewPort(pts, w, h) {
  let viewTrans = glMatrix.mat4.fromValues(
      w / 2, 0, 0, 0, 0, -h / 2, 0, 0, 0, 0, 1, 0, w / 2, h / 2, 0, 1);

  let viewport_position = [];

  pts.forEach((el) => {
    let pt = glMatrix.vec4.fromValues(el[0], el[1], el[2], 1);
    let v_pt = glMatrix.vec4.create();

    glMatrix.vec4.transformMat4(v_pt, pt, viewTrans);

    v_pt = glMatrix.vec3.fromValues(v_pt[0], v_pt[1], v_pt[2]);
    viewport_position.push(v_pt);
  });
  return viewport_position;
}

//计算重新坐标
function barycentric(A, B, C, P) {
  let s = []
  for(let i = 0; i < 2; i++) {
    let tmp = glMatrix.vec3.create()
    tmp[0] = C[i]-A[i]
    tmp[1] = B[i]-A[i]
    tmp[2] = A[i]-P[i]
    s.push(tmp)
  }

  let u = glMatrix.vec3.create()
  glMatrix.vec3.cross(u, s[0], s[1])

  if ( Math.floor(Math.abs(u[2])) != 0 ) {
    let result = glMatrix.vec3.fromValues(1-(u[0]+u[1])/u[2], u[1]/u[2], u[0]/u[2])
    return result
  }

  return glMatrix.vec3.fromValues(-1, -1, -1)

}

function triangle_raster(pts, uvs, normals, light_dir, zBuffer, width, getTexture, fragementShader, drawPixel) {
  let bboxmin = [Infinity, Infinity]
  let bboxmax = [-Infinity, -Infinity]
  for(let i = 0; i < 3; i++) {               //找到三角形面的边框
    for(let j = 0; j < 2; j++) {
      bboxmin[j] = Math.min(bboxmin[j], pts[i][j])
      bboxmax[j] = Math.max(bboxmax[j], pts[i][j])
    }
  }
  
  let p = glMatrix.vec2.create()


  for (p[0] = Math.floor(bboxmin[0]); p[0] <= bboxmax[0]; p[0]++) {
    for(p[1] = Math.floor(bboxmin[1]); p[1] <= bboxmax[1]; p[1]++) {
      let c = barycentric(pts[0], pts[1], pts[2], p) //由重心坐标得到的权值


      let z = pts[0][2]*c[0] + pts[1][2]*c[1] + pts[2][2]*c[2]  //插值出P的深度值

      if (c[0] < 0 || c[1] < 0 || c[2] < 0 || zBuffer[Math.floor(p[0]) + Math.floor(p[1])*width] > z) 
        continue;

      zBuffer[Math.floor(p[0]) + Math.floor(p[1])* width] = z;

      let uv = glMatrix.vec3.create()           //插值出P的uv坐标
      glMatrix.vec3.transformMat3(uv, c, uvs)

      let normal = glMatrix.vec3.create()       //插值出P的法线向量
      glMatrix.vec3.normalize(normal, normal)
      glMatrix.vec3.transformMat3(normal, c, normals)

      glMatrix.vec3.normalize(light_dir, light_dir)
      drawPixel(p[0], p[1], fragementShader(uv, getTexture, normal, light_dir))
    }
  }
}

function fragementShader(uv, texture, normal, light_dir){
    let color = texture(uv)
    let intensity = glMatrix.vec3.dot(normal, light_dir)
    glMatrix.vec3.scale(color, color, intensity)
    return color
}