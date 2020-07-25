precision highp float;

#define LUT_FLIP_Y

vec4 lookupFrom2DTexture (sampler2D lut, vec4 color) {
  #ifndef LUT_NO_CLAMP
    color = clamp(color, 0.0, 1.0);
  #endif

  mediump float blueColor = color.b * 63.0;

  mediump vec2 quad1;
  quad1.y = floor(floor(blueColor) / 8.0);
  quad1.x = floor(blueColor) - (quad1.y * 8.0);

  mediump vec2 quad2;
  quad2.y = floor(ceil(blueColor) / 8.0);
  quad2.x = ceil(blueColor) - (quad2.y * 8.0);

  highp vec2 texPos1;
  texPos1.x = (quad1.x * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.r);
  texPos1.y = (quad1.y * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.g);

  #ifdef LUT_FLIP_Y
    texPos1.y = 1.0 - texPos1.y;
  #endif

  highp vec2 texPos2;
  texPos2.x = (quad2.x * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.r);
  texPos2.y = (quad2.y * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.g);

  #ifdef LUT_FLIP_Y
    texPos2.y = 1.0 - texPos2.y;
  #endif

  lowp vec4 color1 = texture2D(lut, texPos1);
  lowp vec4 color2 = texture2D(lut, texPos2);

  return mix(color1, color2, fract(blueColor));
}
