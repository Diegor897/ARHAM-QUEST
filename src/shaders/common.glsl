float lerp(float a, float b, float t) {
  return a * (1.0 - t) + b * t;
}

vec3 lerp(vec3 a, vec3 b, float t) {
  return a * (1.0 - t) + b * t;
}

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

vec2 saturate2(vec2 x) {
  return clamp(x, vec2(0.0), vec2(1.0));
}

vec3 saturate3(vec3 x) {
  return clamp(x, vec3(0.0), vec3(1.0));
}


float linearstep(float minValue, float maxValue, float v) {
  return clamp((v - minValue) / (maxValue - minValue), 0.0, 1.0);
}

float inverseLerp(float minValue, float maxValue, float v) {
  return (v - minValue) / (maxValue - minValue);
}

float inverseLerpSat(float minValue, float maxValue, float v) {
  return saturate((v - minValue) / (maxValue - minValue));
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(inMin, inMax, v);
  return mix(outMin, outMax, t);
}

vec3 LINEAR_TO_GAMMA(vec3 value) {
  vec3 colour = pow(value, vec3(1.0 / 2.2));

	return colour;
}

vec3 GAMMA_TO_LINEAR(vec3 value) {
  vec3 colour = pow(value, vec3(2.2));

	return colour;
}


float easeOut(float x, float t) {
	return 1.0 - pow(1.0 - x, t);
}

float easeIn(float x, float t) {
	return pow(x, t);
}


mat2 rotate2D(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

// Rotation matrix around the X axis.
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}

// Rotation matrix around the Y axis.
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

// Rotation matrix around the Z axis.
mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0),
        vec3(s, c, 0),
        vec3(0, 0, 1)
    );
}

mat3 rotateAxis(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
  );
}

float getDepth( const in vec2 screenPosition ) {
  return texture2D( tDepth, screenPosition ).x;
}

float getViewZ( const in float depth ) {
  #if ORTHOGRAPHIC_CAMERA == 1
    return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
  #else
    return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
  #endif
}

vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
  float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
  vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
  clipPosition *= clipW; // unprojection.

  return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
}

vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition ) {
  return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
}

vec4 alphaBlend(vec4 top, vec4 bottom) {
  vec3 color = (top.rgb * top.a) + (bottom.rgb * (1.0 - top.a));
  float alpha = top.a + bottom.a * (1.0 - top.a);

  return vec4(color, alpha);
}