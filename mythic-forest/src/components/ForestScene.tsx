"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  GodRays,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";

const FOREST_RADIUS = 28;
const LEAF_COUNT = 420;
const DUST_COUNT = 900;

type LeafSample = {
  position: THREE.Vector3;
  scale: number;
  rotation: number;
  phase: number;
  color: THREE.Color;
};

type DustSample = {
  speed: number;
  drift: number;
};

const RAMA_SKIN = "#f3cfa4";
const ALLY_SKIN = "#cfad85";

const foliagePalette = ["#1e3320", "#233b23", "#274028", "#304a31", "#1b2919"];

function useLeafSamples() {
  return useMemo(() => {
    const samples: LeafSample[] = [];
    for (let i = 0; i < LEAF_COUNT; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * FOREST_RADIUS * 0.8;
      const height = 2.6 + Math.random() * 7.5;
      samples.push({
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ),
        scale: THREE.MathUtils.lerp(0.45, 1.35, Math.random()),
        rotation: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        color: new THREE.Color(
          foliagePalette[Math.floor(Math.random() * foliagePalette.length)]
        ),
      });
    }
    return samples;
  }, []);
}

function useDustSamples() {
  return useMemo(() => {
    const origins = new Float32Array(DUST_COUNT * 3);
    const modifiers: DustSample[] = [];
    for (let i = 0; i < DUST_COUNT; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * FOREST_RADIUS * 0.55;
      origins[i * 3] = Math.cos(angle) * radius;
      origins[i * 3 + 1] = 0.8 + Math.random() * 4.2;
      origins[i * 3 + 2] = Math.sin(angle) * radius;
      modifiers.push({
        speed: THREE.MathUtils.lerp(0.3, 1.4, Math.random()),
        drift: THREE.MathUtils.lerp(0.2, 0.65, Math.random()),
      });
    }
    return { origins, modifiers };
  }, []);
}

function ForestCanopy() {
  const instanced = useRef<THREE.InstancedMesh>(null);
  const leafSamples = useLeafSamples();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!instanced.current) return;
    leafSamples.forEach((leaf, index) => {
      dummy.position.copy(leaf.position);
      dummy.rotation.set(
        -Math.PI / 2 + Math.random() * 0.2,
        leaf.rotation,
        0
      );
      dummy.scale.set(leaf.scale, leaf.scale * 1.7, leaf.scale);
      dummy.updateMatrix();
      instanced.current?.setMatrixAt(index, dummy.matrix);
      instanced.current?.setColorAt(index, leaf.color);
    });
    instanced.current.instanceMatrix.needsUpdate = true;
    if (instanced.current.instanceColor) {
      instanced.current.instanceColor.needsUpdate = true;
    }
  }, [dummy, leafSamples]);

  useFrame(({ clock }) => {
    if (!instanced.current) return;
    const time = clock.elapsedTime;
    leafSamples.forEach((leaf, index) => {
      const sway = Math.sin(time * 0.25 + leaf.phase) * 0.3;
      dummy.position
        .copy(leaf.position)
        .add(
          new THREE.Vector3(
            Math.sin(time * 0.1 + leaf.phase) * 0.3,
            Math.cos(time * 0.18 + leaf.phase * 2) * 0.2,
            Math.cos(time * 0.12 + leaf.phase) * 0.25
          )
        );
      dummy.rotation.set(
        -Math.PI / 2 + sway * 0.05,
        leaf.rotation + sway * 0.2,
        Math.sin(time * 0.1 + leaf.phase) * 0.05
      );
      dummy.scale.set(leaf.scale, leaf.scale * 1.7, leaf.scale);
      dummy.updateMatrix();
      instanced.current?.setMatrixAt(index, dummy.matrix);
    });
    instanced.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instanced}
      args={[undefined, undefined, LEAF_COUNT]}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[1.8, 5]} />
      <meshStandardMaterial
        color="#1f2e1c"
        roughness={0.6}
        metalness={0.05}
        transparent
        opacity={0.95}
        side={THREE.DoubleSide}
        vertexColors
      />
    </instancedMesh>
  );
}

function DustField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { origins, modifiers } = useDustSamples();
  const positions = useMemo(() => origins.slice(), [origins]);
  const velocities = useMemo(
    () =>
      Float32Array.from({ length: DUST_COUNT }, () =>
        THREE.MathUtils.lerp(0.08, 0.25, Math.random())
      ),
    []
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    for (let i = 0; i < DUST_COUNT; i += 1) {
      const idx = i * 3;
      positions[idx] += Math.sin((positions[idx + 1] + i) * 0.25) * delta;
      positions[idx + 1] += velocities[i] * delta * modifiers[i].speed;
      positions[idx + 2] +=
        Math.cos((positions[idx] + i) * 0.18) * delta * modifiers[i].drift;

      if (positions[idx + 1] > 6.5) {
        positions[idx] = origins[idx] + Math.sin(i) * 0.3;
        positions[idx + 1] = 0.2 + Math.random() * 1.4;
        positions[idx + 2] = origins[idx + 2] + Math.cos(i) * 0.3;
      }
    }
    const attr = pointsRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <primitive attach="geometry" object={geometry} />
      <pointsMaterial
        size={0.08}
        transparent
        opacity={0.85}
        color="#f4dba5"
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

type CharacterFigureProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
  robeColor: string;
  accentColor: string;
  skinColor: string;
  kneel?: boolean;
  holdBow?: boolean;
};

function CharacterFigure({
  position,
  rotation = [0, 0, 0],
  robeColor,
  accentColor,
  skinColor,
  kneel = false,
  holdBow = false,
}: CharacterFigureProps) {
  const torsoHeight = kneel ? 1.1 : 1.45;
  const kneeOffset = kneel ? -0.55 : 0;
  return (
    <group position={position} rotation={rotation}>
      <mesh
        position={[0, torsoHeight, 0]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.33, 0.8, 12, 20]} />
        <meshStandardMaterial
          color={robeColor}
          roughness={0.55}
          metalness={0.08}
        />
      </mesh>

      <mesh
        position={[0, torsoHeight + 0.65, 0.02]}
        castShadow
      >
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      <mesh position={[0, torsoHeight + 0.25, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.08, 16, 32]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.35} />
      </mesh>

      <mesh position={[0, 0.4 + kneeOffset, kneel ? -0.35 : 0]} rotation={[Math.PI / 2.2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.55, kneel ? 1.5 : 2.3, 24]} />
        <meshStandardMaterial color={robeColor} roughness={0.6} metalness={0.05} />
      </mesh>

      <mesh
        position={[0.38, torsoHeight + 0.32, kneel ? -0.2 : 0.08]}
        rotation={[Math.PI / 1.4, 0.4, Math.PI / 2.3]}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.12, 0.65, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      <mesh
        position={[-0.38, torsoHeight + 0.32, kneel ? -0.2 : 0.08]}
        rotation={[Math.PI / 1.4, -0.4, -Math.PI / 2.3]}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.12, 0.65, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {holdBow && (
        <group
          position={[0.52, torsoHeight + 0.38, 0.18]}
          rotation={[Math.PI / 2.1, 0.2, Math.PI / 2]}
        >
          <mesh castShadow>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3(
                  [
                    new THREE.Vector3(0, -0.5, 0),
                    new THREE.Vector3(0.25, 0, 0.1),
                    new THREE.Vector3(0, 0.5, 0),
                  ],
                  false,
                  "catmullrom",
                  0.5
                ),
                24,
                0.025,
              ]}
            />
            <meshStandardMaterial
              color="#c97a32"
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1.02, 12]} />
            <meshStandardMaterial color="#f9f1d5" roughness={1} metalness={0} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function SacredAura() {
  return (
    <mesh position={[0.1, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3.4, 64]} />
      <meshBasicMaterial
        color="#f0c981"
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function JatayuFigure() {
  const wingLeft = useRef<THREE.Mesh>(null);
  const wingRight = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (wingLeft.current && wingRight.current) {
      const flap = Math.sin(t * 0.8) * 0.18;
      wingLeft.current.rotation.z = Math.PI / 2.8 + flap;
      wingRight.current.rotation.z = -Math.PI / 2.8 - flap;
    }
  });

  return (
    <group position={[-1.2, 0.52, 0]} rotation={[0, Math.PI / 8, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.38, 28, 22]} />
        <meshStandardMaterial
          color="#6b4638"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.12, 0.42]}>
        <coneGeometry args={[0.18, 0.45, 24]} />
        <meshStandardMaterial color="#cb9355" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.4, 0.15]} rotation={[Math.PI / 2.2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.32, 0.7, 24]} />
        <meshStandardMaterial color="#7a543f" roughness={0.6} />
      </mesh>
      <mesh ref={wingLeft} position={[0.32, 0.3, 0.2]}>
        <planeGeometry args={[1.6, 0.6, 1, 8]} />
        <meshStandardMaterial
          color="#4e3226"
          side={THREE.DoubleSide}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
      <mesh ref={wingRight} position={[-0.32, 0.3, 0.2]}>
        <planeGeometry args={[1.6, 0.6, 1, 8]} />
        <meshStandardMaterial
          color="#4e3226"
          side={THREE.DoubleSide}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0.15, -0.35, 0.1]} rotation={[Math.PI / 2, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.04, 0.12, 0.58, 12]} />
        <meshStandardMaterial color="#5f3e2f" roughness={0.5} />
      </mesh>
      <mesh position={[-0.15, -0.35, 0.1]} rotation={[Math.PI / 2, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.04, 0.12, 0.58, 12]} />
        <meshStandardMaterial color="#5f3e2f" roughness={0.5} />
      </mesh>
    </group>
  );
}

function RamaTableau() {
  return (
    <group>
      <SacredAura />
      <CharacterFigure
        position={[0.8, 0.1, 0.4]}
        rotation={[0, -Math.PI / 4, 0]}
        robeColor="#2f3e6b"
        accentColor="#d7c478"
        skinColor={RAMA_SKIN}
        kneel
        holdBow
      />
      <CharacterFigure
        position={[1.8, 0.12, -0.15]}
        rotation={[0, -Math.PI / 3.4, 0]}
        robeColor="#7f3e2f"
        accentColor="#f2d48a"
        skinColor={ALLY_SKIN}
        kneel
      />
      <CharacterFigure
        position={[2.45, 0.18, 0.9]}
        rotation={[0, -Math.PI / 18, 0]}
        robeColor="#49683b"
        accentColor="#d8b77a"
        skinColor="#b88656"
        kneel
      />
      <JatayuFigure />
    </group>
  );
}

function ForestFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[FOREST_RADIUS, 120]} />
        <meshStandardMaterial
          color="#130d09"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial
          color="#2d1f13"
          roughness={0.85}
          metalness={0.04}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[6, 10, 64, 1]} />
        <meshStandardMaterial
          color="#3d2a1a"
          roughness={0.9}
          metalness={0.05}
          transparent
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}

function TrunkArray() {
  const group = useRef<THREE.Group>(null);
  const trunks = useMemo(() => {
    const data: Array<{
      position: [number, number, number];
      scale: number;
    }> = [];
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.08;
      const radius = THREE.MathUtils.lerp(5, FOREST_RADIUS * 0.75, Math.random());
      const scale = THREE.MathUtils.lerp(1.4, 3.6, Math.random());
      data.push({
        position: [
          Math.cos(angle) * radius,
          scale / 2,
          Math.sin(angle) * radius,
        ],
        scale,
      });
    }
    return data;
  }, []);

  return (
    <group ref={group}>
      {trunks.map((trunk, index) => (
        <group
          key={index}
          position={trunk.position}
          rotation={[0, Math.random() * Math.PI * 2, 0]}
        >
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.75, trunk.scale * 2, 12]} />
            <meshStandardMaterial
              color="#3c2a1c"
              roughness={0.85}
              metalness={0.06}
            />
          </mesh>
          <mesh position={[0, trunk.scale * 0.9, 0]}>
            <sphereGeometry args={[0.9, 16, 16]} />
            <meshStandardMaterial
              color="#1f2b19"
              roughness={0.7}
              metalness={0.05}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ForegroundFronds() {
  const frondGroup = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      position: [
        THREE.MathUtils.lerp(-4.2, 4.4, Math.random()),
        0.15,
        THREE.MathUtils.lerp(-5.8, -2.4, Math.random()),
      ] as [number, number, number],
      rotation: [
        -Math.PI / 2.4,
        THREE.MathUtils.lerp(-0.4, 0.4, Math.random()),
        THREE.MathUtils.lerp(-0.15, 0.15, Math.random()),
      ] as [number, number, number],
      scale: THREE.MathUtils.lerp(0.7, 1.6, Math.random()),
      phase: Math.random() * Math.PI * 2 + i,
    }));
  }, []);

  const frondRefs = useRef<THREE.Group[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    frondRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const swing = Math.sin(t * 0.9 + frondGroup[index].phase) * 0.15;
      ref.rotation.z = frondGroup[index].rotation[2] + swing;
    });
  });

  return (
    <group>
      {frondGroup.map((frond, index) => (
        <group
          key={index}
          position={frond.position}
          rotation={frond.rotation}
          scale={frond.scale}
          ref={(node) => {
            frondRefs.current[index] = node as THREE.Group;
          }}
        >
          <mesh castShadow>
            <planeGeometry args={[1.8, 4, 3, 8]} />
            <meshStandardMaterial
              color="#394d2f"
              side={THREE.DoubleSide}
              roughness={0.65}
              metalness={0.05}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SceneGraph() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
  const sunRef = useRef<THREE.Mesh>(null!);
  const dollyProgress = useRef(0);

  useFrame((state, delta) => {
    if (!cameraRef.current) return;
    dollyProgress.current = Math.min(
      1,
      dollyProgress.current + delta * 0.22
    );
    const eased = 1 - Math.pow(1 - dollyProgress.current, 3);
    const start = { x: 8.4, y: 4.6, z: 13.4 };
    const end = { x: 3.7, y: 3.1, z: 7.1 };

    cameraRef.current.position.set(
      THREE.MathUtils.lerp(start.x, end.x, eased),
      THREE.MathUtils.lerp(start.y, end.y, eased) +
        Math.sin(state.clock.elapsedTime * 0.6) * 0.08,
      THREE.MathUtils.lerp(start.z, end.z, eased)
    );

    cameraRef.current.lookAt(0.4, 1.3, 0);
    cameraRef.current.updateProjectionMatrix();
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={35}
        near={0.1}
        far={150}
        position={[8.4, 4.6, 13.4]}
      />
      <color attach="background" args={["#060507"]} />
      <fog attach="fog" args={["#0c0907", 12, 48]} />

      <ambientLight intensity={0.22} color="#38220f" />
      <spotLight
        position={[4, 11, 6]}
        angle={0.52}
        penumbra={0.8}
        intensity={2.1}
        color="#f1c27d"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        distance={60}
      />
      <directionalLight
        position={[-4.5, 6, -3]}
        intensity={0.6}
        color="#96663c"
        castShadow
      />

      <mesh ref={sunRef} position={[-1.8, 9.2, -5]}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#f8e0a3"
          toneMapped={false}
          transparent
          opacity={0.95}
        />
      </mesh>

      <Environment background={false}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <Lightformer
            form="ring"
            intensity={3}
            color="#f8c76c"
            position={[0, 5, -15]}
            scale={[20, 20, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2}
            color="#140c08"
            position={[0, -5, 0]}
            scale={[30, 10, 1]}
          />
        </group>
      </Environment>

      <ForestFloor />
      <TrunkArray />
      <ForestCanopy />
      <RamaTableau />
      <ForegroundFronds />
      <DustField />

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.42}
        scale={12}
        blur={2.8}
        far={8}
      />

      <EffectComposer>
        <GodRays
          sun={sunRef}
          samples={120}
          density={0.96}
          decay={0.96}
          weight={0.4}
          exposure={0.62}
          clampMax={1}
          blur
        />
        <Bloom
          luminanceThreshold={0.7}
          luminanceSmoothing={0.6}
          intensity={1.3}
        />
        <DepthOfField
          focusDistance={0.012}
          focalLength={0.018}
          bokehScale={7}
          height={960}
        />
        <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.12} />
        <Vignette eskil={false} offset={0.42} darkness={1.15} />
      </EffectComposer>
    </>
  );
}

export default function ForestScene() {
  return (
    <div className="absolute inset-0">
      <Suspense fallback={null}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <SceneGraph />
        </Canvas>
      </Suspense>
    </div>
  );
}
