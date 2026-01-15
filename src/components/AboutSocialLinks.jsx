import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadSiteConfig, getSocialItems } from '../lib/siteConfig';
import './AboutSocialLinks.css';

/**
 * AboutSocialLinks - Full-featured social links component for About page
 * 
 * Displays social links from site config in a styled card matching the About page aesthetic.
 * Features icons, labels, and proper link handling for internal/external links.
 * 
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 */
export default function AboutSocialLinks({ className = '' }) {
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
    youtube: '▶️',
    portfolio: '💼',
    website: '🌐',
  };

  const getIcon = (iconKey) => {
    if (!iconKey) return null;
    const key = iconKey.toLowerCase();
    return iconMap[key] || iconMap.globe;
  };

  const isInternalLink = (href) => {
    return href && href.startsWith('/');
  };

  return (
    <section className={`about-social-links ${className}`}>
      <div className="about-social-links-content">
        <p className="page-label">connect</p>
        <h2 className="page-subtitle">Find me online</h2>
        <p className="page-body">I'm always looking for new opportunities to collaborate and learn. Feel free to reach out to me via email or connect with me on social media.</p>
        
        <div className="social-links-grid">
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
                  className="social-link-item"
                >
                  {content}
                </Link>
              );
            } else {
              return (
                <a
                  key={index}
                  href={item.href}
                  className="social-link-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.label} (opens in new tab)`}
                >
                  {content}
                </a>
              );
            }
          })}
        </div>
      </div>
    </section>
  );
}
