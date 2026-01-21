"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

// Custom shader for the wave effect
// Custom shader for the wave effect with lighting and grain
const WaveShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uTexture: { value: null },
        uColor: { value: new THREE.Color(0xFFFFFF) },
        uGrainScale: { value: 1.5 },
        uGrainIntensity: { value: 0.15 },
    },
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float uTime;

    // Simplex noise function (simplified)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Complex wave composition
      float noiseVal = snoise(vec2(pos.x * 0.5 + uTime * 0.2, pos.y * 0.5 + uTime * 0.1));
      float waveX = sin(pos.x * 2.0 + uTime * 0.8 + noiseVal) * 0.2;
      float waveY = sin(pos.y * 1.0 + uTime * 0.4) * 0.2;
      
      pos.z += waveX + waveY;

      // Calculate pseudo-normal for lighting
      vec3 objectNormal = normalize(vec3(-waveX * 2.0, -waveY * 2.0, 1.0));
      vNormal = normalMatrix * objectNormal;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
    fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform sampler2D uTexture;
    uniform vec3 uColor;
    uniform float uGrainScale;
    uniform float uGrainIntensity;

    // Random function for grain
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec4 textureColor = texture2D(uTexture, vUv);
      
      // Basic lighting (Blinn-Phong)
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 lightDir = normalize(vec3(5.0, 10.0, 7.0)); // Fixed light source
      
      // Diffuse
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = diff * vec3(1.0);

      // Specular (for powder shine)
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
      vec3 specular = vec3(0.2) * spec; // Low specular for matte powder

      // Procedural Grain
      float grain = random(vUv * uGrainScale * 10.0);
      vec3 grainColor = vec3(grain) * uGrainIntensity;
      
      vec3 finalColor = textureColor.rgb * uColor * (0.8 + diffuse * 0.2) + specular + grainColor;
      
      gl_FragColor = vec4(finalColor, textureColor.a);
    }
  `,
};

function WavePlane() {
    const mesh = useRef<THREE.Mesh>(null);

    // Load texture
    const texture = useLoader(TextureLoader, "/images/Fine Powder Texture.png");

    // Configure texture for seamless look
    useMemo(() => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
    }, [texture]);

    useFrame((state) => {
        if (mesh.current && mesh.current.material) {
            (mesh.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: texture },
                uColor: { value: new THREE.Color("#ffffff") },
                uGrainScale: { value: 1.5 },
                uGrainIntensity: { value: 0.1 }, // Subtle grain
            },
            vertexShader: WaveShaderMaterial.vertexShader,
            fragmentShader: WaveShaderMaterial.fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
        });
    }, [texture]);

    return (
        <mesh ref={mesh} rotation={[-Math.PI / 3, 0, 0]}>
            <planeGeometry args={[18, 12, 128, 128]} /> {/* Increased resolution for smoother waves */}
            <primitive object={material} attach="material" />
        </mesh>
    );
}

export default function WaveAnimation() {
    return (
        <div className="w-full h-full absolute inset-0 -z-10 bg-black/5" >
            <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <React.Suspense fallback={null}>
                    <WavePlane />
                </React.Suspense>
            </Canvas>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
    );
}
