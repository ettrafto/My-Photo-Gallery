import { useState, useEffect } from 'react';
import { loadSiteConfig } from '../lib/siteConfig';
import './YouTubeCard.css';

/**
 * YouTubeCard component - displays the most recent video from a YouTube channel
 * Configured via site.json youtube section
 * 
 * Supports:
 * - Channel ID or username
 * - Optional API key (uses public proxy if not provided)
 * - Enable/disable via config
 */
export default function YouTubeCard() {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function loadYouTubeVideo() {
      try {
        const siteConfig = await loadSiteConfig();
        const youtubeConfig = siteConfig?.youtube;

        if (!youtubeConfig || !youtubeConfig.enabled) {
          setEnabled(false);
          setLoading(false);
          return;
        }

        setEnabled(true);

        // Get channel identifier (ID or username)
        const channelId = youtubeConfig.channelId;
        const channelUsername = youtubeConfig.channelUsername;
        
        if (!channelId && !channelUsername) {
          throw new Error('YouTube config requires either channelId or channelUsername');
        }

        // Fetch latest video
        let videoData = null;

        if (youtubeConfig.apiKey) {
          // Use YouTube Data API v3
          const identifier = channelId || channelUsername;
          const isUsername = !channelId;
          
          // First, get channel ID if username was provided
          let finalChannelId = channelId;
          if (isUsername) {
            const channelResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${identifier}&key=${youtubeConfig.apiKey}`
            );
            if (!channelResponse.ok) {
              throw new Error('Failed to fetch channel ID');
            }
            const channelData = await channelResponse.json();
            if (channelData.items && channelData.items.length > 0) {
              finalChannelId = channelData.items[0].id;
            } else {
              throw new Error('Channel not found');
            }
          }

          // Get latest video
          const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${finalChannelId}&type=video&order=date&maxResults=1&key=${youtubeConfig.apiKey}`
          );

          if (!videoResponse.ok) {
            throw new Error(`YouTube API error: ${videoResponse.status}`);
          }

          const videoJson = await videoResponse.json();
          if (videoJson.items && videoJson.items.length > 0) {
            const item = videoJson.items[0];
            videoData = {
              id: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
              publishedAt: item.snippet.publishedAt,
              channelTitle: item.snippet.channelTitle,
            };
          }
        } else {
          // Use RSS feed (no API key required) - via CORS proxy
          const identifier = channelId || channelUsername;
          const rssUrl = channelId 
            ? `https://www.youtube.com/feeds/videos.xml?channel_id=${identifier}`
            : `https://www.youtube.com/feeds/videos.xml?user=${identifier}`;

          // Try multiple CORS proxy services as fallback
          const proxies = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`
          ];

          let xmlText = null;
          let lastError = null;

          // Try each proxy until one works
          for (const proxyUrl of proxies) {
            try {
              const response = await fetch(proxyUrl);
              if (!response.ok) {
                continue;
              }

              const data = await response.json();
              // allorigins.win returns {contents: ...}, others might return different formats
              xmlText = data.contents || data || await response.text();
              
              if (xmlText && typeof xmlText === 'string' && xmlText.trim().startsWith('<?xml')) {
                break; // Success
              }
            } catch (err) {
              lastError = err;
              continue;
            }
          }

          if (!xmlText || !xmlText.trim().startsWith('<?xml')) {
            throw new Error('Failed to fetch YouTube RSS feed from proxy services');
          }

          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

          // Check for parsing errors
          const parseError = xmlDoc.querySelector('parsererror');
          if (parseError) {
            console.error('XML Parse Error:', parseError.textContent);
            console.error('XML Content:', xmlText.substring(0, 500));
            throw new Error('Failed to parse YouTube RSS feed XML');
          }

          // Try different selectors for RSS/Atom feed formats
          const entry = xmlDoc.querySelector('entry') || xmlDoc.querySelector('item');
          
          if (entry) {
            // Try multiple ways to get video ID
            let videoId = null;
            
            // Method 1: yt:videoId namespace (try escaped selector first)
            try {
              const videoIdElement = entry.querySelector('yt\\:videoId');
              if (videoIdElement) {
                videoId = videoIdElement.textContent;
              }
            } catch (e) {
              // Selector failed, try other methods
            }
            
            // Method 2: Search all child elements for videoId (handles namespaces)
            if (!videoId) {
              const allElements = entry.getElementsByTagName('*');
              for (let i = 0; i < allElements.length; i++) {
                const el = allElements[i];
                if (el.localName === 'videoId' || el.tagName.toLowerCase().includes('videoid')) {
                  videoId = el.textContent;
                  break;
                }
              }
            }
            
            // Method 3: Extract from link/id
            if (!videoId) {
              const linkElement = entry.querySelector('link') || entry.querySelector('id');
              if (linkElement) {
                const linkText = linkElement.getAttribute('href') || linkElement.textContent || '';
                // Try multiple patterns for video ID in URL
                const patterns = [
                  /[?&]v=([a-zA-Z0-9_-]{11})/,
                  /\/([a-zA-Z0-9_-]{11})(?:[?&]|$)/,
                  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
                  /youtu\.be\/([a-zA-Z0-9_-]{11})/
                ];
                
                for (const pattern of patterns) {
                  const match = linkText.match(pattern);
                  if (match && match[1]) {
                    videoId = match[1];
                    break;
                  }
                }
              }
            }

            const title = entry.querySelector('title')?.textContent || '';
            const published = entry.querySelector('published')?.textContent || 
                            entry.querySelector('pubDate')?.textContent || '';
            
            // Get media group for description and thumbnail
            let mediaGroup = null;
            try {
              mediaGroup = entry.querySelector('media\\:group');
            } catch (e) {
              // Try finding by iterating
              const allElements = entry.getElementsByTagName('*');
              for (let i = 0; i < allElements.length; i++) {
                const el = allElements[i];
                if (el.localName === 'group' || el.tagName.toLowerCase().includes('group')) {
                  mediaGroup = el;
                  break;
                }
              }
            }
            
            let description = '';
            let thumbnail = '';
            
            if (mediaGroup) {
              // Try to get description from media group
              try {
                const descElement = mediaGroup.querySelector('media\\:description');
                if (descElement) {
                  description = descElement.textContent || '';
                }
              } catch (e) {
                // Try iterating
                const descElements = mediaGroup.getElementsByTagName('*');
                for (let i = 0; i < descElements.length; i++) {
                  if (descElements[i].localName === 'description') {
                    description = descElements[i].textContent || '';
                    break;
                  }
                }
              }
              
              // Try to get thumbnail
              try {
                const thumbElement = mediaGroup.querySelector('media\\:thumbnail');
                if (thumbElement) {
                  thumbnail = thumbElement.getAttribute('url') || '';
                }
              } catch (e) {
                // Try iterating
                const thumbElements = mediaGroup.getElementsByTagName('*');
                for (let i = 0; i < thumbElements.length; i++) {
                  if (thumbElements[i].localName === 'thumbnail') {
                    thumbnail = thumbElements[i].getAttribute('url') || '';
                    break;
                  }
                }
              }
            }
            
            // Fallback: try description directly from entry
            if (!description) {
              description = entry.querySelector('description')?.textContent || '';
            }

            // If no thumbnail from media, try to construct from video ID
            if (!thumbnail && videoId) {
              thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }

            if (videoId) {
              videoData = {
                id: videoId,
                title: title || 'Untitled Video',
                description: description,
                thumbnail: thumbnail,
                publishedAt: published,
                channelTitle: youtubeConfig.channelName || 'YouTube Channel',
              };
            } else {
              throw new Error('Could not extract video ID from RSS feed');
            }
          } else {
            throw new Error('No video entries found in RSS feed');
          }
        }

        if (!videoData) {
          throw new Error('No videos found');
        }

        setVideo(videoData);
        setError(null);
      } catch (err) {
        console.error('Error loading YouTube video:', err);
        setError(err.message);
        setVideo(null);
      } finally {
        setLoading(false);
      }
    }

    loadYouTubeVideo();
  }, []);

  // Don't render if disabled
  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="youtube-card-wrapper">
        <div className="youtube-card-header">
          <div className="youtube-card-label">Recently on YouTube</div>
          <div className="youtube-card-line"></div>
        </div>
        <div className="youtube-card youtube-card-loading">
          <div className="youtube-card-skeleton">
            <div className="youtube-card-thumb-skeleton"></div>
            <div className="youtube-card-content-skeleton">
              <div className="youtube-card-title-skeleton"></div>
              <div className="youtube-card-meta-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="youtube-card-wrapper">
        <div className="youtube-card-header">
          <div className="youtube-card-label">Recently on YouTube</div>
          <div className="youtube-card-line"></div>
        </div>
        <div className="youtube-card youtube-card-error">
          <p>Unable to load YouTube video: {error}</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="youtube-card-wrapper">
      {/* Title header above the card */}
      <div className="youtube-card-header">
        <div className="youtube-card-label">Recently on YouTube</div>
        <div className="youtube-card-line"></div>
      </div>
      
      <div className="youtube-card">
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="youtube-card-link"
        >
        <div className="youtube-card-thumb">
          {video.thumbnail && (
            <img 
              src={video.thumbnail} 
              alt={video.title}
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="youtube-card-play-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <div className="youtube-card-content">
          <h3 className="youtube-card-title">{video.title}</h3>
          <div className="youtube-card-meta">
            <span className="youtube-card-channel">{video.channelTitle}</span>
            {video.publishedAt && (
              <span className="youtube-card-date">{formatDate(video.publishedAt)}</span>
            )}
          </div>
          {video.description && (
            <p className="youtube-card-description">
              {video.description.length > 150 
                ? `${video.description.substring(0, 150)}...` 
                : video.description}
            </p>
          )}
        </div>
      </a>
      </div>
    </div>
  );
}

