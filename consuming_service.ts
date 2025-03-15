import * as mysql from 'mysql2/promise';
import * as amqp from 'amqplib';
import { Street } from './israeliStreets';
import * as dotenv from 'dotenv';
dotenv.config();

const url = 'amqp://host.docker.internal:5672';
const DATABASE_NAME = "StreetNamesDb";
const TABLE_NAME = "streetsInfo"
const QUEUE_NAME = "StreetsInfoQueue"


async function main():Promise<void>
{
    try{
    const mysqlConnection = await mysql.createConnection({
        host: 'host.docker.internal',
        port: 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
        await createDatabase(mysqlConnection);
        await mysqlConnection.changeUser({database : DATABASE_NAME});
        await createTable(mysqlConnection);
        await consumer(mysqlConnection);
}
catch(error){
    console.error("Error in main function: ", error);
    process.exit(1);
    }
}


async function createDatabase(mysqlConnection: mysql.Connection):Promise<void>
{
    try{
        await mysqlConnection.query(`CREATE DATABASE IF NOT EXISTS ${DATABASE_NAME}`);
        console.log("Created DB");
    }
    catch(error){
        console.error("Error in createDatabase function", error);
        throw error;
    }
}

async function createTable(mysqlConnection: mysql.Connection):Promise<void>
{   
    try{
        mysqlConnection.query(
            `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (` +
            'region_code int, ' +
            'region_name varchar(255), ' +
            'city_code int, ' +
            'city_name varchar(255), ' +
            'street_code int, ' +
            'street_name varchar(255), ' +
            'street_name_status varchar(255), ' +
            'official_code int, ' +
            'streetId int, ' +
            'PRIMARY KEY (streetId)' +
            ')');
        console.log("Created Table");
    }
    catch(error){
        console.error("Error in createTable function",error);
        throw error;
    }
}

async function consumer(mysqlConnection: mysql.Connection):Promise<void>
{
    try{
        console.log('Start Listening...')
        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();
        const queue = QUEUE_NAME;
        await channel.assertQueue(queue);

        channel.consume(queue, async (streetInfo)=>{
            if(streetInfo){
                try{
                const insertStreetName = streetInfo.content.toString();
                await insertStreetsNamesToDb(mysqlConnection, JSON.parse(insertStreetName));
                channel.ack(streetInfo);
                }
                catch(error){
                    console.error("Error in consumer functions in the channel.consume",error);
                }
            }
        });
}
    catch(error){
        console.error("Error in consumer function ",error);
        throw error;
    }
}

async function insertStreetsNamesToDb(mysqlConnection: mysql.Connection, streetInfo: Street): Promise<void>
{
    if(!streetInfo){
        throw new Error("streetInfo was not recieved ");
    }
    try{
        await mysqlConnection.query(
            `INSERT INTO ${TABLE_NAME} (region_code, region_name, city_code, city_name, street_code, street_name, street_name_status, official_code, streetId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,[streetInfo.region_code, streetInfo.region_name, streetInfo.city_code, streetInfo.city_name, streetInfo.street_code, streetInfo.street_name, streetInfo.street_name_status, streetInfo.official_code, streetInfo.streetId]
        );
        console.log("Info about ",streetInfo.street_name," street has just arrived!");
    }
    catch(error){
        console.error("Error in insertStreetsNamesToDb function  ",error);
    }
}

main();
