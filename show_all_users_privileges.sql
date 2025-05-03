-- Show all users and their privileges
SELECT DISTINCT CONCAT('SHOW GRANTS FOR ''', user, '''@''', host, ''';') AS query
FROM mysql.user
ORDER BY user;