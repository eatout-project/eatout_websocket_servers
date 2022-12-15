import express, {Express} from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import bodyParser from "body-parser";
// @ts-ignore
import * as WebSocket from 'ws';
import {Kafka} from "kafkajs";
import {v4 as uuidv4} from 'uuid';

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
let port = process.env.PORT || 8998;

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const kafka = new Kafka({
    clientId: uuidv4(),
    brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`]
})


wss.on('connection', (ws: WebSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });
    console.log('hello there')


    ws.on('message', (wsMessage: string) => {
        console.log('wsMessage: ', JSON.parse(wsMessage));
        const consumer = kafka.consumer({ groupId: uuidv4()});
        consumer.connect().then(something => {
            console.log('kafka consumer connected')
            console.log(JSON.parse(wsMessage).restaurantId)
            consumer.subscribe({topic: `${JSON.parse(wsMessage).restaurantId}`, fromBeginning: true})
                .then(something => {
                    console.log('testing something: ', something)
                    console.log('kafka consumer subscribed to ' + JSON.parse(wsMessage).restaurantId);
                    consumer.run({
                        eachMessage: ({ topic, partition, message }) => {
                            // @ts-ignore
                            console.log('kafkaMessage', JSON.parse(message.value.toString()));

                            // @ts-ignore
                            return ws.send(message.value.toString() || 'nothing', () => {
                                return Promise.resolve();
                            })
                        }
                    })
                })
        })
    })

    ws.on('error', (error: any) => {
        console.log('error: ', error);
        ws.close();
    })

    ws.on('close', () => {
        console.log('closing socket');
        ws.close();
    })

    //send immediatly a feedback to the incoming connection
    ws.send('Hi there, I am a WebSocket server');
})

setInterval(() => {
    console.log(wss.clients);
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