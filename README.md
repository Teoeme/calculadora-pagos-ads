# Calculadora Pagos Ads

**Calculadora Pagos Ads** es una aplicación web interactiva para simular, planificar y gestionar el flujo de fondos de campañas de publicidad digital (Google Ads, Facebook Ads, etc). Permite calcular y visualizar de forma dinámica el saldo diario, consumos, recargas y proyecciones, considerando días hábiles, feriados y reglas personalizadas.

## ¿Para qué sirve?

- Simular el saldo de una cuenta publicitaria día a día.
- Planificar recargas automáticas o manuales según el consumo y los días hábiles bancarios.
- Visualizar el impacto de feriados, días no laborables y consumos especiales.
- Editar consumos y recargas de manera individual para reflejar casos reales o excepcionales.
- Anticipar cuándo será necesario recargar fondos para evitar cortes en la pauta.

## Características principales

- **Configuración flexible:** Define presupuesto diario, saldo inicial, monto y plazo de recarga, saldo mínimo, cantidad de días a simular, feriados y días laborables.
- **Recargas automáticas y especiales:** El sistema sugiere recargas cuando el saldo proyectado cae por debajo del mínimo, pero también puedes agregar o editar recargas manualmente.
- **Consumos especiales:** Permite modificar el consumo de un día específico para reflejar eventos puntuales.
- **Gestión de feriados y días laborables:** Marca fácilmente qué días son hábiles o laborables, incluyendo excepciones.
- **Proyección de saldo:** Visualiza el saldo futuro considerando el plazo de acreditación de recargas.
- **Persistencia local:** Todos los parámetros y ediciones se guardan automáticamente en el navegador.
- **Interfaz intuitiva:** Tabla editable, con resaltado de días críticos y controles rápidos.

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/Teoeme/calculadora-pagos-ads.git
   ```
2. Instala las dependencias:
   ```bash
   cd calculadora-pagos-ads
   npm install
   ```
3. Realiza un build:
   ```bash
   npm run build
   ```
4. Inicia la app:
    ```bash
    npm start
    ```
    
## Uso

1. Configura los parámetros iniciales (presupuesto, saldo, recarga, feriados, etc.).
2. Visualiza la tabla de simulación y edita consumos o recargas según sea necesario.
3. Marca o desmarca días hábiles/laborables y ajusta feriados.
4. Analiza la proyección de saldo y planifica tus recargas para evitar cortes en la pauta.

## Ejemplo de pantalla

![Ejemplo de tabla dinámica](https://github.com/Teoeme/calculadora-pagos-ads/public/ejemplo-tabla.jpeg) <!-- Puedes agregar un screenshot real aquí -->

## Contribución

¡Las contribuciones son bienvenidas! Por favor, abre un issue o un pull request para sugerir mejoras o reportar errores.

## Licencia

Este proyecto está bajo la licencia MIT.

---

Desarrollado por Alte Workshop (https://alteworkshop.com).
