# 🐾 Zoonosis — Municipalidad de Villa Allende

Sistema de fichas sanitarias para la gestión de animales del área de Zoonosis municipal.

## Funcionalidades

- **Ficha sanitaria individual** por animal (perro, gato, otro)
- **Vacunaciones** con seguimiento de próximas dosis
- **Desparasitaciones** (interna, externa, ambas)
- **Estudios médicos** (análisis, ecografía, biopsias, cirugías, etc.)
- **Intervenciones y consultas** con diagnóstico, tratamiento y seguimiento
- **Registro de peso** con gráfico de evolución
- **Recordatorios automáticos** al cargar vacunas, desparasitaciones y seguimientos
- **Panel económico** con costos por categoría y gráfico de distribución
- **Estadísticas por animal**: historial sanitario, frecuencia de atención, indicadores de complejidad
- **Dashboard** con alertas urgentes y próximos vencimientos
- **Multi-usuario** con login individual (cada acción queda identificada)

---

## Instalación y deploy GRATUITO en Vercel + Supabase

### Paso 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **Start for free** → crear cuenta
2. Crear un nuevo proyecto (elegir región: **South America (São Paulo)**)
3. Esperar a que el proyecto se inicialice (~2 min)
4. Ir a **SQL Editor** → **New query**
5. Pegar el contenido completo de `SCHEMA.sql` y ejecutar con el botón **Run**
6. Verificar que las tablas aparecen en **Table Editor**

### Paso 2 — Obtener credenciales de Supabase

1. En el proyecto Supabase: ir a **Settings → API**
2. Copiar:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key** (clave larga que empieza con `eyJ...`)

### Paso 3 — Configurar variables de entorno

1. Copiar el archivo `.env.example` a `.env.local`:
   ```
   cp .env.example .env.local
   ```
2. Editar `.env.local` con los valores obtenidos:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...tu_clave_aqui...
   ```

### Paso 4 — Subir el código a GitHub

1. Crear repositorio en [github.com](https://github.com) → **New repository**
2. Ejecutar en la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Sistema Zoonosis Villa Allende"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/zoonosis.git
   git push -u origin main
   ```

### Paso 5 — Deploy en Vercel (GRATIS)

1. Ir a [vercel.com](https://vercel.com) → **Sign up** con tu cuenta de GitHub
2. Clic en **New Project** → importar el repositorio `zoonosis`
3. En **Environment Variables** agregar:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu clave pública
4. Clic en **Deploy**
5. En ~2 minutos tenés la URL del sistema (ej: `https://zoonosis-villaallende.vercel.app`)

### Paso 6 — Crear primer usuario

1. Entrar a la URL del sistema
2. Clic en "¿No tenés cuenta? Registrarte"
3. Crear el primer usuario (será veterinario por defecto)
4. Para cambiar roles: en Supabase → Table Editor → `profiles` → editar el campo `role`
   - Roles disponibles: `admin`, `veterinario`, `administrativo`

---

## Uso local (desarrollo)

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`

---

## Estructura del proyecto

```
src/
├── lib/supabase.js          → Cliente Supabase
├── contexts/AuthContext.jsx  → Autenticación
├── components/
│   ├── Layout.jsx            → Sidebar + navegación
│   └── Modal.jsx             → Modal reutilizable
└── pages/
    ├── Login.jsx             → Login / registro
    ├── Dashboard.jsx         → Panel principal
    ├── Animales.jsx          → Lista de animales
    ├── AnimalDetalle.jsx     → Ficha completa (6 pestañas)
    └── Recordatorios.jsx     → Gestión de recordatorios
```

---

## Notas importantes

- **Supabase gratuito**: hasta 500 MB de base de datos y 50.000 usuarios activos/mes. Más que suficiente para uso municipal interno.
- **Vercel gratuito**: deploy ilimitado para proyectos personales y organizaciones sin fines de lucro.
- **Autenticación**: Supabase maneja el login de forma segura. Las contraseñas nunca se guardan en texto plano.
- **Confirmación de email**: por defecto Supabase requiere confirmar el email. Para uso interno se puede deshabilitar en: Supabase → Authentication → Settings → desactivar "Enable email confirmations".
