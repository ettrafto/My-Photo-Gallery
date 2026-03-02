import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { loadSiteConfig, getNavItems } from '../lib/siteConfig';
import './NavBar.css';

export default function NavBar() {
  const [siteTitle, setSiteTitle] = useState('PHOTO.LOG'); // Fallback
  const [ownerName, setOwnerName] = useState('Evan Trafton'); // Fallback
  const [navItems, setNavItems] = useState([]);

  useEffect(() => {
    async function fetchConfig() {
      const config = await loadSiteConfig();
      setSiteTitle(config.site.title);
      setOwnerName(config.site.ownerName);
      setNavItems(getNavItems());
    }
    fetchConfig();
  }, []);

  const isInternalLink = (href) => {
    return href && href.startsWith('/');
  };

  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <div className="nav-brand">
          <span className="nav-brand-main">{siteTitle}</span>
          <span className="nav-brand-sub">/ {ownerName}</span>
        </div>
        {navItems.length > 0 && (
          <nav className="nav-links">
            {navItems.map(item => {
              if (isInternalLink(item.href)) {
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      'nav-link' + (isActive ? ' nav-link-active' : '')
                    }
                  >
                    {item.label}
                  </NavLink>
                );
              } else {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="nav-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                );
              }
            })}
          </nav>
        )}
      </div>
    </header>
  );
}

