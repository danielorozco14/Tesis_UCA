# Propuesta de herramienta geoespacial para la determinación de los impactos acumulados hacia los recursos hídricos subterráneos  

## Acerca del proyecto  
Este proyecto fue hecho para el MARN (Ministerio de Medio Ambiente y Recursos Naturales), para poder visualizar el impacto que tienen las industrias y proyectos que hacen uso de los recursos hídricos subterráneos y para poder evaluar cómo afecta la inclusión de un nuevo proyecto que requiera el uso de estos recursos hídricos.

## Requisitos de instalación:
- Se necesita tener NodeJS instalado, como minimo versión 14.15.5 y maximo la ultima LTS hasta la fecha (16.13.1).  
- Los navegadores recomendados son:
  -  Google Chrome
  -  Microsoft Edge
  -  Opera
  
## Variables de entorno:    
En la carpeta raiz se tiene un archivo .env.example, se borra .example para que quede operativo, luego llenar las variables de entorno con las siguientes especificaciones:    
- REACT_APP_PROYECTOS (Obligatoria): En esta variable se coloca la URL completa que apunta hacia la capa donde se encuentra la información de los proyectos.
- REACT_APP_CUENCAS (Obligatoria): En esta variable se coloca la URL completa que apunta hacia la capa donde se encuentra la información de las cuencas.
- REACT_APP_ARCGIS_API_KEY (Opcional): En esta variable se coloca la KEY para la licencia de ARCGIS.
- PORT (opcional): En esta variable de coloca el puerto en el que se podra consultar la aplicacion.

## Instacion en producción:
En este apartado de detallan los pasos para realizar la build de producción:
- Descomprimir el archivo ZIP.
- Realizar la instalación de las dependencias con el comando npm install
- Ejecutar el comando npm run build, este comando nos va a generar un folder llamado build.
- Si no se tiene instalada la dependencia global serve, instalarla con el comando npm install -g serve
- Luego, la misma carpeta donde se encuentre la carpeta build, ejecutar en la terminal serve -s build

## Aclaraciones:
Si se cambia alguna variable de entorno, se debe volver a crear la build y volver a correr serve -s build
