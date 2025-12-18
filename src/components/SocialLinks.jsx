import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadSiteConfig, getSocialItems } from '../lib/siteConfig';
import './SocialLinks.css';

/**
 * SocialLinks - Renders social links from site config
 * 
 * Icons are mapped via iconMap. Unknown icons fall back to label text.
 * External links open in new tab with security attributes.
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Display variant ('horizontal' | 'vertical')
 */
export default function SocialLinks({ className = '', variant = 'horizontal' }) {
  const [socialItems, setSocialItems] = useState([]);

  useEffect(() => {
    async function fetchConfig() {
      await loadSiteConfig();
      setSocialItems(getSocialItems());
    }
    fetchConfig();
  }, []);

  if (socialItems.length === 0) {
    return null;
  }

  // Icon mapping - simple text/emoji fallbacks
  // Can be extended with SVG icons or icon library later
  const iconMap = {
    github: '🔗',
    linkedin: '🔗',
    instagram: '📷',
    twitter: '🐦',
    mail: '✉️',
    file: '📄',
    globe: '🌐',
  };

  const getIcon = (iconKey) => {
    return iconMap[iconKey] || null;
  };

  const isInternalLink = (href) => {
    return href && href.startsWith('/');
  };

  return (
    <nav className={`social-links social-links-${variant} ${className}`} aria-label="Social links">
      {socialItems.map((item, index) => {
        const icon = getIcon(item.icon);
        const content = (
          <>
            {icon && <span className="social-icon" aria-hidden="true">{icon}</span>}
            <span className="social-label">{item.label}</span>
          </>
        );

        if (isInternalLink(item.href)) {
          return (
            <Link
              key={index}
              to={item.href}
              className="social-link"
            >
              {content}
            </Link>
          );
        } else {
          return (
            <a
              key={index}
              href={item.href}
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.label} (opens in new tab)`}
            >
              {content}
            </a>
          );
        }
      })}
    </nav>
  );
}

