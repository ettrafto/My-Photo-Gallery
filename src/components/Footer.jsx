import { useState, useEffect } from 'react';
import { loadSiteConfig, getFooterConfig, getSocialItems, getSiteConfig } from '../lib/siteConfig';
import './Footer.css';

/**
 * Footer Component
 * 
 * Displays site credit and social links, configured via site.json
 */
export default function Footer() {
  const [footerConfig, setFooterConfig] = useState(null);
  const [socialItems, setSocialItems] = useState([]);
  const [creditText, setCreditText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFooter() {
      try {
        // Load config first (this is async)
        const loadedConfig = await loadSiteConfig();
        
        // Now get footer config (this is synchronous)
        const config = getFooterConfig();
        
        // Debug logging
        if (!config) {
          const siteConfig = getSiteConfig();
          console.log('Footer: Config not found. Site config:', siteConfig);
          console.log('Footer: Footer config from site:', siteConfig?.footer);
          setIsLoading(false);
          return; // Footer is disabled
        }

        setFooterConfig(config);

        // Get social links if enabled
        if (config.showSocialLinks) {
          const social = getSocialItems();
          setSocialItems(social);
        }

        // Process credit text with placeholders
        const siteConfig = getSiteConfig();
        const currentYear = new Date().getFullYear();
        let credit = config.credit
          .replace('{year}', currentYear.toString())
          .replace('{ownerName}', siteConfig?.site?.ownerName || '');
        
        setCreditText(credit);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading footer config:', error);
        setIsLoading(false);
      }
    }

    loadFooter();
  }, []);

  // Show loading state or render footer
  // If config is still loading, show a simple footer
  // If config loaded but disabled, show nothing
  if (!isLoading && !footerConfig) {
    return null; // Footer is disabled
  }

  // If still loading, show a simple footer (or return null to hide until loaded)
  if (isLoading) {
    return null; // Hide while loading to prevent flash
  }

  // Always render footer if config is loaded (even if empty)
  return (
    <footer className="footer" style={{ minHeight: '100px' }}>
      <div className="footer-inner">
        {creditText ? (
          <div className="footer-credit">
            {creditText}
          </div>
        ) : (
          <div className="footer-credit" style={{ color: 'red' }}>
            DEBUG: Footer loaded but no credit text
          </div>
        )}
        
        {footerConfig && footerConfig.showSocialLinks && socialItems.length > 0 && (
          <div className="footer-social">
            {socialItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label={item.label}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
        {footerConfig && footerConfig.showSocialLinks && socialItems.length === 0 && (
          <div style={{ color: 'orange', fontSize: '0.75rem' }}>
            DEBUG: Social links enabled but none found
          </div>
        )}
      </div>
    </footer>
  );
}

