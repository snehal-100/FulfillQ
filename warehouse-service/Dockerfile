# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY warehouse-service/pom.xml warehouse-service/
COPY warehouse-service/src warehouse-service/src
RUN mvn -f warehouse-service/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/warehouse-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-Xmx256m", "-jar", "app.jar"]
