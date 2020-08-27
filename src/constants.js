import Vect2d from './models/Vect2d';

export const POSITION_8X8_2D_ARRAY = [...Array(8)]
    .map((_, y) => [...Array(8)]
        .map((_, x) => new Vect2d(x, 7 - y)))

export const POSITION_8X8_ARRAY = POSITION_8X8_2D_ARRAY
    .reduce((a, b) => a.concat(b));

export const POSITION_MAP = new Map(POSITION_8X8_ARRAY
    .map((position) => [position.serialize(), position]));

export const Direction = {
    NORTH: new Vect2d(0, 1),
    NORTH_EAST: new Vect2d(1, 1),
    EAST: new Vect2d(1, 0),
    SOUTH_EAST: new Vect2d(1, -1),
    SOUTH: new Vect2d(0, -1),
    SOUTH_WEST: new Vect2d(-1, -1),
    WEST: new Vect2d(-1, 0),
    NORTH_WEST: new Vect2d(-1, 1)
};

export const BACKROWS = [
    [
        POSITION_MAP.get('0,0'),
        POSITION_MAP.get('1,0'),
        POSITION_MAP.get('2,0'),
        POSITION_MAP.get('3,0'),
        POSITION_MAP.get('4,0'),
        POSITION_MAP.get('5,0'),
        POSITION_MAP.get('6,0'),
        POSITION_MAP.get('7,0')
    ],
    [
        POSITION_MAP.get('0,7'),
        POSITION_MAP.get('1,7'),
        POSITION_MAP.get('2,7'),
        POSITION_MAP.get('3,7'),
        POSITION_MAP.get('4,7'),
        POSITION_MAP.get('5,7'),
        POSITION_MAP.get('6,7'),
        POSITION_MAP.get('7,7')
    ]
];

export const DIRECTIONS = Object.values(Direction);