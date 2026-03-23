# Flip7 Multiplayer — Design Brief para Google Stitch

## Propósito del Proyecto

**Flip7 Multiplayer** es un juego de cartas en tiempo real para múltiples jugadores, jugable directamente desde el navegador sin instalación. El objetivo es acumular la mayor cantidad de puntos posible sin "pasarse" (bust), mientras compites simultáneamente con otros 2 a 6 jugadores en la misma sala.

El juego está orientado a sesiones cortas e informales (10–20 minutos), ideal para grupos de amigos que quieran jugar desde sus celulares o computadoras sin necesidad de cuenta ni registro.

---

## Mecánicas de Juego

### Flujo básico
1. Un jugador crea una sala y comparte el código de invitación.
2. Los demás jugadores se unen con ese código.
3. Por turnos, cada jugador decide si **robar una carta** o **detenerse**.
4. Robar un número repetido significa **bust**: se pierden todas las cartas acumuladas en la ronda.
5. Al terminar la ronda, los jugadores que se detuvieron a tiempo suman puntos.
6. El primero en llegar a **200 puntos** gana la partida.

### Tipos de cartas
| Tipo | Ejemplos | Efecto |
|------|----------|--------|
| **Número** | 0 al 12 | Suma su valor al puntaje |
| **Modificador** | +2, +4, +6, +8, +10, ×2 | Modifica el puntaje total |
| **Especial** | Freeze, Flip Three, Second Chance | Efectos sobre jugadores |

### Cartas especiales
- **Freeze (❄️):** Congela a un jugador objetivo; su puntaje queda bloqueado.
- **Flip Three (🎴):** Obliga a un jugador objetivo a robar 3 cartas adicionales.
- **Second Chance (💖):** Salva al poseedor de un bust (se activa automáticamente).
- **Flip7 (🌈):** Conseguir los 7 números distintos da +15 puntos de bonus y para automáticamente al jugador.

---

## Estados de la Interfaz

La UI tiene 5 estados distintos, cada uno con necesidades visuales diferentes:

| Estado | Descripción | Pantalla principal |
|--------|-------------|-------------------|
| `waiting` | Sala creada, esperando jugadores | Lista de jugadores + código de sala + reglas |
| `ready` | Todos listos, el host puede iniciar | Botón "Iniciar partida" activo |
| `playing` | Turno activo | Mano del jugador + botones Robar/Parar + manos de oponentes |
| `stopped` | Ronda terminada, conteo de puntajes | Manos bloqueadas, puntajes visibles |
| `finished` | Partida terminada | Pantalla de ganador con ranking final |

---

## Estructura de la UI (Componentes Clave)

### Lobby (crear/unirse)
- Formulario de nombre de jugador
- Toggle: "Crear sala" / "Unirse a sala"
- Campo para ingresar código de sala
- Sección expandible "Cómo jugar" con reglas

### Tablero de Juego
1. **Barra superior:** Ronda actual, código de sala, botón de invitar
2. **Mano del jugador activo:** Cartas actuales + puntaje + indicador de turno
3. **Manos de oponentes:** Cards de cada jugador con estado y puntaje
4. **Zona de controles:** Botón Robar y botón Parar
5. **Indicador de Force Draw:** Aparece si hay un Flip Three activo (naranja pulsante)

### Modales / Overlays
- **Selección de víctima:** Al jugar una carta especial, aparece un overlay para elegir target
- **Notificación de evento:** Aparece centrada 2.5s para anunciar bust, flip7, freeze, etc.
- **Pantalla de victoria:** Pantalla completa con ranking y confetti animado

---

## Estética Actual (Referencia de Rediseño)

### Paleta de colores actual
El juego actualmente usa un **tema arcade neon oscuro:**

```
Fondo principal:   hsl(220, 15%, 6%)    — Azul-gris muy oscuro
Texto principal:   hsl(0, 0%, 95%)      — Casi blanco
Tarjeta/Surface:   hsl(220, 15%, 10%)   — Levemente más claro
Primario:          hsl(270, 100%, 70%)  — Púrpura neón brillante
Acento:            hsl(270, 80%, 60%)   — Púrpura más apagado
Destructivo:       hsl(0, 90%, 55%)     — Rojo brillante
```

**Colores neón secundarios usados:**
- Cian (`#06B6D4`) — botón de robar carta, efectos freeze
- Rosa (`#EC4899`) — carta Second Chance
- Verde (`#22C55E`) — acciones positivas
- Amarillo (`#EAB308`) — modificadores, puntaje activo
- Naranja (`#F97316`) — Flip Three
- Azul (`#3B82F6`) — highlights de UI

### Sistema de cartas por colores
Cada número del 0 al 12 tiene un gradiente y glow propio:
| Valor | Color |
|-------|-------|
| 0 | Rose/Rosa |
| 1 | Amber/Ámbar |
| 2 | Lime/Lima |
| 3 | Cyan/Cian |
| 4 | Indigo/Índigo |
| 5 | Teal/Verde azulado |
| 6 | Orange/Naranja |
| 7 | Pink/Rosa fuerte |
| 8 | Purple/Púrpura |
| 9 | Yellow/Amarillo |
| 10 | Green/Verde |
| 11 | Blue/Azul |
| 12 | Red/Rojo |

---

## Patrones Visuales a Considerar en el Rediseño

### Efectos actuales
- **Glassmorphism:** Fondos semi-transparentes + `backdrop-blur` en superficies
- **Neon glow:** Todos los elementos interactivos tienen `box-shadow` de color
- **Gradientes en cartas:** Cada carta tiene un gradiente diagonal único
- **Brillo superficial:** Overlay blanco diagonal para simular luz en cartas
- **Animaciones ambiente:** Pulso neón (2s infinito) en el jugador activo

### Jerarquía visual (de mayor a menor prominencia)
1. Notificaciones de evento (z-50, centradas, grandes)
2. Modal de selección de víctima (z-40, overlay oscuro)
3. Pantalla de victoria (z-40, full-screen)
4. Controles del jugador (botones prominentes, centrados)
5. Barra de info de la partida
6. Mano del jugador actual (primer plano visual, glow púrpura)
7. Manos de oponentes (secundario, sin interacción)

### Indicadores de estado
| Estado | Señal visual |
|--------|-------------|
| Turno activo | Borde púrpura + glow + animación pulso |
| Jugador detenido | 60% opacidad + borde rojo + badge "STOPPED" |
| Second Chance activo | Ícono de corazón rojo pulsante |
| Force Draw activo | Indicador naranja pulsante con conteo |
| Bust | Animación de shake en carta + overlay rojo |

---

## Consideraciones para Diseño Mobile

### Contexto de uso mobile
- La mayoría de las sesiones serán en celular (juegos casuales entre amigos)
- Se comparte un link/código QR para invitar a jugadores
- Los jugadores usan una mano para sostener el teléfono mientras juegan

### Restricciones de espacio
- La pantalla debe mostrar simultáneamente:
  - Tu propia mano (potencialmente 7+ cartas)
  - Hasta 5 oponentes (con sus manos y puntajes)
  - Botones de acción (Robar / Parar)
- Las cartas son pequeñas (`40×56px` actualmente) para caber en pantalla
- Las manos de las cartas usan `flex-wrap` para desbordarse en múltiples líneas

### Recomendaciones para mobile
- **Tap targets mínimos:** 44×44px para botones (WCAG AA)
- **Scroll vertical:** La lista de jugadores debe ser scrollable; los controles deben estar fijos abajo o ser siempre visibles
- **Sin hover:** Los estados de interacción deben comunicarse sin depender de hover
- **Thumb zone:** Los botones Robar y Parar deben estar en la mitad inferior de la pantalla
- **Legibilidad de números:** Los valores de cartas deben ser legibles sin zoom
- **Modo landscape:** Considerar un layout alternativo que aproveche el ancho
- **Modales:** Deben cubrir pantalla completa o la mayor parte en mobile, no flotar como en desktop

### Gestos potenciales a soportar
- Tap en carta para seleccionarla (al jugar especial)
- Swipe up para revelar historial o reglas
- Tap en código de sala para copiar al portapapeles

---

## Consideraciones para Diseño Desktop

### Contexto de uso desktop
- Más raro, generalmente en pantallas 1280px o más
- Posibilidad de ver más información simultáneamente
- Uso de mouse con hover states

### Oportunidades en desktop
- **Layout multi-columna:** Panel izquierdo con info de la partida + área central de juego + panel derecho con oponentes
- **Mayor tamaño de cartas:** Las cartas pueden ser más grandes y mostrar más detalle
- **Tooltips:** Hover sobre cartas puede mostrar nombre y descripción de la carta
- **Sidebar de historial:** Historial de eventos de la partida visible al costado
- **Keyboard shortcuts:** Teclas para Robar (Space/Enter) y Parar (S/Esc)
- **Hover sobre oponentes:** Mostrar detalle al pasar el mouse sobre la mano de un oponente

### Breakpoints sugeridos
| Breakpoint | Layout |
|------------|--------|
| `< 640px` | Single column, cartas pequeñas, controles fijos abajo |
| `640–1024px` | Single column ampliado, cartas medianas |
| `> 1024px` | Multi-columna: sidebar de oponentes + área central |

---

## Feedback Visual y Sonoro

### Feedback visual por evento
| Evento | Visual |
|--------|--------|
| Carta robada | Animación `card-appear` (escala + rotación) |
| Número duplicado (bust) | Animación `shake` en carta + overlay rojo centrado |
| Flip7 logrado | Overlay de celebración multicolor |
| Carta especial jugada | Overlay de selección de víctima + notificación |
| Freeze | Overlay cian centrado |
| Flip Three | Overlay naranja + fuerza 3 robos |
| Juego terminado | Confetti animado + pantalla de ranking |

### Feedback sonoro (mapeo actual)
| Evento | Sonido |
|--------|--------|
| Robar carta normal | draw.mp3 |
| Detenerse | stop.mp3 |
| Bust | duplicates.mp3 |
| Flip7 | flip7.mp3 |
| Carta especial obtenida | special.mp3 |
| Second Chance recibida | extra-life.mp3 |
| Second Chance activada | cure.mp3 |
| Freeze jugado | freeze.wav |
| Flip Three jugado | flip3.mp3 |
| Victoria | win.mp3 |

> Los sonidos son un componente de immersión importante. El rediseño debe mantener el mapeado de eventos → feedback auditivo.

---

## Identidad y Tono

### Personalidad del juego
- **Arcade casual:** No es un juego serio ni competitivo extremo; es para pasar el rato
- **Sorpresa y drama:** El bust y el Flip7 son momentos de alto impacto emocional
- **Social:** La diversión viene de ver a otros perder (o salvarse) en tiempo real
- **Accesible:** Sin necesidad de cuenta, registro ni instalación

### Tono visual sugerido para el rediseño
- Mantener **energía y vibrancy** — este no es un juego minimalista serio
- Las cartas deben ser **visualmente distintas** entre sí (los colores ayudan mucho)
- Los momentos de victoria/bust merecen **celebración visual exagerada**
- La UI de espera (lobby) puede ser más tranquila; la UI de juego debe tener más tensión visual

### Palabras clave de diseño
`neón`, `arcade`, `vibrante`, `oscuro`, `emocionante`, `casual`, `cartas`, `multijugador`, `colores`, `inmersivo`

---

## Resumen de Requisitos para el Design System

Para generar un design system completo con Stitch, se necesitan tokens y componentes para:

### Tokens necesarios
- [ ] Color palette: backgrounds, surfaces, texto, primarios, semánticos (error, warning, success, info)
- [ ] Gradientes por cada carta (13 números + 3 especiales + modificadores)
- [ ] Efectos de sombra/glow por color
- [ ] Tipografía: jerarquía (heading, body, label, mono para código de sala)
- [ ] Spacing scale
- [ ] Border radius (el actual usa `0.75rem`)
- [ ] Animaciones: durations, easings, keyframes para los 10 tipos de animaciones

### Componentes necesarios
- [ ] **PlayingCard** — variantes: número, especial, modificador; estados: normal, hover, selected, disabled, duplicate
- [ ] **PlayerInfo** — estados: activo, detenido, turno actual
- [ ] **GameButton** — variantes: draw (cian), stop (rojo), primary (púrpura), secondary
- [ ] **StatusBadge** — variantes: tu-turno, detenido, second-chance
- [ ] **EventNotification** — overlay de evento con variantes por tipo
- [ ] **VictimModal** — modal de selección con lista de jugadores
- [ ] **WinScreen** — pantalla de victoria con ranking y confetti
- [ ] **Lobby** — formulario de crear/unirse + panel de reglas
- [ ] **GameInfoBar** — barra superior con round, código, invitar
- [ ] **ForceDrawIndicator** — indicador de flip three pendiente
