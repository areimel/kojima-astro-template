/**
 * Port of the original encom-globe point shader (intro sweep) onto instanced
 * tiles. Each instance carries its tile longitude (`lng`) and colour
 * (`tileColor`); the sweep runs west to east over `introDuration`.
 */
export const hexGridVertex = /* glsl */ `
#include <fog_pars_vertex>

attribute float lng;
attribute vec3 tileColor;

uniform float currentTime;
uniform float introDuration;
uniform float introAltitude;

varying vec3 vColor;
varying float vOpacity;

void main() {
  vec3 newPos = (instanceMatrix * vec4(position, 1.0)).xyz;
  float opacityVal = 0.0;
  float introStart = introDuration * ((180.0 + lng) / 360.0);
  float hover = introDuration / 8.0;

  if (currentTime > introStart) {
    opacityVal = 1.0;
  }
  if (currentTime > introStart && currentTime < introStart + hover) {
    newPos *= introAltitude;
    opacityVal = 0.3;
  }
  if (currentTime > introStart + hover && currentTime < introStart + hover + 200.0) {
    newPos *= 1.0 + ((introAltitude - 1.0) * (1.0 - (currentTime - introStart - hover) / 200.0));
  }

  vColor = tileColor;
  vOpacity = opacityVal;
  vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

export const hexGridFragment = /* glsl */ `
#include <fog_pars_fragment>

uniform float opacity;

varying vec3 vColor;
varying float vOpacity;

void main() {
  float alpha = vOpacity * opacity;
  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(vColor, alpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
  #ifdef USE_FOG
    gl_FragColor.a *= (1.0 - fogFactor);
  #endif
}
`;
