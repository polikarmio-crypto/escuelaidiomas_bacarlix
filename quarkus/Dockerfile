# ===============================================
# Dockerfile - Quarkus Microservice (Escuela de Idiomas)
# Java 17 + Maven for dev mode
# ===============================================
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias primero (cache de layers)
COPY pom.xml ./

# Descargar dependencias
RUN mvn dependency:resolve -q

# Copiar código fuente
COPY src ./src

# Compilar
RUN mvn package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=build /app/target/quarkus-app/lib/ ./lib/
COPY --from=build /app/target/quarkus-app/*.jar ./
COPY --from=build /app/target/quarkus-app/app/ ./app/
COPY --from=build /app/target/quarkus-app/quarkus/ ./quarkus/

EXPOSE 8080

CMD ["java", "-jar", "quarkus-run.jar"]
