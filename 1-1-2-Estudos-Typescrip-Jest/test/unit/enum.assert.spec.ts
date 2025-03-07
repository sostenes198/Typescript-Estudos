import { EnumAssert } from '../util';

enum UserEnum {
  REGULAR = 'REGULAR',
  ADMIN = 'ADMIN',
}

describe('enum.assert', () => {
  it('Validate assert enum', () => {
    // arrange - act - assert
    EnumAssert.Assert(
      UserEnum,
      ['REGULAR', 'ADMIN'],
      ['REGULAR', 'ADMIN']
    );
  });
});