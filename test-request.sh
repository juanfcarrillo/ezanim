#!/bin/bash

# Crear un video de prueba
echo "🎬 Creando video de prueba..."
RESPONSE=$(curl -s -X POST http://localhost:3000/poc/test-video \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Explica cómo funciona la inflacion paso a paso"
  }')

echo "Respuesta: $RESPONSE"

# Extraer el ID del video request
VIDEO_ID=$(echo $RESPONSE | grep -o '"videoRequestId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$VIDEO_ID" ]; then
  echo "❌ Error: No se pudo crear el video"
  exit 1
fi

echo ""
echo "✅ Video creado con ID: $VIDEO_ID"
echo ""

# Monitorear el progreso
echo "📊 Monitoreando progreso..."
for i in {1..100}; do
  STATUS=$(curl -s http://localhost:3000/poc/status/$VIDEO_ID)
  echo "Status: $STATUS"
  
  # Si está completado, obtener el video
  if echo "$STATUS" | grep -q '"status":"COMPLETED"'; then
    echo ""
    echo "🎉 ¡Video completado!"
    echo ""
    VIDEO_INFO=$(curl -s http://localhost:3000/poc/video/$VIDEO_ID)
    echo "Información del video:"
    echo "$VIDEO_INFO" | jq '.'
    break
  fi
  
  # Si falló
  if echo "$STATUS" | grep -q '"status":"FAILED"'; then
    echo ""
    echo "❌ El video falló"
    break
  fi
  
  sleep 2
done
