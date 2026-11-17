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
