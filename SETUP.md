# ForSync v2.0 — Guía de Despliegue Completa

## Resumen de la migración
- ❌ Supabase (eliminado completamente)
- ✅ **Neon Postgres** — base de datos gratuita
- ✅ **Vercel Functions** — backend serverless (API routes en `/api/`)
- ✅ **Google OAuth propio** — callback en `forsync.vercel.app/api/auth/callback`  
  → Google mostrará **"Ir a forsync.vercel.app"** en la pantalla de consentimiento

---

## PASO 1 — Neon Postgres (base de datos)

1. Ve a [console.neon.tech](https://console.neon.tech) y crea una cuenta
2. Crea un nuevo proyecto (elige la región más cercana, ej. `US East`)
3. Ve a **Connection Details** → copia el **Connection String** que empieza con `postgresql://...`
4. Guárdalo, lo necesitas como `DATABASE_URL`

---

## PASO 2 — Google Cloud Console (OAuth)

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Selecciona tu proyecto (o crea uno nuevo: **New Project** → "ForSync")
3. Ve a **APIs & Services → Credentials**
4. Haz clic en **Create Credentials → OAuth 2.0 Client ID**
5. Tipo: **Web application**
6. **Authorized redirect URIs** → agrega EXACTAMENTE:
   ```
   https://forsync.vercel.app/api/auth/callback
   ```
7. Guarda el **Client ID** y **Client Secret**

> ⚠️ Si tienes un Client ID anterior de Supabase, **elimina** el redirect URI viejo  
> `https://hihixmcfkonazkfkbuug.supabase.co/auth/v1/callback`  
> y reemplázalo por el de arriba.

---

## PASO 3 — Subir código a Vercel

1. Sube todos los archivos a un repositorio de GitHub (público o privado)
2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa el repositorio
3. **Framework Preset**: Other (es un site estático + functions)
4. **Build Command**: *(vacío o `echo ok`)*
5. **Output Directory**: *(vacío)*

### Variables de entorno en Vercel:
Ve a **Settings → Environment Variables** y agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://usuario:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` |
| `JWT_SECRET` | Genera uno con: `openssl rand -base64 32` (mínimo 32 chars aleatorios) |
| `APP_URL` | `https://forsync.vercel.app` |
| `ADMIN_EMAIL` | `jesudavifosa24@gmail.com` |

6. Haz clic en **Deploy**

---

## PASO 4 — Inicializar la base de datos

Una vez desplegado, abre en el navegador:

```
https://forsync.vercel.app/api/setup?key=[PRIMEROS_16_CHARS_DE_JWT_SECRET]
```

Por ejemplo, si tu `JWT_SECRET` es `mi-secreto-super-largo-aqui-32chars`, la URL sería:
```
https://forsync.vercel.app/api/setup?key=mi-secreto-super
```

Deberías ver:
```json
{ "ok": true, "message": "Schema creado y datos iniciales insertados." }
```

Esto crea todas las tablas y el usuario admin con:
- Email: el valor de `ADMIN_EMAIL`
- Contraseña inicial: `admin123` ← **cámbiala inmediatamente** desde el perfil

---

## PASO 5 — Verificar

1. Ve a `https://forsync.vercel.app` → la página carga con servicios demo
2. Ve a `https://forsync.vercel.app/login` → prueba login con email/contraseña
3. Haz clic en **"Continuar con Google"** → deberías ver la pantalla de Google con **"forsync.vercel.app"**
4. Ve a `https://forsync.vercel.app/admin` → inicia sesión con el admin
5. En el panel admin, agrega tus servicios reales desde **Gestión de Servicios**

---

## PASO 6 — Agregar servicios reales

1. Entra al panel admin → **Servicios** → **Añadir Nuevo Servicio**
2. Los servicios que agregues aquí aparecen en tiempo real en la página pública
3. El sistema viene con 10 servicios de ejemplo en el frontend; una vez que agregues los tuyos desde el admin, esos reemplazarán los de ejemplo

---

## Flujo completo de datos (cómo funciona)

```
Usuario hace algo     →  scripts.js  →  /api/data/...  →  Neon DB
Admin hace algo       →  admin-scripts.js  →  /api/admin/...  →  Neon DB
Google OAuth          →  /api/auth/google  →  accounts.google.com
Google callback       →  /api/auth/callback  →  Neon DB  →  Cookie JWT
```

---

## Estructura de archivos

```
forsync/
├── api/
│   ├── _db.js              # Cliente Neon + schema
│   ├── _auth.js            # JWT helpers
│   ├── setup.js            # Inicialización (llamar 1 sola vez)
│   ├── auth/
│   │   ├── me.js           # GET sesión actual
│   │   ├── login.js        # POST login email/pass
│   │   ├── register.js     # POST registro
│   │   ├── logout.js       # POST logout
│   │   ├── google.js       # GET inicia OAuth con Google
│   │   ├── callback.js     # GET callback de Google ← forsync.vercel.app
│   │   ├── profile.js      # GET/PATCH perfil de usuario
│   │   ├── reset-request.js   # POST solicita reset de contraseña
│   │   └── reset-password.js  # POST aplica nueva contraseña
│   ├── data/
│   │   ├── products.js     # GET servicios públicos
│   │   ├── promotions.js   # GET promos / POST validar código
│   │   ├── reviews.js      # GET reseñas aprobadas
│   │   ├── orders.js       # POST crear pedido / GET mis pedidos
│   │   ├── quotes.js       # POST cotización / GET mis cotizaciones
│   │   ├── contact.js      # POST mensaje de contacto
│   │   └── reviews-submit.js  # POST enviar reseña (requiere auth)
│   └── admin/
│       ├── _guard.js       # Middleware: solo admin
│       ├── dashboard.js    # GET todos los datos del admin
│       ├── orders.js       # PATCH actualizar estado pedido
│       ├── quotes.js       # PATCH actualizar estado cotización
│       ├── reviews.js      # PATCH aprobar / DELETE eliminar reseña
│       ├── messages.js     # PATCH marcar leído / DELETE eliminar
│       ├── products.js     # POST/PATCH/DELETE servicios
│       └── promotions.js   # POST/PATCH/DELETE promociones
├── index.html
├── admin.html
├── login.html
├── reset-password.html
├── scripts.js
├── admin-scripts.js
├── styles.css
├── admin-styles.css
├── package.json
├── vercel.json
└── _env               # Plantilla de variables de entorno
```

---

## Solución de problemas

**"No puedo hacer login"** → Verifica que `JWT_SECRET` esté en las env vars de Vercel y haber llamado `/api/setup`

**"Google sigue mostrando supabase.co"** → Asegúrate de haber actualizado el redirect URI en Google Cloud Console al nuevo `https://forsync.vercel.app/api/auth/callback`

**"Error de base de datos"** → Verifica que `DATABASE_URL` esté correcto y tenga `?sslmode=require` al final

**"Panel admin dice 403"** → El usuario que usas no tiene `role='admin'`. Ejecuta en Neon Console:
```sql
UPDATE users SET role = 'admin' WHERE email = 'jesudavifosa24@gmail.com';
```
