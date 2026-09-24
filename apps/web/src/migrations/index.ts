import * as migration_20260924_153136_initiaal from './20260924_153136_initiaal';

export const migrations = [
  {
    up: migration_20260924_153136_initiaal.up,
    down: migration_20260924_153136_initiaal.down,
    name: '20260924_153136_initiaal'
  },
];
