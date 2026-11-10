/** Smoke shaders, ported from encom-globe `SmokeProvider.js` (WebGL2/three r187 form). */

export const smokeVertexShader = /* glsl */ `
#define PI 3.141592653589793238462643
#define DISTANCE 500.0
attribute float myStartTime;
attribute float myStartLat;
attribute float myStartLon;
attribute float altitude;
attribute float isActive;
uniform float currentTime;
uniform float pixelRatio;
uniform vec3 color;
varying vec4 vColor;
#include <fog_pars_vertex>

// Same convention as latLngToVector3 (theta = 180 - lng).
vec3 getPos(float lat, float lon) {
  if (lon < -180.0) {
    lon = lon + 360.0;
  }
  float phi = (90.0 - lat) * PI / 180.0;
  float theta = (180.0 - lon) * PI / 180.0;
  return vec3(
    DISTANCE * sin(phi) * cos(theta) * altitude,
    DISTANCE * cos(phi) * altitude,
    DISTANCE * sin(phi) * sin(theta) * altitude
  );
}

void main() {
  float dt = currentTime - myStartTime;
  if (dt < 0.0) {
    dt = 0.0;
  }
  if (dt > 0.0 && isActive > 0.0) {
    dt = mod(dt, 1500.0);
  }
  float opacity = 1.0 - dt / 1500.0;
  if (dt == 0.0 || isActive == 0.0) {
    opacity = 0.0;
  }
  vec3 newPos = getPos(myStartLat, myStartLon - (dt / 50.0));
  vColor = vec4(color, opacity);
  vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
  gl_PointSize = (2.5 - dt / 1500.0) * pixelRatio;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

export const smokeFragmentShader = /* glsl */ `
varying vec4 vColor;
#include <fog_pars_fragment>

void main() {
  gl_FragColor = vColor;
  #include <colorspace_fragment>
  #include <fog_fragment>
  #ifdef USE_FOG
    gl_FragColor.a *= 1.0 - fogFactor;
  #endif
}
`;
