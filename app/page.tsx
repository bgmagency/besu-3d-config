import Link from 'next/link';
export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Besu 3D Configurator</h1>
      <p>Kickoff pages:</p>
      <ul>
        <li><Link href="/designer">/designer</Link> – parent page with controls → iframe</li>
        <li><Link href="/viewer">/viewer</Link> – iframe live 3D viewer</li>
      </ul>
    </main>
  );
}