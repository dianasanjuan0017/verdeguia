# Software vs. operación manual (VerdeGuía PMV v0.1.2)

| Actividad | Quién | Cómo |
|---|---|---|
| Servir la ficha al abrir `/f/<código>` | Software | React + función `registrar_acceso` |
| Registrar el acceso (código, fecha-hora, prueba) | Software | Tabla `accesos` en Supabase |
| Mostrar y exportar el registro a CSV | Software | Pantalla `/admin > Accesos` |
| Página de ayuda ante código inexistente | Software | Ruta `/f/:codigo` |
| Crear y editar viveros y fichas | Equipo y viveros | Pantalla `/admin > Fichas` |
| Generar el código QR de cada ficha | Software | Botón de QR en `/admin > Fichas` |
| Guardar y mostrar la foto de cada ficha | Software | Subida desde `/admin > Fichas`, almacenada en Supabase Storage |
| Tomar o elegir la foto de cada planta | Equipo y viveros | Manual: solo fotos de plantas, sin personas |
| Redactar el contenido de cada ficha de cuidado | Equipo con el vivero | Manual: se escribe en el formulario de la ficha |
| Crear las cuentas de acceso del equipo y los viveros | Equipo | Manual en Supabase (Authentication > Users) |
| Imprimir y pegar las etiquetas con QR | Equipo y vivero | Manual |
| Formato A y coordinación con viveros | Equipo | Manual |
| Marcar accesos del equipo como prueba | Equipo | Agregar `?prueba=1` al enlace |
| Exportar el CSV periódicamente | Equipo | Botón "Exportar CSV" |

## Alcance mínimo
Incluye: ficha por código, registro de accesos, vista de registro con login, exportación CSV, página de ayuda, administración de viveros y fichas con foto opcional y generación de QR.
Excluye (y por qué): catálogo, PWA y modo sin conexión (no son necesarios para el recorrido que prueba la hipótesis); permisos por vivero (cada cuenta del equipo ve todas las fichas; se acepta en el PMV por el número reducido de usuarios); registro de IP o dispositivo (minimización de datos); cuentas de compradores (no hacen falta).

## Datos que se guardan y por qué
- Accesos: solo código, fecha-hora y marca de prueba, lo mínimo para calcular "compras con escaneo válido a 7 días".
- Fichas y viveros: nombre y contacto del vivero, planta, cuidados y foto opcional de la planta, que son el contenido que se muestra al escanear.
