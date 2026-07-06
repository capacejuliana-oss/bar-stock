# 📋 Instrucciones para subir la app

## PASO 1 — Crear la base de datos en Supabase

1. Entrá a **supabase.com** e iniciá sesión con GitHub
2. Clic en **"New project"**
   - Nombre: `bar-stock`
   - Password: cualquiera (guardala)
   - Region: `West EU (Ireland)` → más cerca de Italia
3. Esperá ~2 minutos que se cree el proyecto
4. Cuando esté listo, clic en **"SQL Editor"** (menú izquierdo)
5. Copiá y pegá este código SQL y clic en **"Run"**:

```sql
create table categories (
  id bigint generated always as identity primary key,
  nome text not null,
  colore text default '#c9a84c'
);

create table products (
  id bigint generated always as identity primary key,
  nome text not null,
  categoria text not null,
  unita text not null,
  stock integer default 0,
  minimo integer default 1
);

-- Datos de ejemplo
insert into categories (nome, colore) values
  ('Distillati', '#c9a84c'),
  ('Birre', '#e07b39'),
  ('Analcolici', '#4ca8c9'),
  ('Vini', '#9b4dca'),
  ('Snack', '#5cb85c');

insert into products (nome, categoria, unita, stock, minimo) values
  ('Whisky Jack Daniel''s', 'Distillati', 'Bottiglie', 8, 3),
  ('Vodka Absolut', 'Distillati', 'Bottiglie', 5, 3),
  ('Rum Havana Club 3', 'Distillati', 'Bottiglie', 2, 4),
  ('Birra Corona', 'Birre', 'Casse', 3, 5),
  ('Birra Heineken', 'Birre', 'Casse', 1, 4),
  ('Coca-Cola', 'Analcolici', 'Casse', 4, 5),
  ('Acqua Minerale', 'Analcolici', 'Casse', 2, 3),
  ('Vino Rosso Chianti', 'Vini', 'Bottiglie', 12, 4),
  ('Prosecco', 'Vini', 'Bottiglie', 4, 2);

-- Permisos públicos (necesario para que funcione)
alter table categories enable row level security;
alter table products enable row level security;

create policy "public access" on categories for all using (true) with check (true);
create policy "public access" on products for all using (true) with check (true);
```

6. Anotá estos dos datos (los vas a necesitar):
   - **Project URL**: Settings → API → Project URL
   - **anon key**: Settings → API → Project API keys → `anon public`

---

## PASO 2 — Subir el código a GitHub

1. Entrá a **github.com**
2. Clic en **"New repository"**
   - Nombre: `bar-stock`
   - Público o privado (lo que prefieras)
   - Clic en **"Create repository"**
3. En la página del repositorio vacío, clic en **"uploading an existing file"**
4. Subí todos los archivos de esta carpeta
5. Clic en **"Commit changes"**

---

## PASO 3 — Publicar en Vercel

1. Entrá a **vercel.com** e iniciá sesión con GitHub
2. Clic en **"Add New Project"**
3. Seleccioná el repositorio `bar-stock`
4. Antes de hacer deploy, clic en **"Environment Variables"** y agregá:
   - `REACT_APP_SUPABASE_URL` → (el Project URL de Supabase)
   - `REACT_APP_SUPABASE_ANON_KEY` → (el anon key de Supabase)
5. Clic en **"Deploy"**
6. En ~2 minutos tenés tu URL lista, algo como: `bar-stock.vercel.app`

---

## ✅ Resultado final

- La app queda en una URL propia
- Cualquier dispositivo que entre a esa URL ve los datos en tiempo real
- Los cambios se sincronizan instantáneamente entre todos los dispositivos
- Es 100% gratuito

---

## ❓ ¿Problemas?

Escribile a Claude con el error que aparece y te ayuda a resolverlo.
