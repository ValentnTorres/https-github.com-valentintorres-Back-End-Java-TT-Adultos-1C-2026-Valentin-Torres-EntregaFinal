# Imagen de 2 etapas: la primera compila el jar con Maven, la segunda
# solo copia el jar ya compilado sobre un JRE liviano (asi la imagen
# final no arrastra Maven ni el codigo fuente, solo lo necesario para
# correr). Pensado para Render (u otro host que despliegue por Docker):
# Render no detecta proyectos Maven/Java de forma nativa como si hacia
# Railway con Nixpacks, asi que necesita este Dockerfile.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Copiamos primero el pom.xml solo para que Docker cachee las
# dependencias en una capa aparte: si despues solo cambia el codigo
# (src/), no hace falta volver a descargar todo Maven Central.
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# El puerto real lo define la plataforma via la variable de entorno
# PORT (ver server.port=${PORT:8080} en application.properties); este
# EXPOSE es solo documentacion para quien lea el Dockerfile.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
