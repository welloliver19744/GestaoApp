DELETE FROM _migrations WHERE file LIKE '%005%';
DELETE FROM _migrations WHERE file LIKE '%006%';
DROP TABLE IF EXISTS push_subscriptions;
DELETE FROM _collections WHERE name = 'push_subscriptions';
