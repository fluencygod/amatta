Kafka (KRaft, no ZooKeeper)

- Image: Confluent Kafka (`confluentinc/cp-kafka`, default `7.6.1`)
- Ports:
  - Internal (compose network): `kafka:9092`
  - Host access: `localhost:9094`
- Persistence: named volume `kafka_data` mounted at `/var/lib/kafka/data`.

Run
- Start: `make compose-kafka-up`
- Stop: `make compose-kafka-down`
- Logs: `docker compose -f docker-compose.kafka.yml logs -f`

Verify
- Kafka version: `docker exec -it news_kafka kafka-topics --version`
- Broker API: `docker exec -it news_kafka kafka-broker-api-versions --bootstrap-server localhost:9092`
- KRaft mode: `docker exec -it news_kafka grep -E 'process.roles|controller.quorum.voters' /etc/kafka/kafka.properties`

Backend integration
- Compose network: set `KAFKA_BOOTSTRAP_SERVERS=kafka:9092`
- Host clients: use `localhost:9094`
- Topic auto-create is enabled; default topic: `news_events`

Notes
- On first run the container formats storage in KRaft mode. If `CLUSTER_ID` is not set, a random one is generated automatically.
- To pin a specific Confluent version, set `KAFKA_IMAGE=confluentinc/cp-kafka:<version>` in `.env`.
