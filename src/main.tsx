import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// PWA Service Worker Registration
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Yeni bir sürüm mevcut. Uygulamayı güncellemek istiyor musunuz?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Uygulama çevrimdışı kullanıma hazır!');
    // Toast bildirim gösterebiliriz
    const toast = document.createElement('div');
    toast.textContent = 'Uygulama çevrimdışı kullanıma hazır!';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #059669;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 4000);
  },
  onRegisterError(error: any) {
    console.error('PWA registration error', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <App />
);
