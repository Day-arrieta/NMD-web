# Administración de NMD

El panel es Pages CMS: https://app.pagescms.org/. Usa la cuenta GitHub **Day-arrieta** y selecciona `NMD-web`, rama `main`.

## Artistas y trabajos

Abre **Artistas y trabajos**. Cada ficha tiene nombre, foto, categoría, visibilidad, orden, especialidad, Instagram y otro enlace. El identificador se genera automáticamente: no lo cambies, mantiene estable el enlace del perfil.

Dentro de **Trabajos del artista**, agrega imágenes y un título descriptivo. Activa **Mostrar en Featured Work** para mostrarlas en su perfil. Desactivar **Visible en la web** oculta la ficha o el trabajo, conservando sus datos.

Las ocho fichas iniciales mantienen el nombre provisional Zionele. Sus redes y trabajos están vacíos a propósito: completa los datos reales antes de publicar. La foto con lentes oscuros conserva Guest.

## Qué se actualiza

Home y Work de escritorio comparten TEAM; cada tarjeta abre el perfil asociado por identificador. Los datos se leen de `content/artists.json`, sin base de datos, claves ni compilación. Los archivos nuevos se guardan en `assets/uploads`.

Guardar en Pages CMS crea un cambio en GitHub. La web publicada lo recibe cuando su alojamiento despliega esa rama. El servidor local requiere sincronizar primero los cambios del repositorio; no se actualiza desde GitHub por sí solo.

## Activación

1. Subir `.pages.yml`, los datos y la integración a la rama que administrará el panel.
2. Entrar en Pages CMS con Day-arrieta y autorizar su aplicación GitHub solo para `NMD-web`.
3. Seleccionar repositorio y rama, abrir Artistas y trabajos y comprobar las ocho fichas.
4. Configurar el alojamiento para publicar esa misma rama si todavía no lo hace.

Los retratos y trabajos publicados son contenido público: no guardar información privada en estas fichas.
