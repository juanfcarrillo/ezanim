#!/bin/bash

echo "🎬 Testing NEW video generation flow with preview"
echo "=================================================="
echo ""

# Step 1: Generate HTML animation
echo "📝 Step 1: Generating animation HTML..."
RESPONSE=$(curl -s -X POST http://localhost:3000/video-requests/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "userPrompt": "Explica cómo funciona la inflación paso a paso"
  }')

echo "$RESPONSE" | jq '.'

# Extract ID
VIDEO_ID=$(echo $RESPONSE | jq -r '.id')

if [ -z "$VIDEO_ID" ] || [ "$VIDEO_ID" = "null" ]; then
  echo "❌ Error: No se pudo generar el HTML"
  exit 1
fi

echo ""
echo "✅ HTML generado con ID: $VIDEO_ID"
echo ""

# Step 2: Show preview information
echo "👀 Step 2: Preview ready!"
echo "   El cliente puede revisar la animación antes de renderizar"
echo "   HTML guardado en: /tmp/ezanim/debug/${VIDEO_ID}.html"
echo ""

# Step 3: Render video
echo "🎬 Step 3: Rendering video..."
DURATION=$(echo $RESPONSE | jq -r '.duration')
echo "   Duration: ${DURATION}s"
echo ""

# For POC, we'll auto-render after a short pause
echo "   (En producción, el cliente confirmaría aquí)"
sleep 2

RENDER_RESPONSE=$(curl -s -X POST http://localhost:3000/video-requests/${VIDEO_ID}/render \
  -H 'Content-Type: application/json' \
  -d "{
    \"htmlContent\": $(echo $RESPONSE | jq -c '.htmlContent'),
    \"duration\": ${DURATION}
  }")

echo "$RENDER_RESPONSE" | jq '.'
echo ""

# Step 4: Monitor progress
echo "📊 Step 4: Monitoring render progress..."
for i in {1..100}; do
  STATUS=$(curl -s http://localhost:3000/video-requests/${VIDEO_ID})
  CURRENT_STATUS=$(echo "$STATUS" | jq -r '.status')
  echo "   Status: $CURRENT_STATUS"
  
  if [ "$CURRENT_STATUS" = "COMPLETED" ]; then
    echo ""
    echo "🎉 ¡Video completado!"
    echo ""
    VIDEO_INFO=$(curl -s http://localhost:3000/videos/${VIDEO_ID})
    echo "Información del video:"
    echo "$VIDEO_INFO" | jq '.'
    break
  fi
  
  if [ "$CURRENT_STATUS" = "FAILED" ]; then
    echo ""
    echo "❌ El renderizado falló"
    break
  fi
  
  sleep 2
done
