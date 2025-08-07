'use client';
import { useEffect, useRef, useState } from 'react';

const DEFAULTS = {
  sport: 'basketball', base_style: 'classic', view_side: 'front',
  primary_hex: '#FF6A00', trim_hex: '#0A1F44',
  trim_style: 'straight', trim_width: 3,
  font_key: 'varsity_block', team_name: 'BESU', player_number: '23', player_name: 'SMITH',
  logo_url: ''
};
type Design = typeof DEFAULTS;

export default function Designer() {
  const [design, setDesign] = useState<Design>(DEFAULTS);
  const [parentOrigin, setParentOrigin] = useState<string>('');
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Compute origin/iframe URL on the client only
  useEffect(() => {
    const origin = window.location.origin;
    setParentOrigin(origin);
    setViewerUrl(`/viewer?parentOrigin=${encodeURIComponent(origin)}`);
  }, []);

  // Debounced postMessage → only after origin + iframe exist
  useEffect(() => {
    if (!parentOrigin || !iframeRef.current?.contentWindow) return;
    const t = window.setTimeout(() => {
      iframeRef.current!.contentWindow!.postMessage({ type: 'state', design }, parentOrigin);
    }, 120);
    return () => window.clearTimeout(t);
  }, [design, parentOrigin]);

  // Receive snapshot url (guard by origin)
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== parentOrigin) return;
      const m = e.data || {};
      if (m.type === 'snapshot_url' && m.url) {
        alert('Snapshot uploaded: ' + m.url);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [parentOrigin]);

  return (
    <main style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, padding: 16 }}>
      <section>
        {viewerUrl ? (
          <iframe ref={iframeRef} src={viewerUrl} style={{ width: '100%', height: 720, border: 0 }} />
        ) : (
          <div style={{height:720,display:'grid',placeItems:'center',border:'1px solid #eee'}}>
            Loading viewer…
          </div>
        )}
        <p style={{ color: '#666', fontSize: 12 }}>
          If nothing renders, open <a href="/viewer" target="_blank">/viewer</a> directly to debug.
        </p>
      </section>

      <aside>
        <h2>Controls</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>Primary <input type="color" value={design.primary_hex}
            onChange={(e) => setDesign(d => ({ ...d, primary_hex: e.target.value.toUpperCase() }))} /></label>
          <label>Trim <input type="color" value={design.trim_hex}
            onChange={(e) => setDesign(d => ({ ...d, trim_hex: e.target.value.toUpperCase() }))} /></label>
          <label>Side
            <select value={design.view_side} onChange={(e) => setDesign(d => ({ ...d, view_side: e.target.value as any }))}>
              <option value="front">front</option>
              <option value="back">back</option>
            </select>
          </label>
          <label>Team
            <input value={design.team_name} onChange={(e) => setDesign(d => ({ ...d, team_name: e.target.value }))} />
          </label>
          <label>Number
            <input value={design.player_number} onChange={(e) => setDesign(d => ({ ...d, player_number: e.target.value }))} />
          </label>
          <label>Player Name
            <input value={design.player_name} onChange={(e) => setDesign(d => ({ ...d, player_name: e.target.value }))} />
          </label>
          <label>Logo URL
            <input placeholder="https://...png" value={design.logo_url}
              onChange={(e) => setDesign(d => ({ ...d, logo_url: e.target.value }))} />
          </label>
        </div>
      </aside>
    </main>
  );
}
