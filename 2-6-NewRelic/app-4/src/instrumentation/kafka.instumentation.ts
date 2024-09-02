import newRelic from 'newrelic';
import kafkaJs from 'kafkajs';

newRelic.instrumentMessages({
  absolutePath: kafkaJs,
  moduleName: 'kafkajs',
  onRequire: instrumentKafka,
} as any);

function instrumentKafka(shim: any, messages: any, moduleName: any) {
  console.log(`[NEWRELIC] instrumenting ${moduleName}`);
  const kafka = messages.Kafka;

  shim.setLibrary('kafka-messages');

  console.log(`[NEWRELIC] instrumenting method 'send'`);
  shim.recordProduce(kafka.prototype, 'producer', (shim: any, fn: any, name: any, args: any) => {

    const queueName = args[0];
    const message = args[1];
    console.log(`[NEWRELIC] send called on queue '${queueName}' with message '${message}'`);

    // misc key/value parameters can be recorded as a part of the trace segment
    const params = { message, queueName };

    return new shim.specs.MessageSpec({
      callback: shim.LAST,
      destinationName: queueName,
      destinationType: shim.QUEUE,
      parameters: params,
    });
  });

  // console.log(`[NEWRELIC] instrumenting callbacks of method 'getMessage'`);
  // shim.recordConsume(Client.prototype, 'getMessage', new shim.specs.MessageSpec({
  //   destinationName: shim.FIRST,
  //   callback: shim.LAST,
  //   after({ args }) {
  //     const [err, msg] = args;
  //     if (msg) {
  //       console.log(
  //         `[NEWRELIC] getMessage on queue ${msg.queueName} returned a message: '${msg.msg}'`,
  //       );
  //       // misc key/value parameters can be recorded as a part of the trace segment
  //       const params = { message: msg.msg, queueName: msg.queueName };
  //
  //       return {
  //         parameters: params,
  //       };
  //     }
  //
  //     console.log('[NEWRELIC] getMessage returned no message');
  //     return {
  //       parameters: { err },
  //     };
  //   },
  // }));


  // console.log(`[NEWRELIC] instrumenting callbacks of method 'subscribe'`);
  // shim.recordSubscribedConsume(Client.prototype, 'subscribe', new shim.specs.MessageSubscribeSpec({
  //   consumer: shim.LAST,
  //   // This handler will be called in whatever context our subscribed
  //   // message handler is called. In index.js, this is the
  //   // `consumeMessage` function defined by the `subscribe` Express
  //   // route, which will be called whenever new messages are
  //   // published.
  //   //
  //   // Note that we are not recording the subscription call itself,
  //   // only the the consume calls made because a subscription was made
  //   // earlier.
  //   messageHandler(shim, args) {
  //     const msg = args[0];
  //     console.log(`[NEWRELIC] subscribe on queue ${msg.queueName} returned a message: '${msg.msg}'`);
  //     return {
  //       destinationName: msg.queueName,
  //       destinationType: shim.QUEUE,
  //     };
  //   },
  // }));

  // console.log(`[NEWRELIC] instrumenting method 'purge'`);
  // shim.recordPurgeQueue(Client.prototype, 'purge', (shim, fn, name, args) => {
  //   const queueName = args[0];
  //   console.log(`[NEWRELIC] purge called on queue '${queueName}'`);
  //
  //   // misc key/value parameters can be recorded as a part of the trace segment
  //   const params = { queueName };
  //
  //   return new shim.specs.MessageSpec({
  //     callback: shim.LAST,
  //     destinationName: queueName,
  //     destinationType: shim.QUEUE,
  //     parameters: params,
  //   });
  // });
}