# Ezanim Backend

Backend para el motor de creación de videos con IA Ezanim, especializado en videos explicativos.

## Arquitectura

Este proyecto sigue los principios de **Clean Architecture** con las siguientes capas:

```
backend/src/
├── domain/              # Capa de Dominio (Entidades, Value Objects, Interfaces)
│   ├── entities/        # Entidades del negocio
│   ├── value-objects/   # Objetos de valor
│   └── repositories/    # Interfaces de repositorios
├── application/         # Capa de Aplicación (Casos de Uso, DTOs)
│   ├── use-cases/       # Casos de uso del negocio
│   └── dtos/            # Data Transfer Objects
├── infrastructure/      # Capa de Infraestructura (Implementaciones)
│   ├── repositories/    # Implementación de repositorios
│   ├── puppeteer/       # Servicio de renderizado con Puppeteer
│   ├── ffmpeg/          # Servicio de encoding con FFmpeg
│   ├── storage/         # Servicio de almacenamiento R2 (Cloudflare)
│   └── queue/           # Gestión de colas con BullMQ
└── presentation/        # Capa de Presentación (Controllers, Middlewares)
    ├── controllers/     # Controladores REST
    └── middlewares/     # Middlewares HTTP
```

## Stack Tecnológico

- **Runtime**: Node.js 20
- **Framework**: NestJS (TypeScript)
- **Queue Management**: BullMQ + Redis
- **Browser Automation**: Puppeteer (Headless Chrome)
- **Video Encoding**: FFmpeg
- **Storage**: Cloudflare R2
- **Animation**: Anime.js (client-side)
- **Container**: Docker

## Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- Redis (incluido en docker-compose)
- Cuenta Cloudflare con acceso a R2

## Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd ezanim
   ```

2. **Instalar dependencias del backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

4. **Iniciar Redis localmente** (si no usas Docker)
   ```bash
   redis-server
   ```

5. **Ejecutar en modo desarrollo**
   ```bash
   npm run start:dev
   ```

## Instalación con Docker

1. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de Cloudflare R2
   ```

2. **Construir y ejecutar con Docker Compose**
   ```bash
   docker-compose up --build
   ```

El servidor estará disponible en `http://localhost:3000`

## API Endpoints

### Video Requests

- **POST** `/video-requests` - Crear una nueva solicitud de video
  ```json
  {
    "userPrompt": "Explain how photosynthesis works with animated diagrams"
  }
  ```

- **GET** `/video-requests/:id` - Obtener el estado de una solicitud

### Videos

- **GET** `/videos/by-request/:videoRequestId` - Obtener el video renderizado

## Flujo de Trabajo

1. **Usuario envía prompt** → POST `/video-requests`
2. **Sistema crea VideoRequest** → Estado: PENDING
3. **Job se agrega a cola BullMQ** → Worker procesa
4. **IA procesa en 3 etapas**:
   - Refinar prompt (Estado: REFINING_PROMPT)
   - Crear elementos (Estado: CREATING_ELEMENTS)
   - Animar elementos (Estado: ANIMATING)
5. **Renderizado** (Estado: RENDERING):
   - Puppeteer captura frames del HTML animado
   - FFmpeg codifica frames en video .mp4
   - Video se sube a R2
6. **Completado** → Estado: COMPLETED
7. **Usuario descarga** → URL pública o firmada de R2

## Estructura de Entidades

### VideoRequest
- Representa una solicitud de creación de video
- Estados: PENDING, REFINING_PROMPT, CREATING_ELEMENTS, ANIMATING, RENDERING, COMPLETED, FAILED

### AnimationElement
- Elementos individuales del video (texto, imágenes, formas, SVG, HTML)
- Contiene estilos CSS y configuración de animación con Anime.js

### Video
- Resultado final renderizado
- Incluye URL de R2, duración, dimensiones, FPS

## Próximos Pasos (No Implementado)

- [ ] Integración con OpenAI/Claude para generación de contenido
- [ ] Implementación completa de los casos de uso
- [ ] Implementación de Puppeteer para captura de frames
- [ ] Implementación de FFmpeg para encoding
- [ ] Implementación de R2 para almacenamiento
- [ ] Sistema de autenticación
- [ ] Base de datos persistente (PostgreSQL/MongoDB)
- [ ] Frontend con React
- [ ] Webhooks para notificaciones
- [ ] Sistema de preview en tiempo real

## Scripts Disponibles

```bash
npm run start          # Modo producción
npm run start:dev      # Modo desarrollo con watch
npm run start:debug    # Modo debug
npm run build          # Compilar TypeScript
npm run lint           # Linting con ESLint
npm run format         # Formatear con Prettier
npm run test           # Ejecutar tests
```

## Notas de Desarrollo

- Los repositorios actuales son **in-memory** para desarrollo
- Los servicios de Puppeteer, FFmpeg y R2 tienen esqueletos sin implementación
- Los casos de uso retornan `throw new Error('Not implemented')`
- El processor de BullMQ necesita implementación completa

## Licencia

MIT
