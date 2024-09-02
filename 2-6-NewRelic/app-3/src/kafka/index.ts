import { Consumer, Kafka as KafkaJs, logLevel, Producer } from 'kafkajs';
import newrelic, { DistributedTraceHeaders } from 'newrelic';
import { error, info } from '../services/utils/logger';
import { serviceExecute } from '../services/service';

export default class Kafka {
  private static _consumer: Consumer;
  private static _producer: Producer;


  private constructor() {

  }

  public static async connect(): Promise<void> {
    const kafka = new KafkaJs({
      clientId: 'app-4',
      brokers: process.env.KAFKA_BROKERS!.split(';'),
      logLevel: logLevel.INFO,
      // ssl: true,
      // sasl: {
      //   mechanism: "scram-sha-512",
      //   username: process.env.KAFKA_USER!,
      //   password: process.env.KAFKA_PASSWORD!
      // }
    });

    this._producer = kafka.producer();
    await this._producer.connect();

    this._consumer = kafka.consumer({ groupId: 'test' });
    await this._consumer.connect();

    console.log('Connected to kakfa');
  }

  public static async produce(): Promise<void> {
    const headers = { 'test-dt': 'test-newrelic' };
    await this._producer.send({
      topic: 'test-topic',
      messages: [
        {
          value: 'Hello Kafka',
          headers,
        },
      ],
    });

    // await newrelic.startSegment("Message queue - producer", false, async (): Promise<void> => {
    //   const backgroundHandle = newrelic.getTransaction();
    //
    //   const headers = { "test-dt": "test-newrelic" };
    //   backgroundHandle.insertDistributedTraceHeaders(headers);
    //
    //   await this._producer.send({
    //     topic: "test-topic",
    //     messages: [
    //       {
    //         value: "Hello Kafka",
    //         headers
    //       }
    //     ]
    //   });
    // });

  }
}
