from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .routers import auth, articles, profile, bookmarks, reactions, events


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    # NOTE: Alembic handles migrations in non-test envs.

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allowed_methods,
        allow_headers=settings.cors_allowed_headers,
    )

    # Routers
    app.include_router(auth.router)
    app.include_router(articles.router)
    app.include_router(profile.router)
    app.include_router(bookmarks.router)
    app.include_router(reactions.router)
    app.include_router(events.router)

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    # Kafka producer lifecycle (optional)
    @app.on_event("startup")
    async def _start_kafka():
        from .config import settings as cfg
        app.state.kafka_producer = None
        if cfg.kafka_bootstrap_servers and cfg.analytics_enabled:
            try:
                from aiokafka import AIOKafkaProducer

                producer = AIOKafkaProducer(bootstrap_servers=cfg.kafka_bootstrap_servers)
                await producer.start()
                app.state.kafka_producer = producer
            except Exception:
                app.state.kafka_producer = None

    @app.on_event("shutdown")
    async def _stop_kafka():
        producer = getattr(app.state, "kafka_producer", None)
        if producer:
            try:
                await producer.stop()
            except Exception:
                pass

    return app


app = create_app()
