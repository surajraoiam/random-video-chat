FROM openjdk:8
EXPOSE 8444
ADD target/connectworld.jar connectworld.jar
ENTRYPOINT ["java","-jar","/connectworld.jar"]