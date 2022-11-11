import express, {Express} from 'express';
import dotenv from 'dotenv';
import http from 'http';
// @ts-ignore
import cors from 'cors';
import bodyParser from "body-parser";
// @ts-ignore
import * as WebSocket from 'ws';
import {Kafka} from "kafkajs";
// @ts-ignore
import uuid from "uuid";
import {ReservationInfoApiObject} from "./businessobjects/businessobjects";

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT;

const server = http.createServer(app);

const wss = new WebSocket.Server({ server }, {clientTracking: true});

const kafka = new Kafka({
    clientId: '1',
    brokers: ['127.0.0.1:9092']
})


wss.on('connection', (ws: WebSocket) => {
    const producer = kafka.producer()
    const consumer = kafka.consumer({ groupId: 'test-group' })
    ws.on('message', (message: string) => {
        console.log('message:', JSON.parse(message));
        const reservationInfoApiObject: ReservationInfoApiObject = JSON.parse(message);
        producer.connect()
            .then(something => {
                console.log('first step')
                producer.send({
                    topic: `${reservationInfoApiObject.restaurantId}`,
                    messages: [
                        { value: JSON.stringify(reservationInfoApiObject) },
                    ]
                }).then(something => {
                    console.log('second step')
                    consumer.connect()
                        .then(something => {
                            console.log('third step')
                            consumer.subscribe({topic: `${reservationInfoApiObject.restaurantId}`, fromBeginning: true})
                                .then(something => {
                                    console.log('fourth step')
                                    consumer.run({
                                        eachMessage: ({ topic, partition, message }) => {
                                            console.log('fifth step message: ', message)
                                            return new Promise(() => {
                                                // @ts-ignore
                                                ws.send(message.value.toString());
                                                console.log({
                                                    partition,
                                                    offset: message.offset,
                                                    value: message.value ? message.value.toString() : 'something',
                                                })
                                                setTimeout( () => {

                                                    ws.send('{"customerId":454,"customerName":"a","restaurantId":1,"restaurantName":"larsens","timeOfArrival":"4:0","amountOfGuests":2,"status":"accepted"}')
                                                }, 1000);
                                            })
                                        }
                                    })
                                })
                                .catch(error => {
                                    console.log('1', error);
                                })
                        })
                        .catch(error => {
                            console.log(2, error);
                        })
                })
                    .catch(error => {
                        console.log(3, error);
                    })
            })
            .catch(error => {
                console.log(4, error);
            })
    });

    //send immediatly a feedback to the incoming connection
    ws.send('Hi there, I am a WebSocket server');
    console.log(wss.clients)
});

server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port: ${port})`);
});