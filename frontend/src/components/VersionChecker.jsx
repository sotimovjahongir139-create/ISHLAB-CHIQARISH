import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Collapse, Box } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Extracts the hash of the main entry JS bundle from an HTML string.
// Vite produces: /assets/index-<hash>.js
const extractBundleHash = (html) => {
  const m = html.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/);
  return m ? m[1] : null;
};

// Gets the hash from the currently loaded scripts in the browser.
const getCurrentHash = () => {
  for (const script of document.querySelectorAll('script[src]')) {
    const m = script.src.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/);
    if (m) return m[1];
  }
  return null;
};

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes

const VersionChecker = () => {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const currentHash = useRef(getCurrentHash());

  const check = async () => {
    if (!currentHash.current) return;
    try {
      const res = await fetch('/', { cache: 'no-store', headers: { pragma: 'no-cache' } });
      if (!res.ok) return;
      const html = await res.text();
      const latestHash = extractBundleHash(html);
      if (latestHash && latestHash !== currentHash.current) {
        setNewVersionAvailable(true);
      }
    } catch {
      // Network error — don't show banner, just skip this check
    }
  };

  useEffect(() => {
    // First check after 30 seconds (give time for page to settle)
    const firstCheck = setTimeout(check, 30_000);

    // Subsequent checks every CHECK_INTERVAL_MS
    const interval = setInterval(check, CHECK_INTERVAL_MS);

    // Also check when tab regains focus (user returns after a long time away)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(firstCheck);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!newVersionAvailable) return null;

  return (
    <Box sx={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, minWidth: 340, maxWidth: '90vw',
    }}>
      <Collapse in={newVersionAvailable}>
        <Alert
          severity="info"
          icon={<Refresh />}
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Yangilash
            </Button>
          }
          sx={{ boxShadow: 4, borderRadius: 2 }}
        >
          Yangi versiya mavjud — sahifani yangilang
        </Alert>
      </Collapse>
    </Box>
  );
};

export default VersionChecker;
