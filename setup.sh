#!/bin/bash

docker network create app-network

docker volume create mysql-data

docker run -d \
  --name mysql \
  --network app-network \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456789 \
  -e MYSQL_DATABASE=vowave_case \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=123456789 \
  mysql:8

docker run -d \
  --name elasticsearch \
  --network app-network \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.14.3

echo "Waiting for MySQL to be ready..."
until docker exec mysql mysqladmin ping -h"localhost" --silent; do
  echo "MySQL is not ready, retrying..."
  sleep 2
done

echo "MySQL is up and running."

echo "Waiting for Elasticsearch to be ready..."
until curl -s http://localhost:9200/_cluster/health | grep -q '"status":"green"' || curl -s http://localhost:9200/_cluster/health | grep -q '"status":"yellow"'; do
  echo "Elasticsearch is not ready, retrying..."
  sleep 2
done

echo "Elasticsearch is up and running."

echo "Configuring Elasticsearch index..."
curl -X PUT "http://localhost:9200/users" -H 'Content-Type: application/json' -d '
{
  "mappings": {
    "properties": {
      "name": { "type": "text" },
      "email": { "type": "text" },
      "bio": { "type": "text" },
      "location": { "type": "geo_point" },
      "role": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}'

echo "Index configured."

docker compose up -d --build