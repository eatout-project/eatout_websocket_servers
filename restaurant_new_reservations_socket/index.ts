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

console.log('KAFKA_HOST: ' + process.env.KAFKA_HOST + ' KAFKA_PORT: ' + process.env.KAFKA_PORT);

const kafka = new Kafka({
    clientId: uuidv4(),
    brokers: [process.env.KAFKA_HOST && process.env.KAFKA_PORT ? `${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}` : '127.0.0.1:9092']
})


wss.on('connection', (ws: WebSocket) => {
    const consumer = kafka.consumer({ groupId: uuidv4()});
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });


    ws.on('message', (wsMessage: string) => {
        console.log('wsMessage: ', JSON.parse(wsMessage));
        consumer.connect().then(something => {
            console.log('kafka consumer connected')
            consumer.subscribe({topic: `${JSON.parse(wsMessage)}`, fromBeginning: true})
                .then(something => {
                    console.log('kafka consumer subscribed to ' + JSON.parse(wsMessage));
                    consumer.run({
                        eachMessage: ({ topic, partition, message }) => {
                            if (message.value) {
                                console.log('kafkaMessage', JSON.parse(message.value.toString()));
                                ws.send(message.value.toString() || '');
                                return Promise.resolve().then(() => {});
                            }
                            return Promise.resolve().then(() => {});
                        }
                    }).then(something => {
                        console.log('moved on')
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