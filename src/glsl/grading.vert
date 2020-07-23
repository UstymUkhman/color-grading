#version 300 es
precision mediump float;

out vec2 vUv;

void main (void) {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
}
