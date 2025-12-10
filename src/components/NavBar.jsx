import { NavLink } from 'react-router-dom';
import './NavBar.css';

export default function NavBar() {
  const links = [
    { to: '/', label: 'home' },
    { to: '/albums', label: 'albums' },
    { to: '/trips', label: 'trips' },
    { to: '/map', label: 'map' },
    { to: '/about', label: 'about' }
  ];

  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <div className="nav-brand">
          <span className="nav-brand-main">PHOTO.LOG</span>
          <span className="nav-brand-sub">/ Evan Trafton</span>
        </div>
        <nav className="nav-links">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' nav-link-active' : '')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

