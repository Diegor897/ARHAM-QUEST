
#include <common>
#include <packing>
#include <fog_pars_fragment>

varying vec2 vUv;

uniform sampler2D tDepth;
uniform sampler2D tNoise;
uniform sampler2D tNormal;

uniform vec3 normal;

uniform vec3 foamColor;
uniform vec3 shallowWaterColor;
uniform vec3 deepWaterColor;

uniform vec2 foamScrollSpeed;
uniform float minFoamDistance;
uniform float maxFoamDistance;
uniform float maxDepthDiff;

uniform float cameraNear;
uniform float cameraFar;
uniform mat4 cameraProjectionMatrix;
uniform mat4 cameraInverseProjectionMatrix;
uniform vec2 resolution;

uniform float time;

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

float lerp(float a, float b, float t) {
  return a * (1.0 - t) + b * t;
}

vec3 lerp(vec3 a, vec3 b, float t) {
  return a * (1.0 - t) + b * t;
}

vec4 alphaBlend(vec4 top, vec4 bottom) {
  vec3 color = (top.rgb * top.a) + (bottom.rgb * (1.0 - top.a));
  float alpha = top.a + bottom.a * (1.0 - top.a);

  return vec4(color, alpha);
}

void main() {
  vec2 screenUV = gl_FragCoord.xy / resolution;

  // Get depth difference between current fragment and scene
  float existingDepth = getDepth( screenUV );
  float existingLinearEyeDepth = getViewZ( existingDepth );

  // Calculate angle between the water and the rest of the scene
  vec3 viewPosition = getViewPosition( screenUV, existingDepth, existingLinearEyeDepth );
  vec3 centerViewNormal = getViewNormal( viewPosition, screenUV );
  float normalDot = saturate(dot(centerViewNormal, normal));

  // Calculate water color
  float fragmentLinearEyeDepth = getViewZ( gl_FragCoord.z );
  float waterDepthDifference = fragmentLinearEyeDepth - existingLinearEyeDepth;
  float waterDepthDifference01 = saturate(waterDepthDifference / maxDepthDiff);
  vec4 waterColor = vec4(lerp(shallowWaterColor, deepWaterColor, waterDepthDifference01), 1.0);

  // Add foam using noise texture
  vec2 noiseUV = vec2(vUv.x + time * foamScrollSpeed.x, vUv.y + time * foamScrollSpeed.y);
  float surfaceNoiseSample = texture2D(tNoise, noiseUV).r;

  // Add shoreline foam
  float foamDistance = lerp(maxFoamDistance, minFoamDistance, normalDot);
  float foamDepthDifference01 = saturate(waterDepthDifference / foamDistance);
  float surfaceNoiseCutoff = foamDepthDifference01 * 0.777;
  float surfaceNoise = surfaceNoiseSample > surfaceNoiseCutoff ? 1.0 : 0.0;

  vec4 surfaceNoiseColor = vec4(foamColor, 1.0);
  surfaceNoiseColor.a *= surfaceNoise;

  // Blend surface noise with water color
  gl_FragColor.rgba = alphaBlend(surfaceNoiseColor, waterColor);
  gl_FragColor.a = 1.0;
}