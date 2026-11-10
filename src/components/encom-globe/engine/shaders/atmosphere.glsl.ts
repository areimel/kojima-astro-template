export const atmosphereVertex = /* glsl */ `
#include <fog_pars_vertex>
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

export const atmosphereFragment = /* glsl */ `
#include <fog_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  // BackSide: normals face away, so flip for the fresnel term.
  float fres = pow(clamp(dot(-vNormal, vViewDir), 0.0, 1.0), 2.5);
  float alpha = fres * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
  #ifdef USE_FOG
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    gl_FragColor.a *= (1.0 - fogFactor);
  #endif
}
`;
