"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";

/** One textured mesh rotates continuously; there is no image swap at the front. */
export function GarmentModel({ model, fallback, angle, reduced }: { model: string; fallback: string; angle: number; reduced: boolean }) {
  const host = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const rotation = useMotionValue(angle);
  useEffect(() => {
    const motion = animate(rotation, angle, reduced ? { duration: 0 } : { type: "spring", stiffness: 115, damping: 24, mass: .85 });
    return () => motion.stop();
  }, [angle, reduced, rotation]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(async entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      try {
        const [THREE, { GLTFLoader }] = await Promise.all([import("three"), import("three/addons/loaders/GLTFLoader.js")]);
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(280, 360, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.8, -1.8, .1, 20);
        camera.position.set(0, 0, 8);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xb3afa5, 2.4));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(-3, 4, 5); scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 1.1);
        fill.position.set(3, 1, -4); scene.add(fill);
        const pivot = new THREE.Group(); scene.add(pivot);
        const render = () => { pivot.rotation.y = rotation.get() * Math.PI / 180; renderer.render(scene, camera); };
        const unsubscribe = rotation.on("change", render);
        const disposeModel = (root: import("three").Object3D) => root.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
            if (material.userData.backPrint) material.userData.backPrint.dispose();
            material.dispose();
          }
        });
        cleanup = () => { unsubscribe(); disposeModel(pivot); renderer.dispose(); renderer.domElement.remove(); };
        const gltf = await new GLTFLoader().loadAsync(model);
        if (disposed) { disposeModel(gltf.scene); return; }
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const size = bounds.getSize(new THREE.Vector3());
        const centre = bounds.getCenter(new THREE.Vector3());
        // Preserve the supplied back print: reconstruction omitted this artwork.
        const backPrint = await new THREE.TextureLoader().loadAsync(model.replace("garment.glb", "back.png"));
        if (disposed) { backPrint.dispose(); disposeModel(gltf.scene); return; }
        backPrint.colorSpace = THREE.SRGBColorSpace;
        gltf.scene.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            material.userData.backPrint = backPrint;
            material.onBeforeCompile = (shader: import("three").WebGLProgramParametersWithUniforms) => {
              shader.uniforms.backPrint = { value: backPrint };
              shader.uniforms.printBounds = { value: new THREE.Vector4(centre.x, bounds.min.y, size.x, size.y) };
              shader.vertexShader = "varying vec3 garmentPosition; varying vec3 garmentNormal;\n" + shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ngarmentPosition = position; garmentNormal = normal;");
              shader.fragmentShader = "uniform sampler2D backPrint; uniform vec4 printBounds; varying vec3 garmentPosition; varying vec3 garmentNormal;\n" + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
                vec2 printUv = vec2(0.5 - (garmentPosition.x - printBounds.x) / printBounds.z * 0.945, (garmentPosition.y - printBounds.y) / printBounds.w * 0.82 + 0.083);
                vec4 artwork = texture2D(backPrint, printUv);
                float ink = smoothstep(0.55, 0.8, min(artwork.r, min(artwork.g, artwork.b))) * artwork.a;
                ink *= 1.0 - smoothstep(-0.65, -0.2, garmentNormal.z);
                diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.91), ink);
              `);
            };
          }
        });
        const scale = 2.85 / size.y;
        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.set(-centre.x * scale, 1.55 - bounds.max.y * scale, -centre.z * scale);
        pivot.add(gltf.scene);
        render(); setReady(true);
      } catch (error) { cleanup?.(); cleanup = undefined; console.warn("Garment model unavailable", error); }
    }, { rootMargin: "300px" });
    observer.observe(container);
    return () => { disposed = true; observer.disconnect(); cleanup?.(); };
  }, [model, rotation]);

  return <span ref={host} className="rail-model" data-ready={ready} aria-hidden="true">
    {/* Retained as a loading fallback and product-navigation snapshot. */}
    <img src={fallback} alt="" className="rail-model-fallback" />
  </span>;
}
