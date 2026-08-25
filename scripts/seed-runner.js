const { register } = require('ts-node');

register({
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
  },
});

require('../prisma/seed.ts');
