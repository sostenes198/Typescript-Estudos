import { TestObj } from './types';

export class BaseConfigs {
  public static defaultCorrelationId: string =
    '2ade187f-15f1-4ad3-a8b4-5ebd6dce61ab';

  public static DefaultObjs: Array<TestObj> = [
    {
      id: 'f75d9b44-351b-46d8-9e59-4cf3e3d9f637',
      prop1: 'PROP_1',
      prop2: 1,
      prop3: true,
      correlationId: this.defaultCorrelationId,
    },
    {
      id: 'fc38ef8a-7ba9-41c3-8813-2ba6cfee2bc4',
      prop1: 'PROP_1',
      prop2: 2,
      prop3: false,
      correlationId: this.defaultCorrelationId,
    },
    {
      id: '5eb6ea9f-92a4-49da-bf33-b370180de333',
      prop1: 'PROP_1',
      prop2: 3,
      prop3: true,
      correlationId: this.defaultCorrelationId,
    },
    {
      id: '653d009e-31e7-4f60-aed0-8ac46b7b0719',
      prop1: 'PROP_1',
      prop2: 4,
      prop3: false,
      correlationId: this.defaultCorrelationId,
    },
    {
      id: '1bce0b55-c39e-4803-814f-f976c7bb59dd',
      prop1: 'PROP_1',
      prop2: 5,
      prop3: true,
      correlationId: this.defaultCorrelationId,
    },
  ];

  // eslint-disable-next-line
  private constructor() {}
}
