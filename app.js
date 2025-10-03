// PWA bootstrap: register service worker + install/update UX
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
      console.log('[SW] registered', reg);
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        document.getElementById('refreshBtn')?.removeAttribute('hidden');
      });
      if (reg.waiting) document.getElementById('refreshBtn')?.removeAttribute('hidden');
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            document.getElementById('refreshBtn')?.removeAttribute('hidden');
          }
        });
      });
    } catch (e) { console.warn('[SW] registration failed', e); }
  });
}

// Install prompt
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e; installBtn?.removeAttribute('hidden');
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null; installBtn?.setAttribute('hidden', '');
});

// Update
document.getElementById('refreshBtn')?.addEventListener('click', () => {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
});
