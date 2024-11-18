#include <common>
#include <packing>
#include <fog_pars_fragment>

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

varying vec3 vGrassColour;
varying vec4 vGrassParams;

float easeIn(float x, float t) {
	return pow(x, t);
}

void main() {
  #include <clipping_planes_fragment>
  
  vec4 color = vec4(1.0);

  float heightPercent = vGrassParams.x;
  float height = vGrassParams.y;
	float lodFadeIn = vGrassParams.z;
	float lodFadeOut = 1.0 - lodFadeIn;

  float grassMiddle = mix(smoothstep(abs(vGrassParams.w - 0.5), 0.0, 0.1), 1.0, lodFadeIn);

  float ao = mix(mix(1.0, 0.25, 1.0), 1.0, easeIn(heightPercent, 2.0));

  color.rgb *= vGrassColour;
  color.rgb *= mix(0.85, 1.0, grassMiddle);
  //color.rgb *= ao;

  gl_FragColor.rgba = color;
}