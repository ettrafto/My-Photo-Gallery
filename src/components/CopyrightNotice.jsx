import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadSiteConfig } from '../lib/siteConfig';
import './CopyrightNotice.css';

/**
 * CopyrightNotice - Displays copyright/licensing notice on gallery pages
 * 
 * Minimal, tasteful notice that matches the site's retro monochrome aesthetic.
 * Owner name is loaded from content/site/site.json
 * 
 * @example
 * <CopyrightNotice />
 * 
 * @example
 * <CopyrightNotice showContactLink={true} contactPath="/about" />
 */
export default function CopyrightNotice({ 
  showContactLink = false,
  contactPath = '/about',
  className = ''
}) {
  const [ownerName, setOwnerName] = useState('Evan Trafton'); // Fallback
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function fetchConfig() {
      const config = await loadSiteConfig();
      setOwnerName(config.site.ownerName);
    }
    fetchConfig();
  }, []);

  return (
    <div className={`copyright-notice ${className}`}>
      <p className="copyright-text">
        © {currentYear} {ownerName}. Images may not be used or reproduced without permission.
      </p>
      {showContactLink && (
        <p className="copyright-contact">
          For licensing or usage requests,{' '}
          <a href={contactPath} className="copyright-link">
            contact me
          </a>
          .
        </p>
      )}
    </div>
  );
}

CopyrightNotice.propTypes = {
  showContactLink: PropTypes.bool,
  contactPath: PropTypes.string,
  className: PropTypes.string,
};

