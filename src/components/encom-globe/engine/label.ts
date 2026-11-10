import type { Object3D, Vector3 } from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

import type { Label } from "./types";

/** DOM label (CSS2D) attached to `parent`; opacity/visibility writes are skipped when unchanged. */
export function createLabel(parent: Object3D, text: string, position: Vector3, className?: string): Label {
  const element = document.createElement("div");
  element.className = className ? `encom-globe__label ${className}` : "encom-globe__label";
  element.textContent = text;
  const object = new CSS2DObject(element);
  object.position.copy(position);
  parent.add(object);
  let opacity: number | null = null;
  return {
    object,
    element,
    setText: (t) => {
      element.textContent = t;
    },
    setOpacity: (o) => {
      if (o === opacity) return;
      opacity = o;
      element.style.opacity = String(o);
    },
    setVisible: (v) => {
      if (object.visible !== v) object.visible = v;
    },
    dispose: () => {
      object.removeFromParent();
      element.remove();
    },
  };
}
