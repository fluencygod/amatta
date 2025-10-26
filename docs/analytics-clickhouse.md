**Overview**
- Goal: Kafka → ClickHouse (Kafka Engine) → Materialized Views for raw storage + real-time approximate aggregates.
- Files added:
  - `docker-compose.clickhouse.yml` – single-node ClickHouse with init scripts mounted
  - `scripts/clickhouse/init/01_init.sql` – DB init
  - `scripts/clickhouse/init/02_kafka_ingest.sql` – Kafka source, raw table, MV
  - `scripts/clickhouse/init/03_aggregates.sql` – per-minute aggregates + views

**Run Services**
- Start Kafka: `make compose-kafka-up`
- Start ClickHouse: `make compose-clickhouse-up`
- Backend should already send events to Kafka when `KAFKA_BOOTSTRAP_SERVERS=kafka:9092`.

**Schema**
- `analytics.events_kafka` (Kafka Engine): reads JSON messages as whole string (`data`).
- `analytics.events_raw` (MergeTree): parsed columns + original JSON `data`.
- `analytics.mv_events_to_raw` (MV): parses JSON and inserts into `events_raw`.
- `analytics.events_agg_minute` (AggregatingMergeTree): minute-level hits + approx unique users.
- `analytics.mv_events_agg_minute` (MV): populates aggregates from raw.
- `analytics.vw_events_agg_minute` (VIEW): finalized aggregates for easy querying.

**Sample Queries**
- Recent raw events:
  - `SELECT event_time, event_name, article_id, user_id FROM analytics.events_raw ORDER BY event_time DESC LIMIT 50;`
- Per-minute events for a page type:
  - `SELECT * FROM analytics.vw_events_agg_minute WHERE event_name = 'page_view' ORDER BY event_minute DESC LIMIT 120;`
- Article stats (last 24h):
  - `SELECT article_id, sum(hits) AS hits, sum(users) AS users FROM analytics.vw_events_agg_minute WHERE event_minute >= now() - INTERVAL 1 DAY GROUP BY article_id ORDER BY hits DESC LIMIT 50;`

**Notes**
- The Kafka source uses `JSONAsString` to keep messages robust; parsing happens in the MV via `JSONExtract*` and `parseDateTime64BestEffortOrNull`.
- Unknown/extra JSON keys are preserved in `events_raw.data` for replay or future parsing.
- Unique users use `uniqCombined*` family (approximate). For exact counts, switch to `uniqExact` at higher cost.
- Partitioning/order are chosen for typical time-series + article queries; tune as needed.

**Operations**
- Logs: `make compose-clickhouse-logs`
- Tear down: `make compose-clickhouse-down` (data volume persists unless deleted)
- Network: All analytics services share `news_net` bridge; Kafka is reachable at `kafka:9092` from ClickHouse.

