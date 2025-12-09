import { hydrate, prerender as ssr } from 'preact-iso';
import { ThemeProvider } from './context/ThemeContext';
import { App } from './app';
import './style.css';

function Root() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

if (typeof window !== 'undefined') {
  hydrate(<Root />, document.getElementById('app'));
}

export async function prerender(data) {
  return await ssr(<Root {...data} />);
}
