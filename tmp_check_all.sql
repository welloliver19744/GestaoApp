PRAGMA table_info(transactions);
PRAGMA table_info(recurring_transactions);
PRAGMA table_info(push_subscriptions);
SELECT sql FROM sqlite_master WHERE name='transactions';
SELECT sql FROM sqlite_master WHERE name='recurring_transactions';
SELECT sql FROM sqlite_master WHERE name='push_subscriptions';
