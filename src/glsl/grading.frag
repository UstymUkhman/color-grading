precision highp float;

uniform sampler2D texture;
uniform sampler2D grading;

uniform int isLookup;

varying vec2 vUv;

#define LUT_FLIP_Y

vec4 lookup (in vec4 textureColor, in sampler2D lookupTable) {
  #ifndef LUT_NO_CLAMP
    textureColor = clamp(textureColor, 0.0, 1.0);
  #endif

  mediump float blueColor = textureColor.b * 63.0;

  mediump vec2 quad1;
  quad1.y = floor(floor(blueColor) / 8.0);
  quad1.x = floor(blueColor) - (quad1.y * 8.0);

  mediump vec2 quad2;
  quad2.y = floor(ceil(blueColor) / 8.0);
  quad2.x = ceil(blueColor) - (quad2.y * 8.0);

  highp vec2 texPos1;
  texPos1.x = (quad1.x * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * textureColor.r);
  texPos1.y = (quad1.y * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * textureColor.g);

  #ifdef LUT_FLIP_Y
    texPos1.y = 1.0 - texPos1.y;
  #endif

  highp vec2 texPos2;
  texPos2.x = (quad2.x * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * textureColor.r);
  texPos2.y = (quad2.y * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * textureColor.g);

  #ifdef LUT_FLIP_Y
    texPos2.y = 1.0 - texPos2.y;
  #endif

  lowp vec4 newColor1 = texture2D(lookupTable, texPos1);
  lowp vec4 newColor2 = texture2D(lookupTable, texPos2);

  lowp vec4 newColor = mix(newColor1, newColor2, fract(blueColor));
  return newColor;
}

vec4 sampleAs3DTexture(sampler2D texture, vec3 uv, float width) {
  float sliceSize = 1.0 / width;
  float innerWidth = width - 1.0;

  float slicePixelSize = sliceSize / width;
  float sliceInnerSize = slicePixelSize * innerWidth;

  float zSlice0 = min(floor(uv.z * width), innerWidth);
  float zSlice1 = min(zSlice0 + 1.0, innerWidth);

  float xOffset = slicePixelSize * 0.5 + uv.x * sliceInnerSize;

  float s0 = xOffset + (zSlice0 * sliceSize);
  float s1 = xOffset + (zSlice1 * sliceSize);

  float yPixelSize = sliceSize;
  float yOffset = yPixelSize * 0.5 + uv.y * (1.0 - yPixelSize);

  vec4 slice0Color = texture2D(texture, vec2(s0, uv.y));
  vec4 slice1Color = texture2D(texture, vec2(s1, uv.y));

  float zOffset = mod(uv.z * width, 1.0);
  return mix(slice0Color, slice1Color, zOffset);
}

void main (void) {
  vec4 color = texture2D(texture, vUv);
  vec4 gradedColor = color;

  if (isLookup == 1) {
    // 8 x 8 x 64 texture:
    gradedColor = lookup(color, grading);
  } else {
    // 16 x 16 x 16 texture:
    color.y = 1.0 - color.y;

    gradedColor = sampleAs3DTexture(grading, color.xyz, 16.0);
    gradedColor.a = color.a;
  }

  gl_FragColor = gradedColor;
}
