// #version 300 es
precision highp float;

#define texture texture2D

#include ./sample2DAs3DTexture.frag;
#include ./lookupFrom2DTexture.frag;

uniform sampler2D grading;
uniform sampler2D frame;
uniform bool isLookup;

// out vec4 fragColor;
// in vec2 vUv;

varying vec2 vUv;

void main (void) {
  vec4 color = texture(frame, vUv);
  vec4 gradedColor = color;

  if (isLookup == true) {
    // 8 x 8 x 64 texture:
    gradedColor = lookupFrom2DTexture(grading, color);
  } else {
    // Invert green coord for THREE.js:
    color.g = 1.0 - color.g;

    // 16 x 16 x 16 texture:
    gradedColor = sample2DAs3DTexture(grading, color.rgb, 16.0);
    gradedColor.a = color.a;
  }

  // fragColor = gradedColor;
  gl_FragColor = gradedColor;
}
