import './lib/env.js';
import { createApp } from './app.js';
const port = Number(process.env.PORT ?? 4000);
createApp().listen(port, () => console.log(`AXON API disponible sur http://localhost:${port}`));
