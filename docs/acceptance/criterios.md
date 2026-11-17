# SIGELAB · Criterios de aceptación del primer incremento

Grupo 1 · Gestión de objetos perdidos A · 16 de noviembre de 2026

## Base y alcance

Historias verificadas en el documento original `Grupo01_SIGELAB_HistoriasUsuario.pdf`, recuperado del chat [Crear criterios Gherkin](https://chatgpt.com/c/6ae0a3eb-8a38-83e8-b132-047e74bb0c37). Se contrastaron con los criterios y los casos TestRail de ese mismo chat y con el archivo de Figma suministrado.

El primer incremento corresponde a HU-01 y HU-02. HU-03 (búsqueda y filtros), HU-04 (ficha detallada), HU-05 (solicitud de recuperación) y HU-06 (verificación y devolución) quedan fuera de sus recorridos. La aplicación React implementa este alcance. El prototipo anterior se conserva como referencia en docs/mockup/sigelab.html.

Se mantienen y precisan los criterios propuestos en el chat anterior. Las historias originales mencionan los datos del hallazgo, pero no enumeran explícitamente todas las reglas de validación. La obligatoriedad de los datos y de la fotografía, y la exclusión de objetos devueltos del listado disponible, proceden de esos criterios anteriores. Este documento es la propuesta consolidada para trabajar el incremento; no constituye evidencia de aprobación formal del equipo ni de implementación.

## HU-01 · Registrar objetos encontrados

> Como personal encargado de LABFIS, quiero registrar los objetos encontrados en los laboratorios, incluyendo nombre de la persona que lo reportó, descripción del objeto, fotografía, lugar y fecha del hallazgo, para facilitar su identificación y posterior recuperación por parte de sus propietarios.

| Criterio  | Comportamiento observable                                                                                                           | Pantallas  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| HU01-CA01 | Con los cinco datos requeridos, Guardar registro muestra una confirmación y permite consultar el registro con la misma información. | M01 → M04  |
| HU01-CA02 | Si falta información textual obligatoria, el formulario indica los campos faltantes y no presenta un registro exitoso.              | M02 → M02E |
| HU01-CA03 | Si falta la fotografía, el formulario solicita adjuntarla, conserva los demás datos y no presenta un registro exitoso.              | M03 → M03E |

Los cinco datos requeridos son persona que reporta, descripción general, fotografía, lugar y fecha del hallazgo. La etiqueta «Tipo de objeto» del mockup anterior no añade un sexto campo obligatorio. El formulario de este incremento tiene una sola etapa: no muestra «Paso 1 de 3».

```gherkin
# language: es
Característica: HU-01 Registrar objetos encontrados
  Como personal encargado de LABFIS
  Quiero registrar los datos de los objetos encontrados
  Para facilitar su identificación y posterior recuperación

  Antecedentes:
    Dado que el personal de LABFIS tiene acceso al formulario de registro

  @HU01-CA01 @TC-HU01
  Escenario: Registrar un hallazgo con todos los datos requeridos
    Dado que la persona que reporta es "Juan Pérez"
    Y la descripción general es "Mochila negra"
    Y el lugar del hallazgo es "Laboratorio de Física 1"
    Y la fecha del hallazgo es "09/11/2026"
    Y se adjuntó la fotografía "mochila.jpg"
    Cuando selecciona "Guardar registro"
    Entonces el sistema registra el hallazgo
    Y muestra "Registro exitoso"
    Y permite consultar la persona que reporta, descripción, fotografía, lugar y fecha registrados
    Y el hallazgo figura disponible para consulta

  @HU01-CA02 @TC-HU01-02
  Escenario: Intentar registrar un hallazgo con campos obligatorios vacíos
    Dado que se adjuntó la fotografía "mochila.jpg"
    Y los campos persona que reporta, descripción general, lugar y fecha están vacíos
    Cuando selecciona "Guardar registro"
    Entonces el sistema muestra "Revisa los campos obligatorios"
    Y indica qué información falta junto a cada campo obligatorio vacío
    Y conserva la fotografía adjunta
    Y no registra el hallazgo

  @HU01-CA03 @TC-HU01-03
  Escenario: Intentar registrar un hallazgo sin fotografía
    Dado que los campos persona que reporta, descripción general, lugar y fecha están completos
    Y no se adjuntó una fotografía
    Cuando selecciona "Guardar registro"
    Entonces el sistema muestra "Falta la fotografía"
    Y muestra "Adjunta una fotografía del objeto."
    Y conserva los datos ingresados en el formulario
    Y no registra el hallazgo
```

## HU-02 · Consultar objetos encontrados

> Como estudiante o docente, quiero consultar los objetos encontrados que han sido registrados en LABFIS, para identificar si alguno corresponde a una pertenencia que he extraviado.

| Criterio  | Comportamiento observable                                                                                                               | Pantallas |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| HU02-CA01 | El estudiante o docente ve los objetos disponibles y su información general. El contador coincide con el listado de la muestra.         | M05       |
| HU02-CA02 | Si no hay objetos disponibles, se muestra «No hay objetos disponibles», contador cero y ninguna tarjeta.                                | M06       |
| HU02-CA03 | Los objetos devueltos no aparecen como disponibles ni se cuentan en ese listado. Si todos fueron devueltos, se muestra el estado vacío. | M05 / M06 |

Se adopta la misma alternativa que los criterios y la prueba anteriores: excluir los objetos devueltos del catálogo disponible. Este incremento no incorpora una pestaña de historial ni el procedimiento para devolver un objeto. El estado «Devuelto» se prepara como dato de prueba.

```gherkin
# language: es
Característica: HU-02 Consultar objetos encontrados
  Como estudiante o docente
  Quiero consultar los objetos encontrados registrados en LABFIS
  Para identificar una posible pertenencia extraviada

  @HU02-CA01 @TC-HU02
  Escenario: Consultar los objetos disponibles
    Dado que están disponibles "Mochila negra" y "Cuaderno"
    Cuando un estudiante o docente accede a "Objetos encontrados"
    Entonces el sistema muestra las tarjetas de "Mochila negra" y "Cuaderno"
    Y muestra su información general, lugar y fecha del hallazgo
    Y muestra "2 OBJETOS DISPONIBLES"

  @HU02-CA02 @TC-HU02-02
  Escenario: Consultar cuando no hay objetos disponibles
    Dado que no existen objetos disponibles para consulta
    Cuando un estudiante o docente accede a "Objetos encontrados"
    Entonces el sistema muestra "No hay objetos disponibles"
    Y muestra "0 OBJETOS DISPONIBLES"
    Y no muestra tarjetas de objetos

  @HU02-CA03 @TC-HU02-03
  Escenario: Excluir del catálogo un objeto ya devuelto
    Dado que están disponibles "Mochila negra" y "Cuaderno"
    Y "Paraguas azul" está registrado con estado "Devuelto"
    Cuando un estudiante o docente accede a "Objetos encontrados"
    Entonces el sistema muestra "Mochila negra" y "Cuaderno"
    Y no muestra "Paraguas azul" como disponible
    Y muestra "2 OBJETOS DISPONIBLES"
```
