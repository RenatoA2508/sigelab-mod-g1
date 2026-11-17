# SIGELAB · Casos de prueba para TestRail

Primer incremento · HU-01 y HU-02 · Plantilla **Test Case (Text)**

Se conservan los identificadores de referencia TC-HU01 y TC-HU02 de los casos positivos del chat «Crear criterios Gherkin». Se agregan cuatro casos para cubrir los demás criterios. Estos identificadores son referencias del proyecto; no son IDs asignados por TestRail.

**Estado:** casos preparados para TestRail. La implementación se verificó mediante pruebas de componentes, PostgreSQL, API remota y navegador; los resultados se documentan en ../VERIFICACION.md. No se ha escrito en TestRail. Los enlaces visuales conducen al prototipo de referencia.

## Datos comunes

| Registro de muestra | Descripción general       | Persona que reporta | Fotografía   | Lugar                   | Fecha      | Estado     |
| ------------------- | ------------------------- | ------------------- | ------------ | ----------------------- | ---------- | ---------- |
| OBJ-001             | Mochila negra             | Juan Pérez          | mochila.jpg  | Laboratorio de Física 1 | 09/11/2026 | Disponible |
| OBJ-002             | Cuaderno de uso académico | Ana Torres          | cuaderno.jpg | Laboratorio de Física 2 | 08/11/2026 | Disponible |
| OBJ-003             | Paraguas azul             | Rosa Mora           | paraguas.jpg | Laboratorio de Física 1 | 07/11/2026 | Devuelto   |

Los nombres y registros son datos ficticios de prueba. OBJ-001, OBJ-002 y OBJ-003 identifican la preparación de datos; no requieren que el producto muestre esos códigos. Para HU-01, OBJ-001 no debe existir antes del registro. Para HU-02, se usa el conjunto preparado que indique cada caso. Las fotografías se deben proporcionar como archivos reales al ejecutar pruebas del sistema; las miniaturas del mockup son solo muestras visuales.

---

## TC-HU01 · Registro exitoso de un objeto encontrado

**Historia:** HU-01 · **Criterio:** HU01-CA01 · **Tipo:** Funcional · **Prioridad:** Alta

**Referencia visual:** [M01 · Registro completo](../mockup/sigelab.html#m01) → [M04 · Registro exitoso](../mockup/sigelab.html#m04)

### Preconditions

```markdown
- El personal de LABFIS tiene acceso al formulario de registro.
- Para una ejecución del sistema, el usuario dispone de los permisos de registro previstos por el equipo.
- El hallazgo de esta prueba aún no está registrado.
- Está disponible la fotografía de prueba mochila.jpg.
- Datos: Juan Pérez; Mochila negra; Laboratorio de Física 1; 09/11/2026; mochila.jpg.
```

### Steps

```markdown
1. Acceder a Registrar un hallazgo.
2. Completar Persona que reporta con Juan Pérez.
3. Completar Descripción general con Mochila negra.
4. Completar Lugar del hallazgo con Laboratorio de Física 1.
5. Completar Fecha del hallazgo con 09/11/2026.
6. Adjuntar mochila.jpg y comprobar que aparece como fotografía adjunta.
7. Seleccionar Guardar registro.
8. Revisar la confirmación y el resumen interno del hallazgo.
9. En el sistema implementado, volver a consultar el hallazgo para comprobar que se conserva la información registrada.
```

### Expected Result

```markdown
- Se muestra Registro exitoso y la pantalla Hallazgo registrado.
- El resumen contiene Juan Pérez, Mochila negra, Laboratorio de Física 1, 09/11/2026 y mochila.jpg.
- El objeto figura disponible para consulta.
- En el sistema implementado, el hallazgo queda guardado con los mismos datos y la fotografía asociada.
```

---

## TC-HU01-02 · Registro con campos obligatorios incompletos

**Historia:** HU-01 · **Criterio:** HU01-CA02 · **Tipo:** Funcional negativa · **Prioridad:** Alta

**Referencia visual:** [M02 · Campos incompletos](../mockup/sigelab.html#m02) → [M02E · Error de campos](../mockup/sigelab.html#m02e)

### Preconditions

```markdown
- El personal de LABFIS está en Registrar un hallazgo.
- Los campos Persona que reporta, Descripción general, Lugar del hallazgo y Fecha del hallazgo están vacíos.
- Se adjuntó mochila.jpg para aislar la validación de los datos textuales.
```

### Steps

```markdown
1. Confirmar que los cuatro campos textuales están vacíos y la fotografía está adjunta.
2. Seleccionar Guardar registro.
3. Revisar el aviso general y los mensajes de cada campo vacío.
4. Comprobar que la fotografía continúa adjunta.
5. En el sistema implementado, comprobar que no se creó un hallazgo incompleto.
```

### Expected Result

```markdown
- Se muestra Revisa los campos obligatorios.
- Junto a Persona que reporta aparece Ingresa el nombre de quien reporta.
- Junto a Descripción general aparece Ingresa una descripción del objeto.
- Junto a Lugar del hallazgo aparece Indica el lugar del hallazgo.
- Junto a Fecha del hallazgo aparece Ingresa la fecha del hallazgo.
- La fotografía permanece adjunta y el formulario permanece abierto.
- No se muestra Registro exitoso ni se crea un hallazgo incompleto en el sistema.
```

---

## TC-HU01-03 · Registro sin fotografía

**Historia:** HU-01 · **Criterio:** HU01-CA03 · **Tipo:** Funcional negativa · **Prioridad:** Alta

**Referencia visual:** [M03 · Fotografía faltante](../mockup/sigelab.html#m03) → [M03E · Error de fotografía](../mockup/sigelab.html#m03e)

### Preconditions

```markdown
- El personal de LABFIS está en Registrar un hallazgo.
- Persona que reporta: Juan Pérez.
- Descripción general: Mochila negra.
- Lugar del hallazgo: Laboratorio de Física 1.
- Fecha del hallazgo: 09/11/2026.
- No se adjuntó una fotografía.
```

### Steps

```markdown
1. Revisar que los cuatro datos textuales están completos y no hay una fotografía adjunta.
2. Seleccionar Guardar registro.
3. Revisar el mensaje de validación de la fotografía.
4. Comprobar que los cuatro valores ingresados permanecen en el formulario.
5. En el sistema implementado, comprobar que no se creó el hallazgo.
```

### Expected Result

```markdown
- Se muestra Falta la fotografía.
- Junto al control de imagen aparece Adjunta una fotografía del objeto.
- Se conservan Juan Pérez, Mochila negra, Laboratorio de Física 1 y 09/11/2026.
- El formulario permanece abierto y permite adjuntar la imagen.
- No se muestra Registro exitoso ni se crea el hallazgo sin fotografía en el sistema.
```

---

## TC-HU02 · Consulta exitosa de objetos encontrados

**Historia:** HU-02 · **Criterios:** HU02-CA01 y comprobación básica de HU02-CA03 · **Tipo:** Funcional · **Prioridad:** Alta

**Referencia visual:** [M05 · Objetos disponibles](../mockup/sigelab.html#m05)

### Preconditions

```markdown
- SIGELAB está disponible para un estudiante o docente.
- El conjunto de prueba contiene OBJ-001 y OBJ-002 disponibles, y OBJ-003 devuelto.
- No existen otros registros disponibles en el conjunto aislado de esta prueba.
```

### Steps

```markdown
1. Acceder a Objetos encontrados como estudiante o docente.
2. Revisar el contador y las tarjetas del listado.
3. Identificar Mochila negra y Cuaderno.
4. Revisar la información general, lugar y fecha de ambos hallazgos.
5. Comprobar que Paraguas azul no aparece como disponible.
```

### Expected Result

```markdown
- Se muestra 2 OBJETOS DISPONIBLES.
- Aparecen Mochila negra y Cuaderno.
- Se muestra la información general correspondiente a cada objeto.
- Mochila negra corresponde a Laboratorio de Física 1 y 09 nov; Cuaderno corresponde a Laboratorio de Física 2 y 08 nov.
- Paraguas azul, que está devuelto, no aparece como disponible.
- El listado público no muestra el nombre de las personas que reportaron los hallazgos.
```

---

## TC-HU02-02 · Consulta sin objetos disponibles

**Historia:** HU-02 · **Criterio:** HU02-CA02 · **Tipo:** Funcional alternativa · **Prioridad:** Media

**Referencia visual:** [M06 · Catálogo vacío](../mockup/sigelab.html#m06)

### Preconditions

```markdown
- SIGELAB está disponible para un estudiante o docente.
- El conjunto de prueba no contiene objetos disponibles.
- Ejecutar con un conjunto sin registros. Como variante, ejecutar con todos sus objetos devueltos.
```

### Steps

```markdown
1. Acceder a Objetos encontrados como estudiante o docente.
2. Revisar el contador, el mensaje y el área del listado.
3. Repetir con el conjunto de datos de la variante, si se ejecuta sobre el sistema implementado.
```

### Expected Result

```markdown
- Se muestra 0 OBJETOS DISPONIBLES.
- Se muestra No hay objetos disponibles.
- Se informa que no hay hallazgos disponibles para consulta en este momento.
- No aparecen tarjetas de objetos ni datos residuales de consultas anteriores.
- La variante con todos los objetos devueltos presenta el mismo estado vacío.
```

---

## TC-HU02-03 · Exclusión de objetos devueltos

**Historia:** HU-02 · **Criterio:** HU02-CA03 · **Tipo:** Funcional · **Prioridad:** Alta

**Referencia visual:** [M05 · Objetos disponibles](../mockup/sigelab.html#m05)

### Preconditions

```markdown
- SIGELAB está disponible para un estudiante o docente.
- OBJ-001 Mochila negra y OBJ-002 Cuaderno están disponibles.
- OBJ-003 Paraguas azul existe en los datos de prueba con estado Devuelto.
- No hay más objetos disponibles en el conjunto aislado de prueba.
```

### Steps

```markdown
1. Confirmar en la preparación de datos que Paraguas azul tiene estado Devuelto.
2. Acceder a Objetos encontrados como estudiante o docente.
3. Comprobar que Mochila negra y Cuaderno aparecen en el listado.
4. Comprobar que Paraguas azul no aparece como disponible.
5. Revisar el contador de objetos disponibles.
```

### Expected Result

```markdown
- El listado contiene únicamente Mochila negra y Cuaderno.
- Paraguas azul no aparece como disponible para recuperación.
- El contador muestra 2 OBJETOS DISPONIBLES y no incluye el objeto devuelto.
- No es necesario ejecutar el proceso de devolución para esta prueba: su estado se prepara como dato previo.
```

## Qué comprobar en el mockup HTML y qué comprobar en el sistema

| Comprobación                                          | Mockup                               | Sistema implementado                                      |
| ----------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Etiquetas, campos obligatorios y textos de validación | Inspección de M01, M02E y M03E       | Confirmar que reaccionan a los datos introducidos         |
| Confirmación de registro                              | Inspección de M04                    | Guardar, recuperar y contrastar los datos y la imagen     |
| Catálogo con dos objetos                              | Inspección de M05                    | Consultar el conjunto de datos aislado                    |
| Catálogo vacío                                        | Inspección de M06                    | Ejecutar con cero disponibles                             |
| Exclusión de objetos devueltos                        | M05 representa el resultado esperado | Preparar un objeto devuelto y comprobar su exclusión real |

Los estados del mockup no justifican marcar estos casos como aprobados en TestRail. Se deben registrar resultados y evidencias cuando se ejecute el sistema.
