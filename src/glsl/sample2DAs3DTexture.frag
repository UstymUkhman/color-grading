precision highp float;

vec4 sample2DAs3DTexture (sampler2D lut, vec3 color, float width) {
  float sliceSize = 1.0 / width;
  float innerWidth = width - 1.0;

  float slicePixelSize = sliceSize / width;
  float sliceInnerSize = slicePixelSize * innerWidth;

  float zSlice0 = min(floor(color.b * width), innerWidth);
  float zSlice1 = min(zSlice0 + 1.0, innerWidth);

  float xOffset = slicePixelSize * 0.5 + color.r * sliceInnerSize;

  float s0 = xOffset + (zSlice0 * sliceSize);
  float s1 = xOffset + (zSlice1 * sliceSize);

  float yPixelSize = sliceSize;
  float yOffset = yPixelSize * 0.5 + color.g * (1.0 - yPixelSize);

  vec4 slice0Color = texture(lut, vec2(s0, color.g));
  vec4 slice1Color = texture(lut, vec2(s1, color.g));

  float zOffset = mod(color.b * width, 1.0);
  return mix(slice0Color, slice1Color, zOffset);
}
