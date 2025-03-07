import '../util/jest/extensions';

describe('jest extensions', () => {
  describe('beNullOrUndefined', () => {
    it('test', () => {
      expect(null).beNullOrUndefined();
      expect(undefined).beNullOrUndefined();
      expect('10').not.beNullOrUndefined();
    });
  });

  describe('assertProperties', () => {
    it('test', () => {
      expect({
        prop: 1
      }).assertProperties([
        {
          propertyName: 'prop',
          typeProperty: 'number'
        }
      ]);
    });
  });

  describe('customAssert', () => {
    it('test', () => {
      let mock: jest.Mocked<any> = {
        func: jest.fn().mockImplementation(() => {
          throw new Error('Not Implemented');
        })
      };

      mock.func.mockImplementation(() => {
      });

      mock.func('PARAM');

      expect(mock.func).toHaveBeenCalledTimes(1);

      expect(mock.func).toHaveBeenCalledWith(expect.customAssert((value) => {
        expect(value).toStrictEqual('PARAM');
        return {
          pass: true,
          message: () => ''
        };
      }));
    });
  });
});