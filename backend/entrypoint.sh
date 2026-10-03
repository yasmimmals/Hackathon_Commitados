#!/bin/sh
set -e
echo ">> Aplicando migrations..."
alembic upgrade head
echo ">> Populando tabelas de referência..."
python -m scripts.seed
echo ">> Subindo API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
