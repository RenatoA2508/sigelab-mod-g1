# SIGELAB · Gestión de objetos perdidos A

Aplicación del Grupo 1 para registrar y consultar objetos encontrados en LABFIS, Escuela Politécnica Nacional.

El primer incremento implementa **HU-01: registrar hallazgos** y **HU-02: consultar objetos encontrados**. El frontend usa React, Vite y TypeScript. El backend usa Supabase Auth, Storage y PostgreSQL 17, con autorización en la base de datos.

## Iniciar la aplicación

Requisitos: Node.js 22.12 o posterior compatible; `.nvmrc` fija la versión verificada.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abre **http://localhost:3000**. La configuración de ejemplo contiene la URL y la clave **publicable** del proyecto conectado; esa clave está diseñada para el navegador. La autorización no depende de ocultarla, sino de las políticas de PostgreSQL. Nunca pongas `service_role`, claves `sb_secret_` ni contraseñas de PostgreSQL en variables `VITE_`.

### Primer acceso del personal

1. Abre **Personal LABFIS → Es mi primer acceso**.
2. Usa el correo que el administrador habilitó y crea tu contraseña.
3. Confirma tu correo con el mensaje de Supabase.
4. Inicia sesión para registrar hallazgos.

Crear una cuenta no concede permisos por sí solo. La primera dirección indicada por el responsable del proyecto ya fue autorizada en Supabase. Su contraseña y su confirmación de correo las realiza su titular; no existen contraseñas predeterminadas en el repositorio.

Para una URL de producción, configura esa URL y sus redirecciones de confirmación en Supabase Auth antes de abrir el registro de cuentas. El desarrollo usa el puerto 3000 para coincidir con la configuración de acceso local.

## Funcionalidades del incremento

### HU-01 · Registrar un hallazgo

- Acceso reservado a personal autorizado con correo confirmado.
- Nombre del reportante, descripción general, lugar, fecha y fotografía obligatorios.
- Errores junto a cada campo; los datos se conservan si falla la validación o la conexión.
- Fotografías JPG, PNG o WebP de hasta 10 MB. El cliente comprueba también la firma del archivo.
- Los datos públicos y el reportante interno se guardan atómicamente en PostgreSQL.
- Confirmación con información interna, fotografía y enlace al catálogo.
- El registro se conserva al recargar o abrir una nueva sesión.
- El reintento de la misma operación no duplica el hallazgo.

### HU-02 · Consultar objetos

- Catálogo público, sin necesidad de iniciar sesión.
- Información general, lugar, fecha y fotografía; no se expone el reportante.
- Solo aparecen objetos con estado `available`; se excluyen los devueltos también en PostgreSQL.
- Estado vacío, errores de conexión, recarga y paginación de doce objetos.
- Imágenes mediante enlaces temporales a un contenedor privado.

La búsqueda, la ficha de detalle, la solicitud de recuperación y la devolución corresponden a HU-03–HU-06 y no se ofrecen como funciones incompletas en este incremento.

## Organización del código

```text
src/
  components/          Encabezado, estados de carga/error y fotografías
  features/auth/       Sesión, primer acceso y autorización del personal
  features/objects/    Registro, confirmación, catálogo, validación y acceso a datos
  lib/                 Cliente Supabase, tipos generados y errores de aplicación
supabase/
  migrations/          Esquema, funciones, permisos y políticas versionadas
  project.json         Referencia del proyecto remoto; sin credenciales privadas
tests/
  database/            Pruebas de PostgreSQL/RLS con PGlite
  fixtures/            Archivos ficticios para pruebas
docs/
  acceptance/          Historias, Gherkin y casos para TestRail
  mockup/              Referencia HTML previa al desarrollo
```

Los siguientes incrementos pueden agregar módulos en `features/` y migraciones nuevas. Las escrituras del negocio deben seguir usando funciones transaccionales con autorización en el servidor. No se deben conceder escrituras generales sobre `found_objects` para añadir una pantalla de administración.

## Base de datos y seguridad

Proyecto conectado: `bxyupmlysfgiyomnbynx` · PostgreSQL 17.

Las migraciones del repositorio están aplicadas en ese proyecto y sus versiones coinciden con el historial remoto.

```sh
npx supabase login
npx supabase link --project-ref bxyupmlysfgiyomnbynx
npx supabase db push
```

`public.found_objects` contiene solo información del catálogo. `private.found_object_reports` contiene la identidad del reportante y el nombre original de la imagen. `private.staff_members` mantiene la autorización administrativa por correo verificado.

- RLS está habilitado en las tres tablas de la aplicación.
- El esquema privado no está expuesto por la API y no concede acceso directo a clientes.
- Las funciones de registro y consulta interna solo se ejecutan como usuario autenticado y verifican además la autorización de LABFIS.
- Se revocaron los permisos anónimos explícitos que Supabase puede conceder por defecto.
- El contenedor de imágenes es privado; las políticas permiten cargas del personal y lectura de imágenes asociadas a objetos disponibles.
- Los enlaces de imagen duran cinco minutos. Una URL ya emitida conserva esa vigencia aunque después cambie el estado; el catálogo se filtra con el estado actual.
- El cliente puede limpiar cargas propias sin registro, pero no puede borrar la imagen de un hallazgo guardado.

Los avisos informativos de RLS sin políticas en las tablas privadas representan una denegación intencional de todo acceso directo. Las funciones autenticadas `SECURITY DEFINER` también son intencionales: usan `search_path` vacío y comprueban el rol antes de leer o escribir. Ver [seguridad de funciones](https://supabase.com/docs/guides/database/functions) y [políticas de Storage](https://supabase.com/docs/guides/storage/security/access-control).

### Autorizar otro correo de LABFIS

Un administrador puede ejecutar esta operación desde el editor SQL de Supabase o el MCP conectado, usando parámetros o un valor validado:

```sql
insert into private.staff_members(email)
values (lower('persona@dominio.ec'))
on conflict(email) do update set active = true;
```

También existe `npm run staff:grant -- correo@dominio.ec`, que requiere `DATABASE_URL` administrativo en el entorno del proceso. Esa conexión nunca debe estar en el frontend ni en Git. Para revocar acceso, cambia `active` a `false` desde la administración.

### Backend local opcional

Con Docker y la CLI incluida:

```sh
npm run db:start
npm run db:reset
npm run db:configure
npm run dev
```

Las migraciones crean el esquema local, pero no introducen usuarios ni contraseñas por defecto. Habilita explícitamente el correo de la cuenta local de pruebas. `npm run db:configure` sustituye `.env.local` por la URL y clave públicas del backend local.

## Verificación

```sh
npm run check
npm run format:check
npm audit --omit=dev --audit-level=high
```

`check` ejecuta ESLint, pruebas de componentes/validación/PostgreSQL y la compilación de producción con TypeScript estricto. Las políticas se prueban bajo roles anónimo, autenticado sin autorización y personal autorizado, incluyendo los permisos por defecto de Supabase.

Se realizaron además comprobaciones contra Supabase y una revisión de los flujos en el navegador. Los resultados y límites están en [docs/VERIFICACION.md](docs/VERIFICACION.md). Las cuentas y los objetos temporales de esa verificación se retiran antes de entregar; no se convierten en datos de producción.

El script `verify:live` es una prueba de integración para un proyecto de pruebas y cuentas efímeras previamente provisionadas en `.env.e2e`. No forma parte de `check`: crea datos y necesita un conjunto inicial vacío. No se debe ejecutar sobre un proyecto con datos reales.

GitHub Actions ejecuta las comprobaciones en cada push y pull request. No necesita claves privadas ni acceso administrativo a la base de datos.

## Compilar y servir

```sh
npm run build
npm run preview
```

El resultado está en `dist/`. El hosting debe servir `index.html` como alternativa para rutas del frontend y enviar las cabeceras de seguridad incluidas en `public/_headers`. Se proporciona `_redirects` para proveedores compatibles; adapta esas reglas al hosting elegido. Vite es la herramienta de desarrollo y no debe usarse como servidor público de producción.

La tipografía Inter se distribuye con la aplicación; su licencia está en `public/inter-LICENSE.txt`. El diseño mantiene la referencia visual de SIGELAB.
