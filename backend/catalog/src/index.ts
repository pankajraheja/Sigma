// ---------------------------------------------------------------------------
// Catalog backend — entry point
// ---------------------------------------------------------------------------

import { createApp } from './app.js';
import { config } from './config/index.js';
import { routeSummary } from './routes/index.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`\n[catalog-backend] started`);
  console.log(`  env:     ${config.env}`);
  console.log(`  port:    ${config.port}`);
  console.log(`  prefix:  ${config.apiPrefix}`);
  console.log(`  db:      ${config.db.host}:${config.db.port}/${config.db.name}`);
  console.log(`\nRoutes:`);
  routeSummary(config.apiPrefix).forEach((r) => console.log(`  ${r}`));
  console.log('');
});
