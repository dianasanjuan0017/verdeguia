# VerdeGuía PMV v0.1.0

Producto Mínimo Viable de VerdeGuía: al abrir el enlace de un QR (`/f/<código>`) se muestra la ficha de cuidado de la planta y se registra el acceso (código, fecha-hora y marca de prueba). El equipo consulta y exporta esos accesos a CSV en `/admin`.

**Stack:** React + Vite (JavaScript), React Router, Supabase (PostgreSQL + Auth).

## Qué hace el software y qué hace el equipo a mano
Ver `docs/software-vs-manual.md`.

## 1. Configurar Supabase
1. Crea un proyecto en https://supabase.com.
2. En **SQL Editor**, ejecuta completo `supabase/schema.sql`.
3. Ejecuta `supabase/seed_demo.sql` (datos ficticios etiquetados como DEMO).
4. En **Authentication > Users**, crea el usuario del equipo (correo y contraseña). En **Authentication > Providers > Email**, desactiva el registro abierto ("Allow new users to sign up").
5. En **Project Settings > API**, copia la URL del proyecto y la clave `anon public`.

## 2. Ejecutar en tu computadora
```bash
npm install
cp .env.example .env.local     # completa las 3 variables
npm run dev                    # abre http://localhost:5173
```

## 3. Comprobar que funciona
1. En la portada abre **Ficha DEMO-001**: debe verse la ficha con el sello "Datos de demostración".
2. Entra a `/admin` con el usuario del equipo: debe aparecer un acceso `DEMO-001` marcado como `prueba`, con su fecha y hora.
3. Pulsa **Exportar CSV**: se descarga un archivo con `codigo, fecha_hora, es_prueba`.
4. Abre `/f/NO-EXISTE`: debe verse la página de ayuda con el contacto (sin error técnico) y no debe crearse ningún acceso.
5. Abre `/f/DEMO-VACIA`: debe verse el mensaje de ficha sin contenido.
6. Sin iniciar sesión, `/admin` solo muestra el formulario de entrada y no revela datos.

## 4. Códigos QR
El QR solo contiene el enlace a la ficha: `https://TU-DOMINIO/f/<código>`. Al escanearlo, el celular abre ese enlace y la app registra el acceso.
- En `/admin > Códigos QR` escribe el código de la ficha y descarga el PNG para imprimirlo en la etiqueta.
- Genera los QR definitivos **desde la URL publicada**, no desde localhost.
- Marca "QR de prueba" solo para pruebas del equipo; los QR de compradores van sin esa marca.

## 5. Publicar (HTTPS)
**Vercel o Netlify** (conectando el repositorio):
- Build command: `npm run build`, carpeta de salida: `dist`.
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CONTACTO_AYUDA`.
- `vercel.json` y `public/_redirects` ya resuelven las rutas como `/f/<código>`.
- Pon la URL publicada en la portada de la memoria, junto con la versión `v0.1.0` y su fecha.

Los QR deben apuntar a `https://TU-DOMINIO/f/<código>`. Para accesos del equipo agrega `?prueba=1` y quedarán marcados como prueba.

## 6. Errores tratados
| Caso | Resultado |
|---|---|
| Código inexistente o con formato inválido | Página de ayuda con contacto; no se registra nada |
| Ficha sin cuidados | Mensaje claro de ficha sin contenido |
| Error de red o de Supabase | Mensaje amable, sin detalles técnicos |
| Login incorrecto | "Correo o contraseña incorrectos", sin revelar cuál falló |
| Visitante sin sesión | No puede leer la tabla `accesos` (RLS) |

## 7. Seguridad y privacidad
- Ningún secreto en el código: las claves van en variables de entorno. La clave `anon` es pública por diseño; la protección está en RLS y en la función `registrar_acceso`.
- La tabla `accesos` solo guarda código, fecha-hora y marca de prueba. No guarda IP ni datos del dispositivo.
- Los datos de demostración son ficticios. No se publican datos de participantes.
- No subas `.env.local`, `node_modules` ni `dist` al ZIP.

## 8. Límites conocidos
- Los proyectos gratuitos de Supabase pueden pausarse por inactividad: verifica el límite vigente, abre la app antes de la revisión y exporta el CSV con frecuencia.
- Sin PWA, modo sin conexión ni catálogo: quedan fuera del PMV (la consigna exige el recorrido, no la PWA).
- Este PMV no prueba demanda, retención ni disposición a pagar.
