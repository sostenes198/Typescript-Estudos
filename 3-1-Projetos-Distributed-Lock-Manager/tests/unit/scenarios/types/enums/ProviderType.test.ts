import { testUtil } from '../../../../assets';
import { ProviderType } from '../../../../../src/types';

describe('ProviderType', () => {
  it('Should validate enum', () => {
    // arrange - act -assert
    testUtil.jest.EnumAssert.assert(ProviderType, ['VALKEY'], ['VALKEY']);
  });
});
