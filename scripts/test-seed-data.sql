-- BTCStampsExplorer Test Seed Data
-- Generated from JSON fixtures in tests/fixtures/
-- MySQL 8.0 compatible
-- Idempotent execution using REPLACE INTO

-- ============================================================
-- BLOCK DATA (from blockData.json)
-- ============================================================

REPLACE INTO blocks (block_index, block_time, block_hash, previous_block_hash, ledger_hash, txlist_hash, messages_hash) VALUES
(820000, UNIX_TIMESTAMP('2023-12-01 10:00:00'), '000000000000000000026a3f5a3e5b5c5a8e9d8f7a6b5c4d3e2f1a0b9c8d7e6f', '000000000000000000035b4e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
(819999, UNIX_TIMESTAMP('2023-12-01 09:50:00'), '000000000000000000035b4e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c', '0000000000000000000456789abcdef0123456789abcdef0123456789abcdef01', 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678', 'edcba0987654321fedcba0987654321fedcba0987654321fedcba09876543210', '234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
(819998, UNIX_TIMESTAMP('2023-12-01 09:40:00'), '0000000000000000000456789abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000567890abcdef0123456789abcdef0123456789abcdef012', 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789', 'dcba0987654321fedcba0987654321fedcba0987654321fedcba098765432100', '34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
(819997, UNIX_TIMESTAMP('2023-12-01 09:30:00'), '0000000000000000000567890abcdef0123456789abcdef0123456789abcdef012', '0000000000000000000678901abcdef0123456789abcdef0123456789abcdef0123', 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567890', 'cba0987654321fedcba0987654321fedcba0987654321fedcba0987654321000', '4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
(819996, UNIX_TIMESTAMP('2023-12-01 09:20:00'), '0000000000000000000678901abcdef0123456789abcdef0123456789abcdef0123', '0000000000000000000789012abcdef0123456789abcdef0123456789abcdef01234', 'e5f6789012345678901234567890abcdef1234567890abcdef12345678901', 'ba0987654321fedcba0987654321fedcba0987654321fedcba09876543210000', '567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'),
(819995, UNIX_TIMESTAMP('2023-12-01 09:10:00'), '0000000000000000000789012abcdef0123456789abcdef0123456789abcdef01234', '000000000000000000089012babcdef0123456789abcdef0123456789abcdef012345', 'f6789012345678901234567890abcdef1234567890abcdef123456789012', 'a0987654321fedcba0987654321fedcba0987654321fedcba098765432100000', '67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345'),
(863453, UNIX_TIMESTAMP('2023-12-19 12:00:00'), '0000000000000000000863453abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000863452abcdef0123456789abcdef0123456789abcdef01', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
(863454, UNIX_TIMESTAMP('2023-12-19 13:00:00'), '0000000000000000000863454abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000863453abcdef0123456789abcdef0123456789abcdef01', 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678', 'edcba0987654321fedcba0987654321fedcba0987654321fedcba09876543210', '234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1'),
(863455, UNIX_TIMESTAMP('2023-12-19 14:00:00'), '0000000000000000000863455abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000863454abcdef0123456789abcdef0123456789abcdef01', 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789', 'dcba0987654321fedcba0987654321fedcba0987654321fedcba098765432100', '34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
(863456, UNIX_TIMESTAMP('2023-12-19 15:00:00'), '0000000000000000000863456abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000863455abcdef0123456789abcdef0123456789abcdef01', 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567890', 'cba0987654321fedcba0987654321fedcba0987654321fedcba0987654321000', '4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'),
(827424, UNIX_TIMESTAMP('2024-01-26 10:36:03'), '0000000000000000000827424abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000827423abcdef0123456789abcdef0123456789abcdef01', 'e5f6789012345678901234567890abcdef1234567890abcdef12345678901', 'ba0987654321fedcba0987654321fedcba0987654321fedcba09876543210000', '567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'),
(827132, UNIX_TIMESTAMP('2024-01-24 16:14:42'), '0000000000000000000827132abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000827131abcdef0123456789abcdef0123456789abcdef01', 'f6789012345678901234567890abcdef1234567890abcdef123456789012', 'a0987654321fedcba0987654321fedcba0987654321fedcba098765432100000', '67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345'),
(781141, UNIX_TIMESTAMP('2023-03-17 08:42:40'), '0000000000000000000781141abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000781140abcdef0123456789abcdef0123456789abcdef01', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'),
(781247, UNIX_TIMESTAMP('2023-03-18 02:11:35'), '0000000000000000000781247abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000781246abcdef0123456789abcdef0123456789abcdef01', '234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1', 'edcba0987654321fedcba0987654321fedcba0987654321fedcba09876543210', 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678'),
(781751, UNIX_TIMESTAMP('2023-03-21 07:38:37'), '0000000000000000000781751abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000781750abcdef0123456789abcdef0123456789abcdef01', '34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', 'dcba0987654321fedcba0987654321fedcba0987654321fedcba098765432100', 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789'),
(782215, UNIX_TIMESTAMP('2023-03-24 04:34:04'), '0000000000000000000782215abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000782214abcdef0123456789abcdef0123456789abcdef01', '4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123', 'cba0987654321fedcba0987654321fedcba0987654321fedcba0987654321000', 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567890'),
(820456, UNIX_TIMESTAMP('2023-12-10 00:15:16'), '0000000000000000000820456abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000820455abcdef0123456789abcdef0123456789abcdef01', '567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234', 'ba0987654321fedcba0987654321fedcba0987654321fedcba09876543210000', 'e5f6789012345678901234567890abcdef1234567890abcdef12345678901');

-- ============================================================
-- STAMP DATA (from stampData.json)
-- ============================================================

-- Regular stamps
REPLACE INTO stamps (stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index, ident, stamp_hash, file_hash) VALUES
(99999, 820456, 'jJ2LnOmNoE3x06hs1aDv', 'bc1q3fufvnfyzr3dngrv7f88p93lpqjfewk4qn4lsu', NULL, 1, NULL, 'https://stampchain.io/stamps/bbffc85210304a5845162733f083f08b63df25536eef4339593314fd37fb93eb.svg', 'image/svg+xml', NULL, UNIX_TIMESTAMP('2023-12-10 00:15:16'), 'bbffc85210304a5845162733f083f08b63df25536eef4339593314fd37fb93eb', 117370, 'SRC-20', 'jJ2LnOmNoE3x06hs1aDv', 'de57ccb7cbe797acc4c4ae2d6938ae16'),
(99998, 820456, 'nwajgNx2V9bOYWoX4LrU', 'bc1q3fufvnfyzr3dngrv7f88p93lpqjfewk4qn4lsu', NULL, 1, NULL, 'https://stampchain.io/stamps/d908f11538065965433a3580a083e0a2ed12eb5ed7f2f1a93a07ad8e5b275086.svg', 'image/svg+xml', NULL, UNIX_TIMESTAMP('2023-12-10 00:15:16'), 'd908f11538065965433a3580a083e0a2ed12eb5ed7f2f1a93a07ad8e5b275086', 117369, 'SRC-20', 'nwajgNx2V9bOYWoX4LrU', 'de57ccb7cbe797acc4c4ae2d6938ae16'),
(99997, 820456, 'QSnzBidXmEIKOC3w7Fus', 'bc1q3fufvnfyzr3dngrv7f88p93lpqjfewk4qn4lsu', NULL, 1, NULL, 'https://stampchain.io/stamps/5951cf7c2e033e65bd7d33f8c5c055580c961d67c501ddb3ed94a8e357d30d38.svg', 'image/svg+xml', NULL, UNIX_TIMESTAMP('2023-12-10 00:15:16'), '5951cf7c2e033e65bd7d33f8c5c055580c961d67c501ddb3ed94a8e357d30d38', 117368, 'SRC-20', 'QSnzBidXmEIKOC3w7Fus', 'de57ccb7cbe797acc4c4ae2d6938ae16'),
(99996, 820456, 'P63NVEJ7VQwFoQ5vYq5o', 'bc1q3fufvnfyzr3dngrv7f88p93lpqjfewk4qn4lsu', NULL, 1, NULL, 'https://stampchain.io/stamps/2867adc86ee5eccb2afb8d9a210bb00f83c1f41cd1caf7d1ba1c4b752973d957.svg', 'image/svg+xml', NULL, UNIX_TIMESTAMP('2023-12-10 00:15:16'), '2867adc86ee5eccb2afb8d9a210bb00f83c1f41cd1caf7d1ba1c4b752973d957', 117367, 'SRC-20', 'P63NVEJ7VQwFoQ5vYq5o', 'de57ccb7cbe797acc4c4ae2d6938ae16'),
(99995, 820456, 'n0kp99Clb1QqrosIs053', 'bc1q3fufvnfyzr3dngrv7f88p93lpqjfewk4qn4lsu', NULL, 1, NULL, 'https://stampchain.io/stamps/951cc3df1bcfa6e348f90f2133d79eb4efb45cee3a8866f9be81b8464787c20e.svg', 'image/svg+xml', NULL, UNIX_TIMESTAMP('2023-12-10 00:15:16'), '951cc3df1bcfa6e348f90f2133d79eb4efb45cee3a8866f9be81b8464787c20e', 117366, 'SRC-20', 'n0kp99Clb1QqrosIs053', 'de57ccb7cbe797acc4c4ae2d6938ae16');

-- Cursed stamps
REPLACE INTO stamps (stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index, ident, stamp_hash, file_hash) VALUES
(-1, 781141, 'A10870147047838194000', '1LxW4z23GF3sG9tWhaUtTJd1UHcKu7UiY7', 0, NULL, 1, NULL, NULL, 1, UNIX_TIMESTAMP('2023-03-17 08:42:40'), '0311cbc7aca732234ea6cd1b6c19cd4874b481ee56b0722378159803fe639f54', 42, 'UNKNOWN', 'YgjaQVYxRAy2qUM5gb5r', NULL),
(-2, 781141, 'A10870147047838194000', '1LxW4z23GF3sG9tWhaUtTJd1UHcKu7UiY7', 0, NULL, 1, 'https://stampchain.io/stamps/499ff8275d0e63e1ca28e11bfde1fb4b33faa49cc25a126dfb1128a416d7d0a0.octet-stream', 'application/octet-stream', 1, UNIX_TIMESTAMP('2023-03-17 08:42:40'), '499ff8275d0e63e1ca28e11bfde1fb4b33faa49cc25a126dfb1128a416d7d0a0', 43, 'STAMP', 'GYW454NBE3Ag4B3TKHeQ', 'dc8380ff2563d51896151564dbf83b8c'),
(-3, 781247, 'A3461709874884912000', '1JBEzg8ZcQQiLwJtDgp6Q4ssNxexoYQx8N', 0, NULL, 0, NULL, NULL, 1, UNIX_TIMESTAMP('2023-03-18 02:11:35'), '48268ffd17f2aa5dea5a45ff92c88f6df2705196554755a2482f3d63ae74002f', 46, 'UNKNOWN', 'QvIuy8WMHo9KBAC2BiTt', NULL),
(-4, 781751, 'A542258450559059200', '1J6CdXZA717xgmhXXdHzqNeJqU3GA5LFjG', 0, NULL, 1, 'https://stampchain.io/stamps/d23304f95da14d6c09aff780b481bffcaf51154e67434c572f6dd1c44d596abd.octet-stream', 'application/octet-stream', 1, UNIX_TIMESTAMP('2023-03-21 07:38:37'), 'd23304f95da14d6c09aff780b481bffcaf51154e67434c572f6dd1c44d596abd', 119, 'STAMP', 'OztLJ9lQA8lAasz0Qdxp', 'ad53000bfbbe83df640d160f25904384'),
(-5, 782215, 'A8610795798143396000', '16EHGoD1gtcE53TWtkKrgXpzmv7CK3mxkm', 0, NULL, 0, 'https://stampchain.io/stamps/0721d0b3d7ff4b040c8e5f2ae9219a8cebc8ad101aaa7d3adbe1d3e5c6b0f163.txt', 'text/plain', 7, UNIX_TIMESTAMP('2023-03-24 04:34:04'), '0721d0b3d7ff4b040c8e5f2ae9219a8cebc8ad101aaa7d3adbe1d3e5c6b0f163', 186, 'STAMP', 'TMEs8EOKYT2XzjORWk0a', 'dad2ba39e3f04c93ef1ab191909f4b41');

-- SRC-20 stamps
REPLACE INTO stamps (stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index, ident, stamp_hash, file_hash) VALUES
(-1749, 817928, 'A6241248771557339069', '1WweVUK8kLmSNt6yKKqwVxch3Z7Lw5HAY', 0, 1, 1, 'https://stampchain.io/stamps/9b82172c1f0f4fd31d5a3bd69e9a69c1ef27aaef56c3c0a35affe6131e6f8f64.json', '', 0, UNIX_TIMESTAMP('2023-11-22 14:39:29'), '9b82172c1f0f4fd31d5a3bd69e9a69c1ef27aaef56c3c0a35affe6131e6f8f64', 96393, 'SRC-20', 'obqIcfC7WbNYlnqCRCcx', 'c32abb62acc4dbad587f8a6855b9e042'),
(-1729, 798073, 'A9225995715585957727', 'bc1qw7g3j4w0f0nf9qqgjj739cjvndjpfta3gae5d4', 0, 1, 1, 'https://stampchain.io/stamps/cd85d58b5deea2c2df6750b4c875411566345b8eb14c8c4af6700837043dd884.json', '', 0, UNIX_TIMESTAMP('2023-07-10 11:04:57'), 'cd85d58b5deea2c2df6750b4c875411566345b8eb14c8c4af6700837043dd884', 88948, 'SRC-20', 'RC1rGWfCmXhT73CTXwCo', '391d1723c4f4ae116b2c7417d0b7d6ed'),
(-1728, 797731, 'A1984739286054135800', '1F1Krv7eiwJ7KRvhfbNQUPCTa7UtPxsAk', 0, NULL, 0, 'https://stampchain.io/stamps/8ec55ef595cd6ab278d5fad3ca1b8252fb588c3de0fe731dc3289cdd0f699c5c.json', '', 0, UNIX_TIMESTAMP('2023-07-08 10:20:26'), '8ec55ef595cd6ab278d5fad3ca1b8252fb588c3de0fe731dc3289cdd0f699c5c', 88687, 'SRC-20', 'NPeXcxbu1Qpw2DZ7kwRb', 'b26aaf6ad63aeb90c2be63a159fadfc0'),
(-1725, 796990, 'A1226147893362131188', 'bc1qrxstlgr4hzecg2n50wf458ealq9gxty08n8hfx', 0, 1, 1, 'https://stampchain.io/stamps/98898367af6c65d4d9d1d5829d87f9ecb2e7bceb89f0014135c4d1c802404b1d.json', '', 0, UNIX_TIMESTAMP('2023-07-03 13:33:19'), '98898367af6c65d4d9d1d5829d87f9ecb2e7bceb89f0014135c4d1c802404b1d', 87429, 'SRC-20', 'rkN2sg7AfNTM1xhs3Vm4', '9d229f238f2fe08ea0bb0cd6f5707a23'),
(-1724, 796990, 'A12556674751238008934', 'bc1qrxstlgr4hzecg2n50wf458ealq9gxty08n8hfx', 0, 1, 1, 'https://stampchain.io/stamps/811c8dd0bfeb22cbfae2949603fe8035893524dd3ad4acfc6da1a3b73c747e4b.json', '', 0, UNIX_TIMESTAMP('2023-07-03 13:33:19'), '811c8dd0bfeb22cbfae2949603fe8035893524dd3ad4acfc6da1a3b73c747e4b', 87428, 'SRC-20', 'HkbSBs16x5YfEYWg3huL', 'e3518ab08582b8c8489471a6832434e0');

-- Additional synthetic stamps for pagination testing (to reach 25+ total)
REPLACE INTO stamps (stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index, ident, stamp_hash, file_hash) VALUES
(500001, 820000, 'A1000000000000000001', 'bc1qtest1address1for1pagination1test1a', 0, 1, 1, 'https://stampchain.io/stamps/test001.png', 'image/png', 1, UNIX_TIMESTAMP('2023-12-01 10:01:00'), 'test000000000000000000000000000000000000000000000000000000000001', 117401, 'STAMP', 'testHash0000000001', 'testhash000000000001'),
(500002, 820000, 'A1000000000000000002', 'bc1qtest2address2for2pagination2test2a', 0, 1, 1, 'https://stampchain.io/stamps/test002.png', 'image/png', 1, UNIX_TIMESTAMP('2023-12-01 10:02:00'), 'test000000000000000000000000000000000000000000000000000000000002', 117402, 'STAMP', 'testHash0000000002', 'testhash000000000002'),
(500003, 819999, 'A1000000000000000003', 'bc1qtest3address3for3pagination3test3a', 0, 1, 1, 'https://stampchain.io/stamps/test003.png', 'image/png', 1, UNIX_TIMESTAMP('2023-12-01 09:51:00'), 'test000000000000000000000000000000000000000000000000000000000003', 117371, 'STAMP', 'testHash0000000003', 'testhash000000000003'),
(500004, 819999, 'A1000000000000000004', 'bc1qtest4address4for4pagination4test4a', 0, 1, 1, 'https://stampchain.io/stamps/test004.png', 'image/png', 1, UNIX_TIMESTAMP('2023-12-01 09:52:00'), 'test000000000000000000000000000000000000000000000000000000000004', 117372, 'STAMP', 'testHash0000000004', 'testhash000000000004'),
(500005, 819998, 'A1000000000000000005', 'bc1qtest5address5for5pagination5test5a', 0, 1, 1, 'https://stampchain.io/stamps/test005.png', 'image/png', 1, UNIX_TIMESTAMP('2023-12-01 09:41:00'), 'test000000000000000000000000000000000000000000000000000000000005', 117311, 'STAMP', 'testHash0000000005', 'testhash000000000005');

-- Stamps with market data
REPLACE INTO stamps (stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index, ident, stamp_hash, file_hash) VALUES
(277572, 827424, 'A323225616950786531', '19LhJQeG5s98e5XareR4nGmWYPU7xnwZHK', 0, 1, 1, 'https://stampchain.io/stamps/d3428d1c25035cca1f7182f6eb59b14deabf99b04bd706715ca938a7e66269c8.png', 'image/png', 1, UNIX_TIMESTAMP('2024-01-26 10:36:03'), 'd3428d1c25035cca1f7182f6eb59b14deabf99b04bd706715ca938a7e66269c8', 295134, 'STAMP', 'qJFd3DgYW6tUTBFiZdf0', '7acf4371153cb8324812d867bbd00a6a'),
(446791, 844155, 'A5040405140001130101', 'bc1qx3748mgund0q0y4auw9u6favayw3gvg35hk3gj', 0, NULL, 1, 'https://stampchain.io/stamps/3f9a6d2722c4e4c256eca63212f961d916c7a60fd8aac45b7984b65e0367d7ce.svg', 'image/svg+xml', 1, UNIX_TIMESTAMP('2024-05-19 20:52:44'), '3f9a6d2722c4e4c256eca63212f961d916c7a60fd8aac45b7984b65e0367d7ce', 464504, 'SRC-721', 'apMNgYegMOtMQFzvqmJ8', '8618e0e139a13d2b5c7852d95338a07f'),
(777893, 868698, 'A300476194093058737', '1MjTPRdUpwH5e9yYLpiyE8zd1TvzwTvgUm', 0, NULL, 1, 'https://stampchain.io/stamps/4a586bbefe428385a2f15190a93a96d3c455e8df55da17c5683d56485ce46976.png', 'image/png', 1, UNIX_TIMESTAMP('2024-11-03 19:36:06'), '4a586bbefe428385a2f15190a93a96d3c455e8df55da17c5683d56485ce46976', 795689, 'STAMP', 'ntnSBaRVoT023biXTbjX', 'cf9e827a2c992ad5b02bc469d4b7e658'),
(275100, 827132, 'A890328765311495732', 'bc1qah30e8a6crvlztpz70lf4m0nfp68h07cqwrvzd', 0, 1, 1, 'https://stampchain.io/stamps/b077229b8ec582e1f466191f3ad68fda2ebfe815b4a78e6a031897e664347b0e.png', 'image/png', 1, UNIX_TIMESTAMP('2024-01-24 16:14:42'), 'b077229b8ec582e1f466191f3ad68fda2ebfe815b4a78e6a031897e664347b0e', 292635, 'STAMP', 'yP9gsuJC45Gnyfzz4OG2', '574ff241d653c89af85175d506f0da4a'),
(-1768, 832695, 'PEPETOKENART', 'bc1qefhvcqwuz6g6qy6nck5dq2el2r37pky73tqxkc', 1, NULL, 1, 'https://stampchain.io/stamps/d9a8a299449cfd71405902409f54e40b2684f29f08307818d7ec5243d689dfd6.png', 'image/png', 100000000, UNIX_TIMESTAMP('2024-03-01 19:32:09'), 'd9a8a299449cfd71405902409f54e40b2684f29f08307818d7ec5243d689dfd6', 351291, 'STAMP', 'Ivc3xTnZ922UuasABwKD', '538440cda3e00f0abe88eedcebadf4d7');

-- Additional blocks referenced in stamps
REPLACE INTO blocks (block_index, block_time, block_hash, previous_block_hash) VALUES
(817928, UNIX_TIMESTAMP('2023-11-22 14:39:29'), '0000000000000000000817928abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000817927abcdef0123456789abcdef0123456789abcdef01'),
(798073, UNIX_TIMESTAMP('2023-07-10 11:04:57'), '0000000000000000000798073abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000798072abcdef0123456789abcdef0123456789abcdef01'),
(797731, UNIX_TIMESTAMP('2023-07-08 10:20:26'), '0000000000000000000797731abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000797730abcdef0123456789abcdef0123456789abcdef01'),
(796990, UNIX_TIMESTAMP('2023-07-03 13:33:19'), '0000000000000000000796990abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000796989abcdef0123456789abcdef0123456789abcdef01'),
(844155, UNIX_TIMESTAMP('2024-05-19 20:52:44'), '0000000000000000000844155abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000844154abcdef0123456789abcdef0123456789abcdef01'),
(868698, UNIX_TIMESTAMP('2024-11-03 19:36:06'), '0000000000000000000868698abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000868697abcdef0123456789abcdef0123456789abcdef01'),
(832695, UNIX_TIMESTAMP('2024-03-01 19:32:09'), '0000000000000000000832695abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000832694abcdef0123456789abcdef0123456789abcdef01');

-- ============================================================
-- CREATOR DATA (from stampData.json)
-- ============================================================

REPLACE INTO creator (address, creator) VALUES
('112CLokAZxVTqQsMk4A8L2TxfiWBEh8ejf', 'Remster'),
('112RhmdYhEBu4ULELPJjbdMmwdzC6mBuen', 'Ffmad'),
('1148pace7EQeEP79ZZnT5Xzopuko2z78vy', 'pace'),
('123XqLhXsS45uVVR6PrBVFzQJgXCQp4JzM', 'purplehat.eth'),
('124MynhosCqGVLYY7AameJoKw1u2cBVHAe', '80sKurt Russell x Early Bird');

-- ============================================================
-- SRC-20 DATA (from src20Data.json)
-- ============================================================

-- SRC-20 valid transactions (ALL 20 records from src20Valid array)
REPLACE INTO src20 (tx_hash, block_index, p, op, tick, creator, amt, deci, lim, max, destination, block_time, tx_index) VALUES
('56a96c01d4dc11ed62566bd258a9549e971afedc9270b44a014220e931c4945d', 829516, 'SRC-20', 'DEPLOY', '!', 'bc1q66495tzhclxknfqx8m5wux5l8ldc4atqrfe8w5', NULL, '18', '1000', '1000000', 'bc1p9f664ey73utr59qertk4x9wuxsgddfdurz58qja3j2m6prgftx9q0yxg4c', UNIX_TIMESTAMP('2024-02-08 18:02:36'), 314022),
('ed4ea8136a2f0fa490a4f97f559ccc0d31353cc0a43396ed2ad1333ffe6f652e', 829094, 'SRC-20', 'MINT', '?', 'bc1qx8mk6ys4pzrx39he6khmk0f0ld4y7tkqvee22e', '2100.000000000000000000', '18', NULL, NULL, 'bc1qedz5mpvuc2ha8dahlthfe40psgpqeprfy569su', UNIX_TIMESTAMP('2024-02-06 01:54:17'), 310836),
('d438b82ac5c2e66fd27bcc84876ca2384504f65d19864d6ea1a6e49da2633b6f', 830359, 'SRC-20', 'MINT', '?', 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', '2100.000000000000000000', '18', NULL, NULL, 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', UNIX_TIMESTAMP('2024-02-14 06:20:44'), 319053),
('dcc2577957223ec035f3561250772a47fdb9c67041d9357d0791a9aa4fb7db44', 830426, 'SRC-20', 'MINT', '?', 'bc1q08xaumqpfq7a3tg8ux0zgc0nxp0jyff30kgm94', '2100.000000000000000000', '18', NULL, NULL, 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', UNIX_TIMESTAMP('2024-02-14 18:29:06'), 319424),
('4af17dce3c502b521ca986363cd1e1f0a6daf837bdef6def6d7f71a38c3dce56', 830437, 'SRC-20', 'MINT', '?', 'bc1q8xuyf0z78fpjqq2s6fmsnsem7h5qz5yt867ahz', '2100.000000000000000000', '18', NULL, NULL, 'bc1qwjmh73yzagjvt26z3z7w0npkdhp24d948d6w6y', UNIX_TIMESTAMP('2024-02-14 20:22:32'), 319476),
('7017f09e1e1c28a2ef4a39465905e185adca5d24c41e0171ddad70a540e8792c', 830438, 'SRC-20', 'MINT', '?', 'bc1q59ghrrhlwdq9tpnglmdgank8lxy7q04t59vt9g', '2100.000000000000000000', '18', NULL, NULL, 'bc1qwjmh73yzagjvt26z3z7w0npkdhp24d948d6w6y', UNIX_TIMESTAMP('2024-02-14 20:31:13'), 319483),
('310eb29d37c4253ee20bececa389c8d986d659e26bc9a47a01b1b3231f7a2be6', 830468, 'SRC-20', 'MINT', '?', 'bc1qhm3q87x6rwc7ccjmhqxaqmwwnrn3ad0h423xrp', '2100.000000000000000000', '18', NULL, NULL, 'bc1qj35wnkldsfhfd5qv8p832658v8t2mt2qf2m9fu', UNIX_TIMESTAMP('2024-02-15 01:08:01'), 319564),
('3f2cd9a3c3d0703377522f217a8e1b2b3c50c3e9fa6c7685242b6ec9e62f32ed', 830663, 'SRC-20', 'MINT', '?', 'bc1q6n56d6cy9l0remgxyzsfsgyc3sm2ymza0uuvc3', '2100.000000000000000000', '18', NULL, NULL, 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', UNIX_TIMESTAMP('2024-02-16 07:56:23'), 321057),
('d2946533846f1b506b84180709a34ce8165b900d544ea9b701bc2c2a2a04c502', 830923, 'SRC-20', 'MINT', '?', 'bc1q68dw6zm9ulux4n6grgqmhgvejh5x05y8cg6cpr', '2100.000000000000000000', '18', NULL, NULL, 'bc1qfunrg7lrpewmt2dwpnmwwcadzzml8uvaxs7636', UNIX_TIMESTAMP('2024-02-18 04:29:58'), 325881),
('355e9ba0190b3de42eb50ddfaa1a73815a61f86634188ca52c0161bf7edd374b', 831122, 'SRC-20', 'MINT', '?', 'bc1qhx672nyuwd8569ykccq5cjlkxpungvntayalpk', '2100.000000000000000000', '18', NULL, NULL, 'bc1qns65s54mgv4ns2jn55453c783xsc5zsktg4djf', UNIX_TIMESTAMP('2024-02-19 17:01:54'), 327415),
('70d7d40c29a9fe7fc61451c5f86e75c7f4a1b6dfa140d3917360776444c4ac21', 828906, 'SRC-20', 'MINT', '?', 'bc1qjd5a6fs884swa9wqznk5jnrxhr8rdl36lqlwl7', '2100.000000000000000000', '18', NULL, NULL, 'bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m', UNIX_TIMESTAMP('2024-02-04 21:05:08'), 309365),
('464c38c2e207046b048e35e7b5ff846e24982fd137d14a95533e039766a2ae35', 829094, 'SRC-20', 'MINT', '?', 'bc1qx8mk6ys4pzrx39he6khmk0f0ld4y7tkqvee22e', '2100.000000000000000000', '18', NULL, NULL, 'bc1qedz5mpvuc2ha8dahlthfe40psgpqeprfy569su', UNIX_TIMESTAMP('2024-02-06 01:54:17'), 310837),
('04f0f9a7c225ef9539bfd745411ec671772cdd25c6f2a72c54e97a11d9a3d4aa', 829401, 'SRC-20', 'MINT', '?', 'bc1qkdcpun6q0zdepvfus9k9dmyep9syh4txewmum9', '2100.000000000000000000', '18', NULL, NULL, 'bc1qtzh5qfuq0g4lxe4tj4jknlzyz8ys3pp2x7xgml', UNIX_TIMESTAMP('2024-02-07 23:04:44'), 313437),
('ccabfd388a07aaf665655331d9cf719a25e755462d9c47f1d4644cc8521a6ec0', 830361, 'SRC-20', 'MINT', '?', 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', '2100.000000000000000000', '18', NULL, NULL, 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', UNIX_TIMESTAMP('2024-02-14 06:26:41'), 319055),
('7622f6b65e63a1044b978d4a523990325da50e5d7e99d06e06afd4c97e2dacf6', 830362, 'SRC-20', 'MINT', '?', 'bc1qtad6z4zhrz4nlfznk0truh94hcy7z3qthef04l', '2100.000000000000000000', '18', NULL, NULL, 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', UNIX_TIMESTAMP('2024-02-14 06:30:39'), 319059),
('e332f98a21bd3d0470ab3037cea226810c36fe2686bed39d0a8e37ffb4cae35e', 830426, 'SRC-20', 'MINT', '?', 'bc1q08xaumqpfq7a3tg8ux0zgc0nxp0jyff30kgm94', '2100.000000000000000000', '18', NULL, NULL, 'bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', UNIX_TIMESTAMP('2024-02-14 18:29:06'), 319425),
('e6bccabb5b31f9693a343ef03b54d73d902275a8d865a527167bb739150de19b', 830437, 'SRC-20', 'MINT', '?', 'bc1q8xuyf0z78fpjqq2s6fmsnsem7h5qz5yt867ahz', '2100.000000000000000000', '18', NULL, NULL, 'bc1qwjmh73yzagjvt26z3z7w0npkdhp24d948d6w6y', UNIX_TIMESTAMP('2024-02-14 20:22:32'), 319477),
('9ec24488ecf5f94cb9825a301beda93256513980350ab5303dda53fa882a85ca', 830438, 'SRC-20', 'MINT', '?', 'bc1q59ghrrhlwdq9tpnglmdgank8lxy7q04t59vt9g', '2100.000000000000000000', '18', NULL, NULL, 'bc1qwjmh73yzagjvt26z3z7w0npkdhp24d948d6w6y', UNIX_TIMESTAMP('2024-02-14 20:31:13'), 319484),
('c07c2c90203bc37ef4b5019d8bb28476bb2b3b071251ad04fba9a9331e0f4dd9', 830468, 'SRC-20', 'MINT', '?', 'bc1qhm3q87x6rwc7ccjmhqxaqmwwnrn3ad0h423xrp', '2100.000000000000000000', '18', NULL, NULL, 'bc1qj35wnkldsfhfd5qv8p832658v8t2mt2qf2m9fu', UNIX_TIMESTAMP('2024-02-15 01:08:01'), 319565),
('2e56a970960f98cf65e099b208a563d96e655440ff4605b03d6a79a332cd79a5', 830494, 'SRC-20', 'MINT', '?', 'bc1q6dzxj02tl6e7t3kud4n9pvsx96wknw39va2xe0', '2100.000000000000000000', '18', NULL, NULL, 'bc1qrxz7fwa23k4t60rax0le0tuwmvpzc3xyh434un', UNIX_TIMESTAMP('2024-02-15 06:00:32'), 319654);

-- Additional blocks for SRC-20 (all blocks referenced in src20Valid transactions)
REPLACE INTO blocks (block_index, block_time, block_hash, previous_block_hash) VALUES
(829516, UNIX_TIMESTAMP('2024-02-08 18:02:36'), '0000000000000000000829516abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000829515abcdef0123456789abcdef0123456789abcdef01'),
(829094, UNIX_TIMESTAMP('2024-02-06 01:54:17'), '0000000000000000000829094abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000829093abcdef0123456789abcdef0123456789abcdef01'),
(830359, UNIX_TIMESTAMP('2024-02-14 06:20:44'), '0000000000000000000830359abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830358abcdef0123456789abcdef0123456789abcdef01'),
(830426, UNIX_TIMESTAMP('2024-02-14 18:29:06'), '0000000000000000000830426abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830425abcdef0123456789abcdef0123456789abcdef01'),
(830437, UNIX_TIMESTAMP('2024-02-14 20:22:32'), '0000000000000000000830437abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830436abcdef0123456789abcdef0123456789abcdef01'),
(830438, UNIX_TIMESTAMP('2024-02-14 20:31:13'), '0000000000000000000830438abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830437abcdef0123456789abcdef0123456789abcdef01'),
(830468, UNIX_TIMESTAMP('2024-02-15 01:08:01'), '0000000000000000000830468abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830467abcdef0123456789abcdef0123456789abcdef01'),
(830663, UNIX_TIMESTAMP('2024-02-16 07:56:23'), '0000000000000000000830663abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830662abcdef0123456789abcdef0123456789abcdef01'),
(830923, UNIX_TIMESTAMP('2024-02-18 04:29:58'), '0000000000000000000830923abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830922abcdef0123456789abcdef0123456789abcdef01'),
(831122, UNIX_TIMESTAMP('2024-02-19 17:01:54'), '0000000000000000000831122abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000831121abcdef0123456789abcdef0123456789abcdef01'),
(828906, UNIX_TIMESTAMP('2024-02-04 21:05:08'), '0000000000000000000828906abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000828905abcdef0123456789abcdef0123456789abcdef01'),
(829401, UNIX_TIMESTAMP('2024-02-07 23:04:44'), '0000000000000000000829401abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000829400abcdef0123456789abcdef0123456789abcdef01'),
(830361, UNIX_TIMESTAMP('2024-02-14 06:26:41'), '0000000000000000000830361abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830360abcdef0123456789abcdef0123456789abcdef01'),
(830362, UNIX_TIMESTAMP('2024-02-14 06:30:39'), '0000000000000000000830362abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830361abcdef0123456789abcdef0123456789abcdef01'),
(830494, UNIX_TIMESTAMP('2024-02-15 06:00:32'), '0000000000000000000830494abcdef0123456789abcdef0123456789abcdef01', '0000000000000000000830493abcdef0123456789abcdef0123456789abcdef01');

-- Token stats (ALL 10 records from tokenStats array)
REPLACE INTO src20_token_stats (tick, total_minted, holders_count, last_updated) VALUES
('?', '865200.000000000000000000', 17, '2025-03-19 03:37:36'),
('.', '11000000.000000000000000000', 2, '2025-03-19 05:32:59'),
('.com', '2100000000000000.000000000000000000', 1, '2025-03-14 08:40:54'),
('\\U0001f409', '88888888.000000000000000000', 140, '2025-03-14 06:08:37'),
('\\U0001f411', '44.000000000000000000', 2, '2025-03-17 02:18:06'),
('\\U0001f422', '42000.000000000000000000', 1, '2025-03-17 01:34:26'),
('\\U0001f436', '1000000.000000000000000000', 3, '2025-03-19 10:09:42'),
('\\U0001f438', '21000000.000000000000000000', 1, '2025-03-14 03:44:16'),
('\\U0001f47d', '2718281828459045.000000000000000000', 189, '2025-06-01 02:01:52'),
('\\U0001f4a9', '40000000.000000000000000000', 1, '2025-03-14 06:25:31');

-- SRC-20 balance data (derived from src20 transactions above)
REPLACE INTO src20_balance (address, p, tick, amt, block_time) VALUES
('bc1qedz5mpvuc2ha8dahlthfe40psgpqeprfy569su', 'SRC-20', '?', '4200.000000000000000000', UNIX_TIMESTAMP('2024-02-06 01:54:17')),
('bc1qmkfe4xtmpqhgfp2u3s4du3nj4af06h4cjj7wfm', 'SRC-20', '?', '8400.000000000000000000', UNIX_TIMESTAMP('2024-02-16 07:56:23')),
('bc1qwjmh73yzagjvt26z3z7w0npkdhp24d948d6w6y', 'SRC-20', '?', '4200.000000000000000000', UNIX_TIMESTAMP('2024-02-14 20:31:13')),
('bc1qj35wnkldsfhfd5qv8p832658v8t2mt2qf2m9fu', 'SRC-20', '?', '4200.000000000000000000', UNIX_TIMESTAMP('2024-02-15 01:08:01')),
('bc1qfunrg7lrpewmt2dwpnmwwcadzzml8uvaxs7636', 'SRC-20', '?', '2100.000000000000000000', UNIX_TIMESTAMP('2024-02-18 04:29:58')),
('bc1qns65s54mgv4ns2jn55453c783xsc5zsktg4djf', 'SRC-20', '?', '2100.000000000000000000', UNIX_TIMESTAMP('2024-02-19 17:01:54')),
('bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m', 'SRC-20', '?', '2100.000000000000000000', UNIX_TIMESTAMP('2024-02-04 21:05:08')),
('bc1qtzh5qfuq0g4lxe4tj4jknlzyz8ys3pp2x7xgml', 'SRC-20', '?', '2100.000000000000000000', UNIX_TIMESTAMP('2024-02-07 23:04:44')),
('bc1qrxz7fwa23k4t60rax0le0tuwmvpzc3xyh434un', 'SRC-20', '?', '2100.000000000000000000', UNIX_TIMESTAMP('2024-02-15 06:00:32')),
('bc1q66495tzhclxknfqx8m5wux5l8ldc4atqrfe8w5', 'SRC-20', '!', '0.000000000000000000', UNIX_TIMESTAMP('2024-02-08 18:02:36'));

-- ============================================================
-- MARKET DATA (from marketData.json)
-- ============================================================

-- Stamp market data
REPLACE INTO stamp_market_data (cpid, floor_price_btc, recent_sale_price_btc, open_dispensers_count, closed_dispensers_count, total_dispensers_count, holder_count, unique_holder_count, top_holder_percentage, holder_distribution_score, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, price_source, volume_sources, data_quality_score, confidence_level, last_updated, update_frequency_minutes) VALUES
('A323225616950786531', 1.00000000, NULL, 1, 0, 1, 0, 0, 0.00, 0.00, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 'dispenser', '{"counterparty": 1.0}', 5.0, 3.0, '2025-07-02 06:26:41', 30),
('A5040405140001130101', 0.25000000, NULL, 1, 0, 1, 0, 0, 0.00, 0.00, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 'dispenser', '{"counterparty": 1.0}', 5.0, 3.0, '2025-07-02 10:36:38', 30),
('A300476194093058737', 0.23000000, NULL, 1, 0, 2, 0, 0, 0.00, 0.00, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 'dispenser', '{"counterparty": 1.0}', 5.0, 5.0, '2025-07-02 10:17:38', 30),
('A890328765311495732', 0.20000000, NULL, 1, 0, 1, 0, 0, 0.00, 0.00, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 'dispenser', '{"counterparty": 1.0}', 5.0, 3.0, '2025-07-02 06:31:06', 30),
('PEPETOKENART', 0.17740000, NULL, 1, 0, 1, 0, 0, 0.00, 0.00, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 'dispenser', '{"counterparty": 1.0}', 5.0, 3.0, '2025-07-02 06:07:12', 30);

-- SRC-20 market data
REPLACE INTO src20_market_data (tick, price_btc, price_usd, floor_price_btc, market_cap_btc, market_cap_usd, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, holder_count, circulating_supply, price_change_24h_percent, price_change_7d_percent, price_change_30d_percent, primary_exchange, exchange_sources, data_quality_score, last_updated, update_frequency_minutes) VALUES
('ORDINALS', 0.09800000, NULL, NULL, 2058000.00000000, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 77, '21000000.000000000000000000', -2.00, -2.00, 0.00, 'openstamp', '["openstamp"]', 8.0, '2025-06-17 06:01:43', 5),
('DOODLE', 0.00014000, NULL, NULL, 1400000.00000000, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 34, '10000000000.000000000000000000', 0.00, 0.00, 0.00, 'openstamp', '["openstamp"]', 8.0, '2025-06-17 06:01:43', 5),
('FBUTXO', 0.00070000, NULL, NULL, 700000.00000000, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 0.00000000, 31, '1000000000.000000000000000000', 0.00, 0.00, 0.00, 'openstamp', '["openstamp"]', 8.0, '2025-06-17 06:01:43', 5),
('KEVIN', 0.00050000, NULL, NULL, 5000.00000000, 0.00000000, 0.10000000, 0.50000000, 2.00000000, 10.00000000, 150, '10000000.000000000000000000', 5.00, 10.00, 15.00, 'openstamp', '["openstamp"]', 8.0, '2025-07-02 11:19:40', 5),
('STAMP', 0.00100000, NULL, NULL, 21000.00000000, 0.00000000, 1.00000000, 5.00000000, 20.00000000, 100.00000000, 500, '21000000.000000000000000000', 2.00, 5.00, 10.00, 'openstamp', '["openstamp"]', 8.0, '2025-07-02 11:19:40', 5),
('PEPE', 0.00025000, NULL, NULL, 2500.00000000, 0.00000000, 0.50000000, 2.50000000, 10.00000000, 50.00000000, 300, '10000000.000000000000000000', 1.50, 3.00, 7.50, 'openstamp', '["openstamp"]', 8.0, '2025-07-02 11:19:40', 5);

-- ============================================================
-- COLLECTION DATA (from collectionData.json)
-- ============================================================

-- Collections
REPLACE INTO collections (collection_id, collection_name, collection_description) VALUES
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 'KEVIN', NULL),
(UNHEX('01FB16E3BD5B32AC00892FCAF9023BFD'), 'stampedninja', NULL),
(UNHEX('021C0CAD6986A081440A8AACEE166BB1'), 'INFINITY SEED', 'Unleash a universe of visual splendor with INFINITY SEED, where each stroke and hue is a response to your input. In this interactive art series, your chosen seed—a number or a phrase—blooms into a digital tapestry of algorithmic beauty. Every creation is '),
(UNHEX('029CA44721915C4D1D216430D65D457D'), 'the_pixel_karens', NULL),
(UNHEX('03B298DB2DE2F73787F81699D87CE224'), 'homerstamps', NULL);

-- Collection creators
REPLACE INTO collection_creators (collection_id, creator_address) VALUES
(UNHEX('021C0CAD6986A081440A8AACEE166BB1'), 'bc1q2uh80zl320nsfs57dc5umkf95rcf0s9ppnlyuj'),
(UNHEX('2531AF5D3A023148764800FAA6CC883F'), 'bc1qm4fpjqnae723g7naq66846xw8nwgry6zmj5550');

-- Collection stamps (sample from KEVIN collection)
REPLACE INTO collection_stamps (collection_id, stamp) VALUES
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4258),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4262),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4265),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4269),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4283),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4287),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4303),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 4307),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 5096),
(UNHEX('015F0478516E4273DD90FE59C766DD98'), 5097);

-- ============================================================
-- SRC-101 DATA (from src101Data.json)
-- ============================================================

-- SRC-101 transactions
REPLACE INTO src101 (tx_hash, block_index, p, op, root, name, tokenid, tokenid_utf8, tick_hash, description, tick, wla, imglp, imgf, deploy_hash, creator, pri, lim, mintstart, mintend, owner, block_time, tx_index) VALUES
('c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 863453, 'SRC-101', 'DEPLOY', 'BITNAME', 'Bitname Protocol', NULL, NULL, 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', 'Decentralized naming protocol for Bitcoin', 'BITNAME', 'bc1qexampleaddress1', 'https://example.com/bitname-logo.png', 'png', 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexamplecreator1', 100000, '100', 863453, 863553, 'bc1qexampleowner1', 1703001600, 0),
('c2b2f2a2d2e2f2a2b2c2d2e2f2a2b2c2d2e2f2a2b2c2d2e2f2a2b2c2d2e2f2a2', 863454, 'SRC-101', 'MINT', 'BITNAME', NULL, '616c696365', 'alice', 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', NULL, 'BITNAME', NULL, NULL, NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexampleminter1', NULL, NULL, NULL, NULL, 'bc1qexampleminter1', 1703005200, 0),
('c3b3f3a3d3e3f3a3b3c3d3e3f3a3b3c3d3e3f3a3b3c3d3e3f3a3b3c3d3e3f3a3', 863455, 'SRC-101', 'TRANSFER', 'BITNAME', NULL, '616c696365', 'alice', 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', NULL, 'BITNAME', NULL, NULL, NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', NULL, NULL, NULL, NULL, NULL, 'bc1qexampleminter1', 1703008800, 0),
('c4b4f4a4d4e4f4a4b4c4d4e4f4a4b4c4d4e4f4a4b4c4d4e4f4a4b4c4d4e4f4a4', 863456, 'SRC-101', 'MINT', 'BITNAME', NULL, '626f62', 'bob', 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', NULL, 'BITNAME', NULL, NULL, NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexampleminter2', NULL, NULL, NULL, NULL, 'bc1qexampleminter2', 1703012400, 0);

-- SRC-101 all transactions (includes both valid and invalid)
REPLACE INTO src101_all (tx_hash, block_index, p, op, root, name, tokenid, tokenid_utf8, tick_hash, description, tick, wla, imglp, imgf, deploy_hash, creator, pri, lim, mintstart, mintend, owner, toaddress, destination, destination_nvalue, block_time, tx_index, status) VALUES
('c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 863453, 'SRC-101', 'DEPLOY', 'BITNAME', 'Bitname Protocol', NULL, NULL, 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', 'Decentralized naming protocol for Bitcoin', 'BITNAME', 'bc1qexampleaddress1', 'https://example.com/bitname-logo.png', 'png', 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexamplecreator1', 100000, '100', NULL, 863453, 863553, 'bc1qexampleowner1', NULL, NULL, NULL, 1703001600, 0, NULL),
('c2b2f2a2d2e2f2a2b2c2d2e2f2a2b2c2d2e2f2a2b2c2d2e2f2a2b2c2d2e2f2a2', 863454, 'SRC-101', 'MINT', 'BITNAME', NULL, 'alice', '616c696365', 'alice', 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', NULL, 'BITNAME', NULL, NULL, NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexampleminter1', NULL, NULL, NULL, NULL, NULL, 'bc1qexampleminter1', NULL, 'bc1qexampleminter1', 100000, 1703005200, 0, NULL),
('c3b3f3a3d3e3f3a3b3c3d3e3f3a3b3c3d3e3f3a3b3c3d3e3f3a3b3c3d3e3f3a3', 863455, 'SRC-101', 'TRANSFER', 'BITNAME', NULL, 'alice', '616c696365', 'alice', 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', NULL, 'BITNAME', NULL, NULL, NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', NULL, NULL, NULL, NULL, NULL, NULL, 'bc1qexampleminter1', 'bc1qexamplerecipient1', 'bc1qexamplerecipient1', NULL, 1703008800, 0, NULL),
('c4b4f4a4d4e4f4a4b4c4d4e4f4a4b4c4d4e4f4a4b4c4d4e4f4a4b4c4d4e4f4a4', 863456, 'SRC-101', 'MINT', 'BITNAME', NULL, 'bob', '626f62', 'bob', 'd1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1', NULL, 'BITNAME', NULL, NULL, NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexampleminter2', NULL, NULL, NULL, NULL, NULL, 'bc1qexampleminter2', NULL, 'bc1qexampleminter2', 100000, 1703012400, 0, NULL);

-- SRC-101 pricing tiers
REPLACE INTO src101_price (deploy_hash, len, price) VALUES
('c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 3, 500000),
('c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 4, 200000),
('c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 5, 100000);

-- SRC-101 whitelist recipients
REPLACE INTO src101_recipients (deploy_hash, address) VALUES
('c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexampleaddress1'),
('c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'bc1qexampleaddress2');

-- SRC-101 ownership records
REPLACE INTO src101_owners (`index`, deploy_hash, p, tokenid, tokenid_utf8, owner, txt_data, expire_timestamp, img, address_btc, address_eth, prim) VALUES
(NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'SRC-101', '616c696365', 'alice', 'bc1qexamplerecipient1', 'Hello from Alice', 1735689600, 'https://example.com/alice.png', 'bc1qexamplerecipient1', NULL, 1),
(NULL, 'c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1', 'SRC-101', '626f62', 'bob', 'bc1qexampleminter2', 'Bob''s bitname', 1735689600, NULL, 'bc1qexampleminter2', '0xexampleeth2', 1);

-- ============================================================
-- Summary Statistics
-- ============================================================
-- Blocks: 32 total (17 base + 15 for new SRC-20 transactions)
-- Stamps: 25 total (5 regular, 5 cursed, 5 SRC-20, 5 with market data, 5 synthetic for pagination)
-- Creators: 5 total
-- SRC-20 tokens: 20 valid transactions (ALL 20 from JSON)
-- SRC-20 balances: 10 holders (derived from transaction data)
-- SRC-20 token stats: 10 tokens (ALL 10 from JSON)
-- SRC-101 tokens: 4 transactions
-- Collections: 5 total
-- Market data: 6 SRC-20 tokens + 5 stamp entries
-- ============================================================
