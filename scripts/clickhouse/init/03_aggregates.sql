-- Real-time approximate aggregates via Materialized Views
USE analytics;

-- Aggregating table for per-minute counts and approx unique users
DROP TABLE IF EXISTS events_agg_minute;
CREATE TABLE events_agg_minute
(
    event_minute DateTime,
    event_name LowCardinality(String),
    article_id Nullable(UInt64),
    hits_state AggregateFunction(count),
    users_state AggregateFunction(uniqCombined, String)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(event_minute)
-- Sorting key cannot contain Nullable; map NULL article_id to 0 for ordering
ORDER BY (event_minute, event_name, ifNull(article_id, toUInt64(0)))
SETTINGS index_granularity = 8192;

-- MV to populate aggregates from raw
DROP TABLE IF EXISTS mv_events_agg_minute;
CREATE MATERIALIZED VIEW mv_events_agg_minute
TO events_agg_minute
AS
SELECT
    toStartOfMinute(event_time) AS event_minute,
    coalesce(event_name, event) AS event_name,
    article_id,
    countState() AS hits_state,
    uniqCombinedState(coalesce(user_id, '')) AS users_state
FROM events_raw
GROUP BY event_minute, event_name, article_id;

-- Convenience view that finalizes aggregation on read
DROP VIEW IF EXISTS vw_events_agg_minute;
CREATE VIEW vw_events_agg_minute AS
SELECT
    event_minute,
    event_name,
    article_id,
    countMerge(hits_state) AS hits,
    uniqCombinedMerge(users_state) AS users
FROM events_agg_minute
GROUP BY event_minute, event_name, article_id
ORDER BY event_minute DESC, event_name, article_id
SETTINGS max_bytes_before_external_group_by = '2Gi';
