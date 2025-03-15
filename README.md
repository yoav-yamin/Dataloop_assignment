# Dataloop Assignment

I created a messaging system using RabbitMQ, where a **publishing service** sends information about the streets of a given city, and a **consuming service** takes that information from the queue and stores it in a MySQL database.

## Project Overview

### 1. `consuming_service.ts`
The consumer service listens to messages from RabbitMQ and stores them in a MySQL database.

### 2. `publishing_service.ts`
The publisher service retrieves information about the streets of a given city and sends it to RabbitMQ.


## Setup & Running Instructions

1. Clone this repository:
   ```sh
   git clone https://github.com/yoav-yamin/Dataloop_assignment.git
   ```

2. Start the services using Docker Compose:
   ```sh
   docker compose -f docker-compose.yml up -d --build s2
   docker compose -f docker-compose.yml up -d --build rabbitmq
   ```
   This will start RabbitMQ and MySQL.

3. Run 
   ```sh
   npm install --save-dev @types/node
   ```
   
4. Create a .env file with the following variables (The credentials to the MySQL database):
  - DB_USER
  - DB_PASSWORD

5. Run the consumer service first:
   ```sh
   npx ts-node src/consuming_service.ts
   ```
   This service will keep running, waiting for messages.

6. Run the publisher service by providing a city name:
   ```sh
   npx ts-node src\publishing_service.ts <City Name>
   ```

## Notes
- This project is based on the assignment described in the following repo:
https://bitbucket.org/dataloop-ai/dm-interview-assignment/src/main/


---


