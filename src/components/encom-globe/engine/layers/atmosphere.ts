import { AdditiveBlending, BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, UniformsLib, UniformsUtils } from "three";

import { atmosphereFragment, atmosphereVertex } from "../shaders/atmosphere.glsl";
import type { EngineContext, GlobeLayer, Palette } from "../types";
import { disposeObject } from "../utils/dispose";
import { GLOBE_RADIUS } from "../utils/geo";

/** Subtle fresnel glow shell around the globe (optional, off by default). */
export function createAtmosphereLayer(ctx: EngineContext): GlobeLayer {
  const material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      { uColor: { value: new Color(ctx.palette.atmosphere) }, uIntensity: { value: 0.6 } },
    ]),
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  const mesh = new Mesh(new SphereGeometry(GLOBE_RADIUS * 1.12, 64, 48), material);
  mesh.name = "atmosphere";

  return {
    name: "atmosphere",
    object: mesh,
    update() {},
    setPalette(p: Palette) {
      (material.uniforms.uColor.value as Color).set(p.atmosphere);
    },
    dispose() {
      disposeObject(mesh);
    },
  };
}
