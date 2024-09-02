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

  public static async consume(): Promise<void> {
    await this._consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

    await this._consumer.run({
      eachMessage: async ({ topic, partition, message }) => {

        try {
          const backgroundHandle = newrelic.getTransaction();

          let headerObject: {
            [key: string]: string
          } = {};
          for (const [key, value] of Object.entries(message.headers ?? {})) {
            headerObject[key] = value!.toString();
          }

          const messageValue = message.value!.toString();

          backgroundHandle.acceptDistributedTraceHeaders('Queue', headerObject);


          await newrelic.startSegment('segment-customSpan:app-4:consumeMessage:4', false, async () => {
            info('INICIALIZANDO span consumeMessage service app-4', { spanService: 'app-4' });
            newrelic.addCustomSpanAttribute('custom-span-attribute-inside-consumeMessage-service-app-4', '4');
            newrelic.incrementMetric('metricApp4/consumeMessage/app4/service');
            newrelic.addCustomAttribute('custom-attribute-inside-consumeMessage-service-app-4', '4');

            info(`TOPIC || PARTITION || MESSAGE`, { topic, partition, messageValue });

            await serviceExecute();

            const result = {
              name: 'CONSUMER - APP-4',
              status: 'OK',
            };

            info('FINALIZANDO span consumeMessage service app-4', { spanService: 'app-4', resultSpan: result });

            return result;
          });

          backgroundHandle.end();
        } catch (ex) {
          error('FAIO', ex);
        }

        // await newrelic.startBackgroundTransaction("Message queue - consumer", async (): Promise<void> => {
        //   try {
        //     const backgroundHandle = newrelic.getTransaction();
        //
        //     let headerObject: {
        //       [key: string]: string
        //     } = {};
        //     for (const [key, value] of Object.entries(message.headers ?? {})) {
        //       headerObject[key] = value!.toString();
        //     }
        //
        //     const messageValue = message.value!.toString();
        //
        //     backgroundHandle.acceptDistributedTraceHeaders("Queue", headerObject);
        //
        //
        //     await newrelic.startSegment("segment-customSpan:app-4:consumeMessage:4", false, async () => {
        //       info("INICIALIZANDO span consumeMessage service app-4", { spanService: "app-4" });
        //       newrelic.addCustomSpanAttribute("custom-span-attribute-inside-consumeMessage-service-app-4", "4");
        //       newrelic.incrementMetric("metricApp4/consumeMessage/app4/service");
        //       newrelic.addCustomAttribute("custom-attribute-inside-consumeMessage-service-app-4", "4");
        //
        //       info(`TOPIC || PARTITION || MESSAGE`, { topic, partition, messageValue });
        //
        //       await serviceExecute();
        //
        //       const result = {
        //         name: "CONSUMER - APP-4",
        //         status: "OK"
        //       };
        //
        //       info("FINALIZANDO span consumeMessage service app-4", { spanService: "app-4", resultSpan: result });
        //
        //       return result;
        //     });
        //
        //     backgroundHandle.end();
        //   } catch (ex) {
        //     error("FAIO", ex);
        //   }
        // });
      },
    });
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
    // await newrelic.startSegment('Message queue - producer', false, async (): Promise<void> => {
    //   const backgroundHandle = newrelic.getTransaction();
    //
    //   const headers = { 'test-dt': 'test-newrelic' };
    //   backgroundHandle.insertDistributedTraceHeaders(headers);
    //
    //   await this._producer.send({
    //     topic: 'test-topic',
    //     messages: [
    //       {
    //         value: 'Hello Kafka',
    //         headers,
    //       },
    //     ],
    //   });
    // });
  }
}
