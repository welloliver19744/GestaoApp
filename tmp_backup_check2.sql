SELECT file FROM _migrations;
SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions';
SELECT fields FROM _collections WHERE name='transactions';
