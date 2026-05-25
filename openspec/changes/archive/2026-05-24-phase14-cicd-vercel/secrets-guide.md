# Guía de Configuración de Secretos para Vercel en GitHub Actions

Esta guía detalla los pasos para obtener las credenciales necesarias de Vercel y configurarlas en GitHub Actions, permitiendo que el flujo de integración y despliegue continuo (CI/CD) funcione de manera automática y blindada.

---

## Paso 1: Generar el Token de Acceso de Vercel (`VERCEL_TOKEN`)

El token de acceso permite que el pipeline de GitHub Actions se autentique con la API de Vercel para descargar la configuración, compilar y desplegar el proyecto.

1. Inicia sesión en tu cuenta de [Vercel](https://vercel.com).
2. Dirígete a la configuración de tu cuenta: Haz clic en tu avatar en la esquina superior derecha y selecciona **Settings** (o ve directamente a [Vercel Account Settings](https://vercel.com/account)).
3. En la barra lateral izquierda, haz clic en **Tokens**.
4. Haz clic en el botón **Create Token** (Crear Token).
5. Completa la configuración del token:
   - **Name**: Introduce un nombre descriptivo, por ejemplo: `github-actions-consolidados`.
   - **Scope**: Selecciona el alcance del token (tu cuenta personal o el equipo/organización donde se encuentra el proyecto).
6. Haz clic en **Create**.
7. **Copia el token generado inmediatamente**. Guárdalo en un lugar seguro; no podrás volver a verlo después de cerrar esa pantalla.

---

## Paso 2: Obtener el ID de Organización (`VERCEL_ORG_ID`) y el ID de Proyecto (`VERCEL_PROJECT_ID`)

Existen dos métodos para obtener estos valores. El **Método A** es el más rápido si ya vinculaste el proyecto de forma local. El **Método B** se realiza mediante la interfaz web de Vercel.

### Método A: Desde el archivo local `.vercel/project.json` (Recomendado)

Si ya has instalado Vercel CLI de forma local y vinculaste el proyecto ejecutando el comando `vercel` o `vercel link`:

1. Abre el explorador de archivos o tu terminal en la raíz del proyecto.
2. Abre el archivo oculto `.vercel/project.json`.
3. Verás una estructura JSON similar a esta:
   ```json
   {
     "orgId": "team_abc123xyz...",
     "projectId": "prj_lmn456opq..."
   }
   ```
4. El valor de `orgId` corresponde a **`VERCEL_ORG_ID`**.
5. El valor de `projectId` corresponde a **`VERCEL_PROJECT_ID`**.

### Método B: Desde la interfaz web de Vercel

Si no tienes el proyecto vinculado localmente:

#### Para obtener el `VERCEL_ORG_ID`:
- Si es una **cuenta de Equipo/Organización**: Ve al dashboard del equipo, entra en **Settings** (Configuración del equipo) > **General**, y copia el valor de **Team ID** (comienza generalmente con `team_`).
- Si es una **cuenta Personal**: Tu `orgId` es tu ID de usuario de Vercel. Puedes encontrarlo en [Vercel Account Settings](https://vercel.com/account) o usar tu nombre de usuario si no tienes un equipo. Sin embargo, vincular el proyecto localmente mediante `vercel link` es la manera libre de errores para obtener el ID exacto.

#### Para obtener el `VERCEL_PROJECT_ID`:
1. Ve al dashboard de Vercel y selecciona tu proyecto (`consolidados-v2`).
2. Haz clic en la pestaña **Settings** (Configuración del proyecto) en la barra superior.
3. En la sección **General**, desplázate hacia abajo hasta encontrar **Project ID**.
4. Copia el valor del ID del proyecto (comienza generalmente con `prj_`).

---

## Paso 3: Configurar los Secretos en tu Repositorio de GitHub

Una vez que tengas los tres valores (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, y `VERCEL_PROJECT_ID`), debes agregarlos como secretos seguros en tu repositorio de GitHub.

1. Ve a tu repositorio en [GitHub](https://github.com).
2. Haz clic en la pestaña **Settings** (Configuración) en la barra de navegación superior.
3. En la barra lateral izquierda, busca la sección **Security** (Seguridad), expande **Secrets and variables** (Secretos y variables) y haz clic en **Actions** (Acciones).
4. Haz clic en el botón verde **New repository secret** (Nuevo secreto de repositorio) en la esquina superior derecha.
5. Crea cada uno de los siguientes tres secretos uno por uno:

### Secreto 1: Token de Acceso
- **Name**: `VERCEL_TOKEN`
- **Value**: *(El token copiado en el Paso 1)*

### Secreto 2: ID de Organización
- **Name**: `VERCEL_ORG_ID`
- **Value**: *(El ID obtenido en el Paso 2; comienza con `team_` o similar)*

### Secreto 3: ID de Proyecto
- **Name**: `VERCEL_PROJECT_ID`
- **Value**: *(El ID obtenido en el Paso 2; comienza con `prj_`)*

6. Asegúrate de guardar cada secreto haciendo clic en **Add secret**.

---

## Paso 4: Próximos Pasos (Verificación)

Una vez guardados los secretos:
1. Sube un cambio o abre un Pull Request hacia la rama `master`.
2. Dirígete a la pestaña **Actions** en GitHub.
3. Verás que se ejecuta el pipeline `CI/CD Pipeline`.
4. El pipeline ejecutará de forma secuencial el linter y los tests. Si todo pasa exitosamente, desplegará automáticamente la compilación preconstruida directamente a producción en Vercel.
