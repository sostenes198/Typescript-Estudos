/* eslint-disable @typescript-eslint/no-empty-object-type,@typescript-eslint/no-unused-vars */
import { Injectable, InjectableParam } from '../../../src/dy-abstractions/injector-manager/DecorateInjectable';
import { ServiceCollection } from '../../../src/dy/ServiceCollection';

// @Injectable
// @reportableClassDecorator
// class Test {
//
//   constructor(param1: string, param2: ITestInterface, param3: ITestInterface[]) {
//     console.log(param1, param2, param3);
//   }
// }

interface ITestInterface {
}

class TestImp1 implements ITestInterface {
}

@Injectable
class TestImp2 implements ITestInterface {

  constructor(@InjectableParam('IServiceInterface') service: IServiceInterface, @InjectableParam('Providers') notifiers: IEmailSenderProtocol[]) {
  }
}

class TestImp3 implements ITestInterface {
  constructor(emailSender: IEmailSenderProtocol) {
  }
}

interface IServiceInterface {
}

class ServiceImp implements IServiceInterface {
  constructor(repository: IRepositoryInterface, emailSenders: IEmailSenderProtocol[]) {
  }
}

interface IRepositoryInterface {
}

class RepositoryImp1 implements IRepositoryInterface {
}

class RepositoryImp2 implements IRepositoryInterface {
}

interface IEmailSenderProtocol {
}

class EmailSenderProtocolImp1 implements IEmailSenderProtocol {
}

class EmailSenderProtocolImp2 implements IEmailSenderProtocol {
}

class EmailSenderProtocolImp3 implements IEmailSenderProtocol {
}

describe('First', () => {
  it('Testing', () => {
    const serviceCollection = new ServiceCollection();

    serviceCollection.Add<ITestInterface, TestImp2>(TestImp2);

    console.log(serviceCollection);
  });
});