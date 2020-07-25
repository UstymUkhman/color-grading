precision highp float;

#include ./sample2DAs3DTexture.frag;
#include ./lookupFrom2DTexture.frag;

uniform sampler2D grading;
uniform sampler2D frame;
uniform bool isLookup;

varying vec2 vUv;

void main (void) {
  vec4 color = texture2D(frame, vUv);

  // 8 x 8 x 64 texture:
  if (isLookup == true) {
    gl_FragColor = lookupFrom2DTexture(grading, color);
  }

  // 16 x 16 x 16 texture:
  else {
    // Invert green coord for THREE.js:
    color.g = 1.0 - color.g;
    gl_FragColor = sample2DAs3DTexture(grading, color.rgb, 16.0);
  }
}
