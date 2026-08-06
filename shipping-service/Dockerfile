# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY shipping-service/pom.xml shipping-service/
COPY shipping-service/src shipping-service/src
RUN mvn -f shipping-service/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/shipping-service/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-Xmx256m", "-jar", "app.jar"]
