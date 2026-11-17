# Verificación del primer incremento

17 de noviembre de 2026 · HU-01 y HU-02.

## Comprobaciones automáticas

- TypeScript estricto y ESLint.
- 30 pruebas de validación, componentes y PostgreSQL/RLS.
- Compilación de producción de React/Vite, con módulos separados.
- Dependencias de producción auditadas con npm: ninguna vulnerabilidad detectada.

Las pruebas de base de datos ejecutan las migraciones en PostgreSQL embebido con roles y políticas reales. Se reproducen además los permisos de funciones que Supabase concede por defecto.

## Integración contra el Supabase conectado

Se comprobaron mediante la API y cuentas ficticias:

1. Reconocimiento del personal autorizado.
2. Rechazo de una cuenta sin autorización.
3. Catálogo inicialmente vacío.
4. Inaccesibilidad de la función interna para el público.
5. Privacidad de una imagen cargada que aún no está vinculada a un hallazgo.
6. Rechazo de datos obligatorios vacíos en PostgreSQL.
7. Rechazo de un registro sin una imagen cargada.
8. Registro de datos públicos e internos, incluido el nombre original del archivo.
9. Reintento sin duplicación.
10. Ausencia del reportante y del nombre original del archivo en los datos públicos.
11. Inaccesibilidad de la información interna para otra cuenta.
12. Descarga real de la fotografía de un objeto disponible.
13. Recuperación del registro tras iniciar una nueva sesión.

Se preparó un objeto devuelto y se verificó que no apareciera en el catálogo disponible. Las funciones están protegidas frente al acceso anónimo. La revisión de salud de Supabase no presentó incidencias.

## Navegador

- Consulta del catálogo vacío, conectado a Supabase.
- Redirección de un visitante anónimo al acceso del personal al intentar registrar.
- Inicio de sesión de una cuenta de prueba autorizada.
- Selección de una imagen local y validación de los cuatro campos textuales vacíos.
- Registro desde la interfaz, visualización del resumen y recarga de su enlace persistente.
- Rechazo de un registro sin fotografía, conservando los cuatro campos completados.
- Catálogo con fotografías cargadas, sin el objeto devuelto ni el nombre del reportante.
- Catálogo a 390 píxeles y registro a 320 píxeles, sin desbordamiento horizontal.
- Cierre de sesión y retorno al catálogo público.

## Trazabilidad

| Criterio  | Prueba del proyecto | Comprobaciones                                             |
| --------- | ------------------- | ---------------------------------------------------------- |
| HU01-CA01 | TC-HU01             | Componentes, operación SQL, API remota y navegador         |
| HU01-CA02 | TC-HU01-02          | Validación, componente, operación SQL y navegador          |
| HU01-CA03 | TC-HU01-03          | Validación, componente, SQL/API y navegador sin fotografía |
| HU02-CA01 | TC-HU02             | Componente, consulta RLS y API remota                      |
| HU02-CA02 | TC-HU02-02          | Componente, API real y navegador                           |
| HU02-CA03 | TC-HU02-03          | PostgreSQL, API y navegador con un objeto Devuelto         |

## Limpieza de la verificación

Se retiraron los cuatro hallazgos ficticios y sus fotografías mediante Storage, y las dos cuentas temporales de acceso. La comprobación final encontró cero hallazgos, reportes, fotografías y cuentas temporales; el correo del responsable sigue autorizado y las dos migraciones siguen aplicadas.

## Verificación en GitHub

El código se subió a `main`. GitHub Actions no llegó a iniciar ningún paso: GitHub informó que la cuenta está bloqueada por un problema de facturación. La ejecución puede revisarse [aquí](https://github.com/RenatoA2508/sigelab-mod-g1/actions/runs/44100135557). Las 30 pruebas, ESLint, TypeScript, la compilación, el formato y la auditoría de producción se comprobaron localmente; esta última encontró cero vulnerabilidades.

## Límites de la entrega

La verificación corresponde al primer incremento. El frontend está preparado para ejecutarse localmente o compilarse para un hosting estático; el backend remoto y las migraciones están configurados. No se ha actualizado TestRail automáticamente.
