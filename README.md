# TestTrainer 🧠

Aplicación web local para generar y practicar tests con IA. Sube tus apuntes o preguntas existentes y la IA genera un cuestionario de opción múltiple. Guarda tests, configura el sistema de puntuación y lleva un registro de tu progreso a lo largo del tiempo.

---

## ¿Qué hace?

| Pantalla | Descripción |
|----------|-------------|
| **Dashboard** | Resumen global: tests creados, sesiones completadas, nota media y gráfica de evolución |
| **Mis Tests** | Lista de todos los tests guardados con el último resultado y número de intentos |
| **Nuevo Test** | Sube un archivo → la IA genera preguntas automáticamente → se guarda el test |
| **Hacer Test** | Interfaz de pregunta a pregunta con navegación rápida. Al terminar muestra resultado y permite revisar cada respuesta con explicación |
| **Configuración** | Ajusta la puntuación (correcta / incorrecta / sin responder) y consulta el proveedor de IA activo |

### Flujo completo

```
Subir archivo (PDF/DOCX/TXT)
        ↓
  IA extrae texto y genera preguntas JSON
        ↓
  Test guardado en SQLite local
        ↓
  Haces el test → se guarda la sesión con puntuación
        ↓
  Dashboard muestra tu progreso histórico
```

---

## Requisitos

- **Node.js 18+**
- Clave de API de **uno** de estos proveedores: Anthropic, OpenAI o Google Gemini

---

## Instalación y ejecución

### 1. Clona el repositorio

```bash
git clone https://github.com/aadri05/TestTrainer.git
cd TestTrainer
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Configura las variables de entorno

Copia el archivo de ejemplo:

```bash
# Linux / macOS
cp .env.local.example .env.local

# Windows PowerShell
Copy-Item .env.local.example .env.local
```

Edita `.env.local` con tu proveedor y API key:

```env
# Elige UNO: "anthropic" | "openai" | "gemini"
AI_PROVIDER=anthropic

# Solo necesitas la key del proveedor elegido
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
# GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxx
```

### 4. Arranca en modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

La base de datos SQLite se crea automáticamente en `data/testtrainer.db` al primer arranque. No necesitas ningún paso adicional.

---

## Qué modificar según tu caso

### Cambiar proveedor de IA

Edita `AI_PROVIDER` en `.env.local` y añade la key correspondiente:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### Cambiar el modelo concreto

Por defecto usa el modelo más equilibrado de cada proveedor. Para cambiarlo:

```env
# Anthropic
ANTHROPIC_MODEL=claude-opus-4-7

# OpenAI
OPENAI_MODEL=gpt-4o-mini

# Gemini
GEMINI_MODEL=gemini-1.5-pro
```

### Ajustar puntuación

Desde la pantalla **Configuración** (sin tocar código):
- Correcta: valor positivo (ej. `+1`)
- Incorrecta: valor negativo para penalizar (ej. `-0.25`) o `0` sin penalización
- Sin responder: normalmente `0`

---

## Proveedores de IA soportados

| Proveedor | `AI_PROVIDER` | Modelo por defecto | Dónde obtener key |
|-----------|---------------|--------------------|-------------------|
| Anthropic | `anthropic` | `claude-sonnet-4-6` | console.anthropic.com |
| OpenAI | `openai` | `gpt-4o` | platform.openai.com |
| Google Gemini | `gemini` | `gemini-2.0-flash` | aistudio.google.com |

---

## Formatos de archivo aceptados

| Formato | Extensión |
|---------|-----------|
| PDF | `.pdf` |
| Word | `.docx` |
| Texto plano | `.txt` |
| Markdown | `.md` |

Tamaño máximo procesado por la IA: ~12 000 caracteres del texto extraído (suficiente para un tema completo).

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── upload/               # Subir archivo y generar test
│   ├── tests/                # Lista de tests
│   ├── tests/[id]/           # Hacer test + historial
│   ├── settings/             # Configuración de puntuación
│   └── api/                  # Endpoints REST (upload, tests, sessions, settings)
├── components/
│   ├── TestRunner.tsx        # UI interactiva del test y resultados
│   ├── ScoreChart.tsx        # Gráfica de evolución (Recharts)
│   ├── Sidebar.tsx           # Navegación lateral
│   └── DeleteTestButton.tsx
└── lib/
    ├── db.ts                 # SQLite — esquema y conexión
    ├── ai-provider.ts        # Abstracción multi-proveedor IA
    ├── parsers.ts            # Extracción de texto (PDF/DOCX/TXT)
    ├── types.ts              # Interfaces TypeScript
    └── utils.ts              # Helpers
```

---

## Datos locales

Todo se guarda en `data/testtrainer.db` (SQLite). Este archivo está en `.gitignore` y nunca se sube al repositorio. Para hacer backup de tus tests y puntuaciones, copia ese archivo.

Para empezar desde cero, elimina `data/testtrainer.db` y reinicia la aplicación.
