import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider, MarketDataProvider } from './lib/context';
import { captureAttribution } from './lib/attribution';
import './index.css';

captureAttribution();

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <MarketDataProvider>
      <App />
    </MarketDataProvider>
  </AuthProvider>,
);
