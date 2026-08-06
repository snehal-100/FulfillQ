# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY order-service/pom.xml order-service/
COPY order-service/src order-service/src
RUN mvn -f order-service/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/order-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-Xmx256m", "-jar", "app.jar"]
