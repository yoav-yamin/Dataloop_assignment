import {Street, StreetsService} from './israeliStreets/StreetsService';
import * as amqp from 'amqplib';
import { city, cities } from './israeliStreets/cities';

const url = 'amqp://host.docker.internal:5672';
const QUEUE_NAME = "StreetsInfoQueue";


async function main(): Promise<void>
{
    try{
        const connection = await amqp.connect(url);
        const channel = await setupChannel(connection);

        const city = await parseCityFromArgument();
        const streets = await parseStreets(city);

        await sendStreetsToQueue(channel, streets);
        await channel.close();
        await connection.close();
        console.log("The Queue is closed!");
    }
    catch(error){
        console.error("Error in main function: ", error);
        process.exit(1);
    }
}

async function sendStreetsToQueue(channel: amqp.Channel, streets: Pick<Street,'streetId'>[]):Promise<void>
{
    console.log("The number of streets we are getting: ",streets.length);
    for(let index = 0; index < streets.length; index++){
        try{
        const streetInfo = await StreetsService.getStreetInfoById(streets[index].streetId);
        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(streetInfo)));
    }
        catch(error){
            console.error(`Error with streetId: ${streets[index].streetId}`)
        }
    }
}

async function setupChannel(connection: amqp.Connection): Promise<amqp.Channel>
{
    try{
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME);
        return channel;
    }
    catch(error){
        console.error("Error in setupChannel: ",error);
        throw error;
    }
}

async function parseCityFromArgument():Promise<string>
{
    const pickedCity = process.argv.slice(2).join(' ');
    if (!pickedCity){
        console.warn("User input was empty! Provide a city name");
        process.exit(1);
    }

    const rightFormatCityName = pickedCity.split(" ");    
    for (let i = 0; i < rightFormatCityName.length; i++) {
        rightFormatCityName[i] = rightFormatCityName[i][0].toUpperCase() + rightFormatCityName[i].substr(1);
    }
    console.log()
    const formattedCityName = rightFormatCityName.join(" ")
    if(!validateCityName(formattedCityName)){
        console.warn("Not a valid city name");
        process.exit(1);
    }
    return formattedCityName;
}

function validateCityName(cityName: string): boolean {
    return cities[cityName] ? true:false;
}

async function parseStreets(city:string):Promise<Pick<Street, 'streetId'|'street_name'>[]>
{
    console.log("We getting all the streets from: ",city);
    try{
        const result = await StreetsService.getStreetsInCity(city as city);
        const allStreets = result.streets;
        return allStreets;
    }
    catch(error){
        console.error(`Error in taking streets from city:${city}`, error);
        return [];
    }
}

main();