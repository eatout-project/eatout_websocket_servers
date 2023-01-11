import express, {Express} from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import bodyParser from "body-parser";
// @ts-ignore
import * as WebSocket from 'ws';
import {Kafka} from "kafkajs";
import {v4 as uuidv4} from 'uuid';
import {CustomerMessage, MessageApiObject} from "./interfaces/interfaces";

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
let port = process.env.PORT || 8998;

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const kafka = new Kafka({
    clientId: uuidv4(),
    brokers: [process.env.KAFKA_HOST && process.env.KAFKA_PORT ? `${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}` : '127.0.0.1:9092']
})

wss.on('connection', (ws: WebSocket) => {
    console.log('connected');
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', (wsMessage: string) => {
        console.log('wsMessage: ', JSON.parse(wsMessage));
        const messageFromCustomer: CustomerMessage = JSON.parse(wsMessage);
        const consumer = kafka.consumer({ groupId: 'test3-group' });
        consumer.connect()
            .then(something => {
                consumer.subscribe({topic: `${JSON.parse(wsMessage)}`})
                    .then(something => {
                        console.log('made it so far');
                        let counter = 0;
                        consumer.run({
                            partitionsConsumedConcurrently: 3,
                            eachMessage: ({ topic, partition, message }) => {
                                return new Promise(() => {
                                    // @ts-ignore
                                    const jsonMessage: MessageApiObject = JSON.parse(message.value.toString());
                                    console.log(`message ${{counter}}:`, jsonMessage);
                                    counter++;
                                    // @ts-ignore
                                    ws.send(JSON.stringify(jsonMessage));
                                })
                            }
                        })
                            .then(something => {
                                console.log('in the matrix: ', something);
                            }).catch(error => {
                            console.log(error);
                        })
                    })
            })
    })

    ws.on('error', (error: any) => {
        console.log(error);
    })

})

setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
        console.log('something is happenening: ', ws.isAlive);

        if (!ws.isAlive) return ws.terminate();

        ws.isAlive = false;
        ws.ping(null, false, () => {
            console.log('it happened');
        });
    });
}, 30000);

server.listen(port, () => {
    console.log(`Server started on port: ${port})`);
});