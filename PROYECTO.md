# AutoNet - Sistema de Gestión y Comunicación Empresarial

## Breve Descripción de la Aplicación

Es una aplicación web diseñada para mejorar la comunicación y la gestión interna de una empresa que utiliza vehículos y maquinaria. Su objetivo principal es conectar al jefe con los trabajadores de forma rápida y eficiente, sin necesidad de llamadas telefónicas, todo a través de Internet.

## Funciones de la Aplicación

### Roles del Sistema

El sistema cuenta con dos roles principales: **Jefe** y **Trabajador**.

---

### Panel de Administración - Jefe

El jefe dispone de un panel de administración desde el cual puede:

- **Gestión de Recursos**
  - Gestionar vehículos, maquinaria y trabajadores (crear, editar o eliminar registros).

- **Gestión de Trabajos**
  - Asignar y supervisar trabajos, indicando recursos, tiempo estimado y fecha de entrega.
  - Validar tareas finalizadas, aprobándolas o rechazándolas con observaciones.

- **Control de Vehículos**
  - Consultar información de vehículos (kilometraje, horas de uso y combustible) para control de mantenimiento.
  - Monitorear el estado de la flota y sus revisiones.

- **Análisis y Reportes**
  - Revisar historial e informes de productividad, comparando tiempos reales y estimados.

- **Administración de Usuarios**
  - Administrar usuarios y roles, modificando permisos o desactivando cuentas.

- **Notificaciones**
  - Recibir notificaciones sobre tareas completadas o incidencias.

---

### Panel de Trabajador

El trabajador dispone de un panel con las herramientas necesarias:

- **Gestión de Tareas**
  - Gestionar tareas asignadas, visualizándolas, aceptándolas y registrando su inicio y finalización.
  - Completar y enviar tareas para aprobación, con posibilidad de añadir comentarios.

- **Actualización de Datos**
  - Actualizar datos de vehículos o maquinaria, como combustible, horómetro o incidencias.

- **Notificaciones**
  - Recibir notificaciones sobre el estado de sus tareas.

- **Consulta de Historial**
  - Consultar su historial de trabajos y tiempos registrados.

---

## Funciones Generales del Sistema

- **Autenticación segura** mediante Laravel Sanctum.
- **Notificaciones internas** y por correo electrónico.
- **Interfaz responsive**, adaptable a cualquier dispositivo.
- **Base de datos SQLite** para un almacenamiento eficiente.
- **Panel de estadísticas** sobre productividad, uso de vehículos y tareas completadas.

---

## Stack Tecnológico

### Backend
- **Laravel** (Framework PHP)
- **Laravel Sanctum** (Autenticación API)
- **SQLite** (Base de datos)

### Frontend
- **React** (Framework JavaScript)
- **Vite** (Build tool)

---

## Estructura del Proyecto

```
AutoNet/
├── back/          # Backend Laravel
├── front/         # Frontend React
└── README.md      # Documentación principal
```

---

## Paleta de Colores

La aplicación utiliza una paleta de colores definida en `front/src/colors.css`:

- **Primary (Teal)**: #0B757C
- **Secondary (Orange)**: #F28C28
- **Dark (Gris oscuro)**: #2B2B2B
- **White**: #FFFFFF

Con variaciones y colores adicionales para estados, fondos, texto, bordes y sombras.

---

## Estado del Proyecto

Proyecto en desarrollo - 2025-2026










