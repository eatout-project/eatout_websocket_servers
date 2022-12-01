import express, {Express} from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import bodyParser from "body-parser";
// @ts-ignore
import * as WebSocket from 'ws';
import {Kafka, Partitioners} from "kafkajs";
import {v4 as uuidv4} from 'uuid';
import {ReservationInfoApiObject} from "./interfaces/businessobjects";

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
let port = process.env.PORT || 8999;

const server = http.createServer(app);

const wss = new WebSocket.Server({ server }, {clientTracking: true});

const kafka = new Kafka({
    clientId: uuidv4(),
    brokers: ['127.0.0.1:9092']
})


wss.on('connection', (ws: WebSocket) => {
    console.log('sup');
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', (message: string) => {
        const reservationInfoApiObject: ReservationInfoApiObject = JSON.parse(message);
        console.log('reservationInfoApiObject: ', reservationInfoApiObject);
        const producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner});
        producer.connect()
            .then(something => {
                producer.send({
                    topic: `${reservationInfoApiObject.restaurantId}`,
                    messages: [
                        { value: JSON.stringify(reservationInfoApiObject) },
                    ]
                })
                    .then(something => {
                        console.log('message sent!')
                    })
            })
    })

    ws.on('error', (error: any) => {
        console.log(error);
    })

    //send immediatly a feedback to the incoming connection
    ws.send('Hi there, I am a WebSocket server');
});

setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {

        if (!ws.isAlive) return ws.terminate();

        ws.isAlive = false;
        ws.ping(null, false, () => {
        });
    });
}, 30000);

server.listen(port, () => {
    console.log(`Server started on port: ${port})`);
});