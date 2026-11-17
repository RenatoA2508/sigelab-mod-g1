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
