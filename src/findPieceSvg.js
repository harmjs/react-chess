import { TYPES } from './models/Piece';

import lightPawnSVG from './svg/light_pawn.svg';
import lightKnightSVG from './svg/light_knight.svg';
import lightBishopSVG from './svg/light_bishop.svg';
import lightRookSVG from './svg/light_rook.svg';
import lightQueenSVG from './svg/light_queen.svg';
import lightKingSVG from './svg/light_king.svg';

import darkPawnSVG from './svg/dark_pawn.svg';
import darkKnightSVG from './svg/dark_knight.svg';
import darkBishopSVG from './svg/dark_bishop.svg';
import darkRookSVG from './svg/dark_rook.svg';
import darkQueenSVG from './svg/dark_queen.svg';
import darkKingSVG from './svg/dark_king.svg';

const TYPE_INDEX_MAP = new Map(TYPES.map((type, index) => [type, index]));
const TYPE_COUNT = TYPE_INDEX_MAP.size;

const PIECE_SVG_ARRAY = [
    lightPawnSVG, lightKnightSVG, lightBishopSVG, lightRookSVG, lightQueenSVG, lightKingSVG,
    darkPawnSVG, darkKnightSVG, darkBishopSVG, darkRookSVG, darkQueenSVG, darkKingSVG ];
 
const findPieceSvg = function(type, side)
{
    const typeIndex = TYPE_INDEX_MAP.get(type);
    const pieceSvgIndex = typeIndex + side * TYPE_COUNT;

    return PIECE_SVG_ARRAY[pieceSvgIndex];
}

export default findPieceSvg;