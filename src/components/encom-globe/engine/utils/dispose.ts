import type { Material, Object3D, Texture } from "three";

function disposeMaterial(material: Material) {
  for (const value of Object.values(material)) {
    if (value && typeof value === "object" && (value as Texture).isTexture) {
      (value as Texture).dispose();
    }
  }
  const uniforms = (material as { uniforms?: Record<string, { value: unknown }> })
    .uniforms;
  if (uniforms) {
    for (const u of Object.values(uniforms)) {
      const v = u.value as Texture | undefined;
      if (v && typeof v === "object" && v.isTexture) v.dispose();
    }
  }
  material.dispose();
}

/**
 * Recursively dispose geometries, materials and textures under `root`,
 * remove DOM nodes of CSS2D labels, and detach it from its parent.
 */
export function disposeObject(root: Object3D): void {
  root.traverse((node) => {
    const mesh = node as Object3D & {
      geometry?: { dispose(): void };
      material?: Material | Material[];
      element?: HTMLElement;
      isCSS2DObject?: boolean;
    };
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach(disposeMaterial);
    else if (mesh.material) disposeMaterial(mesh.material);
    if (mesh.isCSS2DObject) mesh.element?.remove();
  });
  root.removeFromParent();
}
