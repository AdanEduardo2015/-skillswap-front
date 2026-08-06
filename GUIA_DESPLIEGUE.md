# Guía de Despliegue y Verificación: SkillSwap Backend

Esta guía explica paso a paso cómo realizar el despliegue del proyecto en AWS. Dado que el proyecto divide su arquitectura, el proceso se divide en dos fases:
1. **Infraestructura Base:** Creación de bases de datos, buckets y Cognito usando Terraform.
2. **Cómputo (Serverless):** Despliegue de las funciones Lambda y el API Gateway usando Serverless Framework.

---

## 📋 Requisitos Previos

1. **AWS CLI** instalado y configurado con credenciales válidas (`aws configure`). Tu usuario/rol debe tener permisos de administrador o suficientes privilegios para crear Lambdas, API Gateway, DynamoDB, Cognito y S3.
2. **Terraform** instalado en tu máquina local.
3. **Node.js** (v18 o v20 recomendados) y **npm**.
4. **Serverless Framework**: Recomendado tenerlo instalado globalmente (`npm install -g serverless`) o usar `npx serverless`.

---

## 🏗️ Paso 1: Despliegue de la Infraestructura (Terraform)

El primer paso es levantar los recursos permanentes en AWS, ya que nuestras Lambdas dependerán de estos (especialmente Cognito).

1. Abre una terminal y dirígete al directorio de Terraform:
   ```bash
   cd skillswap-back/terraform
   ```

2. Inicializa Terraform (descarga plugins de AWS):
   ```bash
   terraform init
   ```

3. Revisa y aplica los cambios para producción (reemplaza `<tu-dominio>` con el dominio real de tu frontend, ej: `https://app.skillswap.com`):
   ```bash
   terraform apply -var="environment=prod" -var='cors_allowed_origins=["<tu-dominio>"]'
   ```

4. Escribe `yes` cuando te pregunte si quieres continuar.
5. **¡Importante!** Al finalizar, Terraform mostrará en color verde una sección llamada `Outputs`. Guarda estos valores, los necesitarás en el paso 2:
   - `user_pool_id` (ej. `us-east-1_xxxxx`)
   - `user_pool_client_id` (ej. `yyyyy`)
   - `media_bucket_name`

---

## 🚀 Paso 2: Despliegue de Lambdas y API Gateway (Serverless)

Con la infraestructura lista, procedemos a desplegar nuestro código (Lambdas) y rutas.

1. Regresa a la raíz del backend:
   ```bash
   cd ..
   # (deberías estar en skillswap-back)
   ```

2. Instala las dependencias y compila el proyecto:
   ```bash
   npm install
   ```
   *(El script de Serverless se encargará de compilar `npm run build` gracias al hook del `package.json`).*

3. Ejecuta el despliegue pasando como parámetros los outputs que obtuvimos de Terraform:
   ```bash
   npx serverless deploy --stage prod \
     --param="cognitoUserPoolId=<tu_user_pool_id>" \
     --param="cognitoUserPoolClientId=<tu_user_pool_client_id>" \
     --param="corsAllowedOrigin=<tu-dominio>"
   ```

4. Cuando el comando termine, te mostrará la URL de tu API Gateway.
   - Guardala. Se verá parecida a: `https://abcd123.execute-api.us-east-1.amazonaws.com`

---

## ✅ Paso 3: Verificación y Pruebas (Cómo cerciorarse de que todo funciona)

Una vez desplegado todo, sigue estos pasos para probar que la API está viva, configurada y operando correctamente en AWS.

### A. Verificar Rutas Públicas (API Gateway Vivo)
Haz una petición a un endpoint público para asegurar que API Gateway enruta correctamente a las Lambdas y responde:
```bash
curl -X GET https://<tu-api-id>.execute-api.us-east-1.amazonaws.com/categories
```
*Si todo está bien, deberías recibir un arreglo de categorías en formato JSON.*

### B. Verificar Autenticación (Cognito) y Rutas Protegidas
1. Ve a la consola de AWS -> Cognito -> User pools -> Selecciona tu pool (`skillswap-prod`).
2. Crea un usuario de prueba directamente desde la consola (User and groups -> Create user) o usando tu Frontend (si ya está conectado).
3. Obtén el token (IdToken o AccessToken) iniciando sesión en el frontend o usando AWS CLI:
   ```bash
   aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id <tu_user_pool_client_id> --auth-parameters USERNAME=test@ejemplo.com,PASSWORD=TuPassword123!
   ```
4. Toma el `IdToken` de la respuesta y haz una petición a una ruta protegida con el header Authorization:
   ```bash
   curl -X GET https://<tu-api-id>.execute-api.us-east-1.amazonaws.com/creator/dashboard \
     -H "Authorization: Bearer <TU_ID_TOKEN>"
   ```
*Debes recibir un 200 OK. Si recibes un 401/403, significa que Cognito o el JWT Authorizer no están bien conectados o tu token expiró.*

### C. Verificar Base de Datos (DynamoDB)
Prueba crear y recuperar un dato para comprobar que la Lambda tiene permisos IAM sobre DynamoDB:
1. Crea una publicación:
   ```bash
   curl -X POST https://<tu-api-id>.execute-api.us-east-1.amazonaws.com/publications/create \
     -H "Authorization: Bearer <TU_ID_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"title": "Prueba", "description": "Hola Mundo", "categoryId": "123"}'
   ```
2. Lista las publicaciones para confirmar que se guardó exitosamente:
   ```bash
   curl -X GET https://<tu-api-id>.execute-api.us-east-1.amazonaws.com/publications/list-publications
   ```
*Si esto falla con un error `AccessDeniedException`, falta un permiso IAM en `serverless.yml` hacia la tabla de DynamoDB.*

### D. Verificar el Storage (S3 y Firmas)
Prueba que el bucket funciona y que la Lambda puede generar URLs firmadas.
1. Solicita una URL firmada:
   ```bash
   curl -X POST https://<tu-api-id>.execute-api.us-east-1.amazonaws.com/media/presigned-url \
     -H "Authorization: Bearer <TU_ID_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"fileName": "avatar.png", "fileType": "image/png"}'
   ```
2. Copia la `uploadUrl` que te regrese el JSON y haz un comando PUT directo para probar subir un archivo binario/texto:
   ```bash
   curl -X PUT "<URL_FIRMADA_COMPLETA>" -H "Content-Type: image/png" -d "datos falsos de imagen"
   ```
*Si devuelve 200 OK sin arrojar errores de CORS o ACL, ¡tu S3 funciona perfectamente!*
