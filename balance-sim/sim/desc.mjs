import { ALL_TOKEN_BASES } from '../../src/constants/tokens.js';
for (const id of process.argv.slice(2)) { const t = ALL_TOKEN_BASES.find(x => x.id === id); console.log(id, '|', t?.name, '|', JSON.stringify(t?.values), '|', (t?.desc||'').replace(/\n/g,' ')); }
