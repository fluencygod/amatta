-- Kafka → ClickHouse raw ingest
USE analytics;

-- Kafka engine source table: keep entire message as a single JSON string (JSONAsString)
DROP TABLE IF EXISTS events_kafka;
CREATE TABLE events_kafka
(
    data String
)
ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'kafka:9092',
    kafka_topic_list = 'news_events',
    kafka_group_name = 'ch_news_ingest',
    kafka_format = 'JSONAsString',
    kafka_num_consumers = 1,
    kafka_handle_error_mode = 'stream';

-- Raw events table: keep parsed columns + original JSON for reprocessing
DROP TABLE IF EXISTS events_raw;
CREATE TABLE events_raw
(
    event_id String,
    event_name LowCardinality(String),
    event String,
    event_time DateTime64(3, 'UTC'),
    ts DateTime64(3, 'UTC'),

    user_id Nullable(String),
    session_id Nullable(String),
    article_id Nullable(UInt64),
    page Nullable(String),
    url Nullable(String),
    current_url Nullable(String),
    referrer Nullable(String),
    position Nullable(Int32),
    viewport_json Nullable(String),
    meta_json Nullable(String),
    ua Nullable(String),
    ip Nullable(String),
    client_version Nullable(String),
    device_type Nullable(String),
    duration_sec Nullable(Int32),

    -- Keep full raw payload for traceability / reprocessing
    data String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_time, event_name, article_id, session_id)
SETTINGS index_granularity = 8192;

-- Materialized View to parse JSON and load into raw table
DROP TABLE IF EXISTS mv_events_to_raw;
CREATE MATERIALIZED VIEW mv_events_to_raw
TO events_raw
AS
SELECT
    -- IDs & names
    coalesce(JSONExtractString(data, 'event_id'), generateUUIDv4()) AS event_id,
    coalesce(JSONExtractString(data, 'event_name'), JSONExtractString(data, 'event')) AS event_name,
    JSONExtractString(data, 'event') AS event,

    -- Timestamps (parse best-effort from ISO8601)
    coalesce(
        parseDateTime64BestEffortOrNull(JSONExtractString(data, 'event_time'), 3),
        parseDateTime64BestEffortOrNull(JSONExtractString(data, 'ts'), 3),
        now64(3)
    ) AS event_time,
    coalesce(
        parseDateTime64BestEffortOrNull(JSONExtractString(data, 'ts'), 3),
        parseDateTime64BestEffortOrNull(JSONExtractString(data, 'event_time'), 3),
        event_time
    ) AS ts,

    -- Identities / context (stored as strings to be robust against mixed types)
    JSONExtractString(data, 'user_id') AS user_id,
    JSONExtractString(data, 'session_id') AS session_id,
    coalesce(toUInt64OrNull(JSONExtractString(data, 'article_id')), JSONExtractUInt(data, 'article_id')) AS article_id,
    JSONExtractString(data, 'page') AS page,
    JSONExtractString(data, 'url') AS url,
    JSONExtractString(data, 'current_url') AS current_url,
    JSONExtractString(data, 'referrer') AS referrer,
    coalesce(toInt32OrNull(JSONExtractString(data, 'position')), JSONExtractInt(data, 'position')) AS position,
    JSONExtractRaw(data, 'viewport') AS viewport_json,
    JSONExtractRaw(data, 'meta') AS meta_json,
    JSONExtractString(data, 'ua') AS ua,
    JSONExtractString(data, 'ip') AS ip,
    JSONExtractString(data, 'client_version') AS client_version,
    JSONExtractString(data, 'device_type') AS device_type,
    coalesce(toInt32OrNull(JSONExtractString(data, 'duration_sec')), JSONExtractInt(data, 'duration_sec')) AS duration_sec,

    data
FROM events_kafka;
