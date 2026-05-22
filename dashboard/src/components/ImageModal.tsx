import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  // Trim the URL to avoid any leading/trailing spaces causing errors
  const cleanUrl = url.trim();

  // Helper to convert TradingView page URL to direct image URL
  const getDirectImageUrl = (rawUrl: string): string => {
    const trimmed = rawUrl.trim();
    if (trimmed.endsWith('.png') || trimmed.endsWith('.jpg') || trimmed.endsWith('.jpeg')) {
      return trimmed;
    }
    
    // TradingView URL pattern: e.g., https://www.tradingview.com/x/hwVRhkVU/
    // Direct URL: https://s3.tradingview.com/snapshots/h/hwVRhkVU.png
    const match = trimmed.match(/tradingview\.com\/x\/([A-Za-z0-9]+)\/?$/);
    if (match && match[1]) {
      const snapshotId = match[1];
      const firstLetter = snapshotId.charAt(0).toLowerCase();
      return `https://s3.tradingview.com/snapshots/${firstLetter}/${snapshotId}.png`;
    }
    
    return trimmed;
  };

  const directUrl = getDirectImageUrl(cleanUrl);
  const isDirectImage = directUrl.endsWith('.png') || directUrl.endsWith('.jpg') || directUrl.endsWith('.jpeg');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>TradingView Screenshot</h3>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            Open Original <ExternalLink size={14} />
          </a>
        </div>

        <div className="modal-image-container">
          {isDirectImage ? (
            <img
              src={directUrl}
              alt="Trading setup"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `
                  <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <p>Failed to load image directly.</p>
                    <a href="${cleanUrl}" target="_blank" style="color: var(--accent-primary);">Click here to view on TradingView</a>
                  </div>
                `;
              }}
            />
          ) : (
            <iframe
              src={cleanUrl}
              style={{ width: '80vw', height: '70vh', border: 'none', borderRadius: '8px' }}
              title="TradingView"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
