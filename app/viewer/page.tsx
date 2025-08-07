'use client';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, Decal } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo, useState } from 'react';

type Design = {
  primary_hex: string; trim_hex: string; view_side: 'front'|'back';
  team_name: string; player_number: string; player_name: string; logo_url?: string;
  sport?: string; base_style?: string; font_key?: string; trim_style?: string; trim_width?: number;
};

function useParentOrigin() {
  const [origin, setOrigin] = useState<string>('http://localhost:3000');
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const p = qs.get('parentOrigin');
    setOrigin(p || origin);
  }, []);
  return origin;
}

function makeTextTexture(text: string, opts?: { size?: number; font?: string; color?: string; stroke?: string; }) {
  const size = opts?.size ?? 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0,0,size,size);
  ctx.fillStyle = opts?.color || '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.floor(size*0.35)}px ${opts?.font || 'Impact, system-ui'}`;
  if (opts?.stroke) { ctx.lineWidth = Math.floor(size*0.06); ctx.strokeStyle = opts.stroke; ctx.strokeText(text, size/2, size/2); }
  ctx.fillText(text, size/2, size/2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function useLogoTexture(url?: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) { setTex(null); return; }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, (t) => { t.flipY = false; setTex(t); }, undefined, () => setTex(null));
  }, [url]);
  return tex;
}

function Jersey({ design }: { design: Design }) {
  const glb = useGLTF('/models/basketball/classic.glb', true, true) as any;
  const scene = glb?.scene as THREE.Group | undefined;

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(design.primary_hex) }), [design.primary_hex]);
  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(design.trim_hex) }), [design.trim_hex]);

  const numberTex = useMemo(() => makeTextTexture(design.player_number || '23', { size: 512, stroke: '#000' }), [design.player_number]);
  const nameTex   = useMemo(() => makeTextTexture((design.player_name || 'SMITH').toUpperCase(), { size: 512, stroke: '#000' }), [design.player_name]);
  const teamTex   = useMemo(() => makeTextTexture((design.team_name || 'BESU').toUpperCase(), { size: 512, stroke: '#000' }), [design.team_name]);
  const logoTex = useLogoTexture(design.logo_url);

  const { camera } = useThree();
  useEffect(() => {
    const isBack = design.view_side === 'back';
    camera.position.set(isBack ? 0 : 0, 1.5, isBack ? -3.2 : 3.2);
    camera.lookAt(0, 1.4, 0);
  }, [design.view_side, camera]);

  if (!scene) {
    return (
      <group>
        <mesh position={[0,1.2,0]} material={bodyMat}><boxGeometry args={[1.2,1.5,0.6]} /></mesh>
        <mesh position={[0,2.0,0]} material={trimMat}><torusGeometry args={[0.35, 0.05, 16, 64]} /></mesh>
        <Decal position={[0,1.35,0.33]} rotation={[0,0,0]} scale={[0.5,0.5,0.5]} map={teamTex} />
        <Decal position={[0,1.1,0.34]} rotation={[0,0,0]} scale={[0.6,0.6,0.6]} map={numberTex} />
        {logoTex && <Decal position={[0.25,1.25,0.34]} rotation={[0,0,0]} scale={[0.28,0.28,0.28]} map={logoTex} />}
      </group>
    );
  }

  scene.traverse((obj: any) => {
    if (obj.isMesh && obj.material) {
      if (obj.material.name?.toLowerCase().includes('body')) obj.material.color.set(design.primary_hex);
      if (obj.material.name?.toLowerCase().includes('trim')) obj.material.color.set(design.trim_hex);
    }
  });

  return (
    <group>
      <primitive object={scene} />
      {design.view_side === 'front' && (<>
        <Decal position={[0,1.35,0.34]} rotation={[0,0,0]} scale={[0.5,0.5,0.5]} map={teamTex} />
        <Decal position={[0,1.1,0.35]} rotation={[0,0,0]} scale={[0.62,0.62,0.62]} map={numberTex} />
        {logoTex && <Decal position={[0.25,1.25,0.35]} rotation={[0,0,0]} scale={[0.28,0.28,0.28]} map={logoTex} />}
      </>)}
      {design.view_side === 'back' && (<>
        <Decal position={[0,1.55,-0.34]} rotation={[0,Math.PI,0]} scale={[0.6,0.6,0.6]} map={nameTex} />
        <Decal position={[0,1.25,-0.35]} rotation={[0,Math.PI,0]} scale={[0.62,0.62,0.62]} map={numberTex} />
      </>)}
    </group>
  );
}

export default function ViewerPage() {
  const parentOrigin = useParentOrigin();
  const [design, setDesign] = useState<Design>({
    primary_hex: '#FF6A00', trim_hex: '#0A1F44', view_side: 'front',
    team_name: 'BESU', player_number: '23', player_name: 'SMITH', logo_url: ''
  });

  useEffect(() => {
    window.parent.postMessage({ type: 'ready' }, parentOrigin);
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== parentOrigin) return;
      const m = e.data || {};
      if (m.type === 'state' && m.design) setDesign(m.design);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [parentOrigin]);

  const exportPng = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), 'image/png'));
    if (!blob) return;
    const b64 = await blobToDataURL(blob);
    const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: b64 }) });
    const j = await r.json();
    if (j.url) window.parent.postMessage({ type: 'snapshot_url', url: j.url }, parentOrigin);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas gl={{ antialias: true }} camera={{ position: [0, 1.5, 3.2], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} />
        <Environment preset="city" />
        <Jersey design={design} />
        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
      </Canvas>
      <button onClick={exportPng} style={{ position: 'absolute', top: 12, right: 12, padding: '8px 12px' }}>Export Snapshot</button>
    </div>
  );
}

async function blobToDataURL(blob: Blob) {
  return await new Promise<string>((res) => {
    const reader = new FileReader(); reader.onload = () => res(reader.result as string); reader.readAsDataURL(blob);
  });
}

useGLTF.preload('/models/basketball/classic.glb');
