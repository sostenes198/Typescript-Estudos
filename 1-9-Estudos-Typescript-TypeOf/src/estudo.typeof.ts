enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

type DirectionType = typeof Direction[keyof typeof Direction];

// DirectionType agora é 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'