import * as migration_20261005_211441_initial from './20261005_211441_initial';

export const migrations = [
  {
    up: migration_20261005_211441_initial.up,
    down: migration_20261005_211441_initial.down,
    name: '20261005_211441_initial'
  },
];
