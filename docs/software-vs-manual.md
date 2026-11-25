# Software vs. operación manual (VerdeGuía PMV v0.1.0)

| Actividad | Quién | Cómo |
|---|---|---|
| Servir la ficha al abrir `/f/<código>` | Software | React + función `registrar_acceso` |
| Registrar el acceso (código, fecha-hora, prueba) | Software | Tabla `accesos` en Supabase |
| Mostrar y exportar el registro a CSV | Software | Pantalla `/admin` |
| Página de ayuda ante código inexistente | Software | Ruta `/f/:codigo` |
| Redactar el contenido de cada ficha de cuidado | Equipo con el vivero | Se captura en la tabla `fichas` |
| Cargar fichas y viveros en la base | Equipo | SQL Editor o panel de Supabase |
| Imprimir y pegar las etiquetas con QR | Equipo y vivero | Manual |
| Formato A y coordinación con viveros | Equipo | Manual |
| Marcar accesos del equipo como prueba | Equipo | Agregar `?prueba=1` al enlace |
| Exportar el CSV periódicamente | Equipo | Botón "Exportar CSV" |

## Alcance mínimo
Incluye: ficha por código, registro de accesos, vista de registro con login, exportación CSV, página de ayuda.
Excluye (y por qué): catálogo, PWA y modo sin conexión (no son necesarios para el recorrido que prueba la hipótesis); registro de IP o dispositivo (minimización de datos); cuentas de compradores (no hacen falta).

## Datos que se guardan y por qué
Solo código, fecha-hora y marca de prueba: es lo mínimo para calcular "compras con escaneo válido a 7 días".
