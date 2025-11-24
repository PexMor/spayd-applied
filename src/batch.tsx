import { render } from 'preact';
import { BatchApp } from './batch/BatchApp';
import './batch.css';

import { I18nProvider } from './I18nContext';

render(
    <I18nProvider>
        <BatchApp />
    </I18nProvider>,
    document.getElementById('app')!
);
