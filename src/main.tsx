import { render } from 'preact'
import { App } from './app.tsx'
import { I18nProvider } from './I18nContext.tsx';
import './index.css'

render(
    <I18nProvider>
        <App />
    </I18nProvider>,
    document.getElementById('app')!
);
