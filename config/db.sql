SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `challenges` (
  `challenge_id` int(10) UNSIGNED NOT NULL,
  `created_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `demon_filter` int(11) NOT NULL,
  `user` varchar(20) NOT NULL,
  `status` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `current_skips` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `max_skips` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `levels` text DEFAULT NULL,
  `score` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `gd_changelogs` (
  `log_id` int(11) UNSIGNED NOT NULL,
  `level_id` int(10) UNSIGNED NOT NULL,
  `log_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` varchar(10) NOT NULL,
  `data1` text NOT NULL,
  `data2` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `gd_demons` (
  `level_id` int(10) UNSIGNED NOT NULL COMMENT 'Level''s ID',
  `difficulty` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Level''s Difficulty',
  `level_name` varchar(20) NOT NULL COMMENT 'Level''s Name',
  `level_description` text NOT NULL COMMENT 'Level''s Description',
  `level_version` smallint(5) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Level''s Version',
  `author_name` varchar(20) NOT NULL COMMENT 'Level author''s name',
  `author_id` int(10) UNSIGNED NOT NULL COMMENT 'Level author''s playerID',
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last cached level date',
  `level_length` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Level''s Length',
  `downloads` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Level downloads',
  `likes` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Level likes',
  `ingame_version` tinyint(3) UNSIGNED NOT NULL DEFAULT 21 COMMENT 'Level version code',
  `coins` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Level coins',
  `coins_verified` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Level coins are verified',
  `creator_points` tinyint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Level creator points',
  `rank_pointercrate` smallint(6) NOT NULL DEFAULT 0 COMMENT 'Level''s Pointercrate rank'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `guild_settings` (
  `guild_id` varchar(20) NOT NULL COMMENT 'Guild''s ID',
  `language` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Guild useing language',
  `admin_role` varchar(20) NOT NULL DEFAULT '0' COMMENT 'Configurable Admin Role ID',
  `mention_role` varchar(20) NOT NULL DEFAULT '0' COMMENT 'Notification mention role ID',
  `channel_awarded` varchar(20) NOT NULL DEFAULT '0',
  `channel_unrated` varchar(20) NOT NULL DEFAULT '0',
  `channel_updated` varchar(20) NOT NULL DEFAULT '0',
  `channel_easy` varchar(20) NOT NULL DEFAULT '0',
  `channel_medium` varchar(20) NOT NULL DEFAULT '0',
  `channel_hard` varchar(20) NOT NULL DEFAULT '0',
  `channel_insane` varchar(20) NOT NULL DEFAULT '0',
  `channel_extreme` varchar(20) NOT NULL DEFAULT '0',
  `enable_awarded` tinyint(1) NOT NULL DEFAULT 0,
  `enable_unrated` tinyint(1) NOT NULL DEFAULT 0,
  `enable_updated` tinyint(1) NOT NULL DEFAULT 0,
  `enable_easy` tinyint(1) NOT NULL DEFAULT 0,
  `enable_medium` tinyint(1) NOT NULL DEFAULT 0,
  `enable_hard` tinyint(1) NOT NULL DEFAULT 0,
  `enable_insane` tinyint(1) NOT NULL DEFAULT 0,
  `enable_extreme` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `challenges`
  ADD PRIMARY KEY (`challenge_id`);

ALTER TABLE `gd_changelogs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `level_id` (`level_id`);

ALTER TABLE `gd_demons`
  ADD PRIMARY KEY (`level_id`),
  ADD KEY `level_name` (`level_name`);

ALTER TABLE `guild_settings`
  ADD PRIMARY KEY (`guild_id`);


ALTER TABLE `challenges`
  MODIFY `challenge_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `gd_changelogs`
  MODIFY `log_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
