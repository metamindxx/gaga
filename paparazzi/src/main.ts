import AllSlidesApp from './scenes/AllSlidesApp.svelte';
import { mount } from 'svelte';

const app = mount(AllSlidesApp, { target: document.getElementById('app')! });

export default app;
