// ===== Mill Game: PWA Service Worker Registration =====

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/The-Mill-Game-online-pwa/service-worker.js', { scope: '/The-Mill-Game-online-pwa/' });
      console.log('[PWA] Service Worker registered:', reg.scope);
    } catch (err) {
      console.warn('[PWA] Service Worker failed:', err);
    }
  });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

async function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
}

window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed!');
  deferredPrompt = null;
});
