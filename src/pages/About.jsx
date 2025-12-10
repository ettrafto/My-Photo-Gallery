import './Page.css';

export default function About() {
  return (
    <main className="page-shell">
      <section className="page-block">
        <p className="page-label">about</p>
        <h1 className="page-title">About this archive</h1>
        <p className="page-body">
          A minimal photo gallery built with React, inspired by vintage camera UI aesthetics.
          <br /><br />
          All images are scanned with EXIF metadata extraction, tagged, and organized into albums.
        </p>
      </section>

      <section className="page-block">
        <p className="page-label">tech stack</p>
        <h2 className="page-subtitle">Built with</h2>
        <ul className="tech-list">
          <li>React + Vite</li>
          <li>React Router</li>
          <li>EXIF metadata extraction</li>
          <li>Node.js scanning pipeline</li>
        </ul>
      </section>
    </main>
  );
}

