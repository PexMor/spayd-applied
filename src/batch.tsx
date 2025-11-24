import { render } from 'preact';
import { BatchApp } from './batch/BatchApp';
import './batch.css';

render(<BatchApp />, document.getElementById('app')!);
