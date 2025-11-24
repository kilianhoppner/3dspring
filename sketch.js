/************************************
 * CONFIGURABLE PARAMETERS
 ************************************/

// Wire geometry
let WIRE_RADIUS      = 1.1;
let HELIX_RADIUS     = 22;
let HELIX_LENGTH     = 220;
let HELIX_TURNS      = 15;
let HELIX_SEGMENTS   = 300;
let TUBE_DETAIL      = 20;

// Camera / view
let CAM_ROT_X        = -0.2;
let CAM_ROT_Y        = 1.2;
let CAM_ROT_Y_SPEED  = 0.0008;
let CAM_DISTANCE     = -300;

// Mouse rotation deltas
let dragDX = 0;
let dragDY = 0;

// Material appearance
let BASE_COLOR       = [180, 185, 190];
let SPECULAR_COLOR   = [255, 255, 255];
let SHININESS        = 20;
let METALNESS        = 0.5;

// Background & lighting
let BG_COLOR         = [0, 0, 0];
let AMBIENT_LIGHT    = 25;
let KEY_LIGHT        = [255, 255, 255];
let RIM_LIGHT        = [200, 210, 220];
let FILL_LIGHT       = [150, 160, 170];


/************************************
 * p5.js
 ************************************/
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]);

  // Maintain correct perspective when resizing
  let fov = PI / 3;
  let aspect = width / height;
  perspective(fov, aspect, 1, 5000);

  // Multiple lights for metallic look
  ambientLight(AMBIENT_LIGHT);
  directionalLight(KEY_LIGHT[0], KEY_LIGHT[1], KEY_LIGHT[2], 0.5, -0.8, 0.5);
  directionalLight(RIM_LIGHT[0], RIM_LIGHT[1], RIM_LIGHT[2], -0.3, 0.5, -1);
  pointLight(FILL_LIGHT[0], FILL_LIGHT[1], FILL_LIGHT[2], 0, 200, 0);

  // Translate first → smaller rotation radius
  translate(0, 0, CAM_DISTANCE);

  // Apply rotation
  rotateX(CAM_ROT_X + dragDY);
  rotateY(CAM_ROT_Y + frameCount * CAM_ROT_Y_SPEED + dragDX);

  drawMetallicHelix();
}


/************************************
 * Mouse drag → rotate object
 ************************************/
function mouseDragged() {
  dragDX += movedX * 0.005;  // adjust sensitivity
  dragDY += movedY * 0.005;
}


/************************************
 * Metallic Wire Helix
 ************************************/
function drawMetallicHelix() {
  let ambientIntensity = 1.0 - (METALNESS * 0.5);
  ambientMaterial(
    BASE_COLOR[0] * ambientIntensity,
    BASE_COLOR[1] * ambientIntensity,
    BASE_COLOR[2] * ambientIntensity
  );

  specularMaterial(
    SPECULAR_COLOR[0] * METALNESS,
    SPECULAR_COLOR[1] * METALNESS,
    SPECULAR_COLOR[2] * METALNESS
  );
  shininess(SHININESS);

  for (let i = 0; i < HELIX_SEGMENTS; i++) {
    const t1 = i / HELIX_SEGMENTS;
    const t2 = (i + 1) / HELIX_SEGMENTS;

    const z1 = lerp(-HELIX_LENGTH/2, HELIX_LENGTH/2, t1);
    const z2 = lerp(-HELIX_LENGTH/2, HELIX_LENGTH/2, t2);

    const a1 = t1 * TWO_PI * HELIX_TURNS;
    const a2 = t2 * TWO_PI * HELIX_TURNS;

    const x1 = HELIX_RADIUS * cos(a1);
    const y1 = HELIX_RADIUS * sin(a1);

    const x2 = HELIX_RADIUS * cos(a2);
    const y2 = HELIX_RADIUS * sin(a2);

    const c1 = createVector(x1, y1, z1);
    const c2 = createVector(x2, y2, z2);

    const tangent = p5.Vector.sub(c2, c1).normalize();
    const radial1 = createVector(cos(a1), sin(a1), 0).normalize();
    const radial2 = createVector(cos(a2), sin(a2), 0).normalize();
    const bitangent1 = p5.Vector.cross(tangent, radial1).normalize();
    const bitangent2 = p5.Vector.cross(tangent, radial2).normalize();

    beginShape(TRIANGLE_STRIP);
    for (let k = 0; k <= TUBE_DETAIL; k++) {
      const ang = (TWO_PI * k) / TUBE_DETAIL;
      const cosAng = cos(ang);
      const sinAng = sin(ang);

      const offset1 = p5.Vector.add(
        p5.Vector.mult(radial1, WIRE_RADIUS * cosAng),
        p5.Vector.mult(bitangent1, WIRE_RADIUS * sinAng)
      );

      const offset2 = p5.Vector.add(
        p5.Vector.mult(radial2, WIRE_RADIUS * cosAng),
        p5.Vector.mult(bitangent2, WIRE_RADIUS * sinAng)
      );

      const p1 = p5.Vector.add(c1, offset1);
      const p2 = p5.Vector.add(c2, offset2);

      const n1 = offset1.copy().normalize();
      const n2 = offset2.copy().normalize();

      normal(n1.x, n1.y, n1.z);
      vertex(p1.x, p1.y, p1.z);

      normal(n2.x, n2.y, n2.z);
      vertex(p2.x, p2.y, p2.z);
    }
    endShape();
  }
}


/************************************
 * Mouse wheel → zoom along Z (INVERTED)
 ************************************/
function mouseWheel(event) {
  const SCROLL_Z_SCALE = 0.6;
  // inverted sign here so trackpad scroll direction is flipped
  CAM_DISTANCE -= event.delta * SCROLL_Z_SCALE;

  const MIN_Z = -2000;
  const MAX_Z = 2000;
  CAM_DISTANCE = constrain(CAM_DISTANCE, MIN_Z, MAX_Z);

  return false;
}