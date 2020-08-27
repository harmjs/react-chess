import { Direction, POSITION_MAP } from '../constants';
import { Map } from 'immutable';
import Vect2d from './Vect2d';

const PAWN_DOUBLE_DOWN = Direction.SOUTH.multiply(2);
const PAWN_DOUBLE_UP =  Direction.NORTH.multiply(2);

const DIRECTIONS = Object.values(Direction);

const DIAGONAL_DIRECTIONS = [
    Direction.NORTH_WEST, Direction.SOUTH_WEST, 
    Direction.NORTH_EAST, Direction.SOUTH_EAST ];

const NON_DIAGONAL_DIRECTIONS = [
    Direction.NORTH, Direction.SOUTH, 
    Direction.EAST, Direction.WEST];

const KNIGHT_DIRECTIONS = [
    new Vect2d(2, 1), new Vect2d(2, -1), 
    new Vect2d(-2, 1), new Vect2d(-2, -1),
    new Vect2d(1, 2), new Vect2d(1, -2), 
    new Vect2d(-1, 2), new Vect2d(-1, -2)];

const PAWN_CAPTURE_DIRECTIONS_SIDE = [
    [Direction.NORTH_WEST, Direction.NORTH_EAST],
    [Direction.SOUTH_WEST, Direction.SOUTH_EAST]];

const getPositionInDirection = (position, direction) =>
    POSITION_MAP.get(position.add(direction).serialize());

const findPawnMoves = (piece, position, game) => 
{
    const { board, currentTurn } = game;

    let moveMap = Map();

    const forwardDirection = currentTurn ? Direction.SOUTH : Direction.NORTH;
    const forwardPosition = getPositionInDirection(position, forwardDirection);
    const forwardPiece = board.get(forwardPosition);
    
    if (forwardPosition && forwardPiece === null)
    {
        // pawn promotion
        let forwardMove;

        if(forwardPosition.y === (currentTurn ? 0 : 7))
        {
            forwardMove = game.toPromotionState(piece, position, forwardPosition);
        }
        // normal movement
        else
        {
            forwardMove = game.to(piece, position, forwardPosition);
        }

        if(!forwardMove) return null;
        moveMap = moveMap.set(forwardPosition, forwardMove);

        // double movement
        if (position.y === (currentTurn ? 6 : 1))
        {
            const doubleForwardDirection = currentTurn ? 
                PAWN_DOUBLE_DOWN: PAWN_DOUBLE_UP;
            const doubleForwardPosition = getPositionInDirection(
                position, doubleForwardDirection);
            const doubleForwardPiece = board.get(doubleForwardPosition);

            if (doubleForwardPosition && doubleForwardPiece === null)
            {
                const doubleForwardMove = game.to(piece, position, 
                    doubleForwardPosition);
                if (doubleForwardMove === null) return null;

                moveMap = moveMap.set(doubleForwardPosition, 
                    doubleForwardMove);
            }
        }
    }

    const captureDirections = PAWN_CAPTURE_DIRECTIONS_SIDE[game.currentTurn];

    for (let captureDirection of captureDirections)
    {
        const capturePosition = getPositionInDirection(
            position, captureDirection);
        const capturePiece = board.get(capturePosition);

        if (capturePosition && capturePiece 
            && capturePiece.side !== game.currentTurn)
        {
            let captureMove;

            // capture and promotion
            if(capturePosition.y === (currentTurn ? 0 : 7))
            {
                captureMove = game.toPromotionState(piece, position, capturePosition, 
                    capturePiece);
            }
            //  capture
            else
            {
                captureMove = game.to(piece, position, capturePosition, 
                    capturePiece);
            }

            if(captureMove === null) return null;
            moveMap = moveMap.set(capturePosition, captureMove);
        }
    }

    // super special case: enpassant
    if (
        position.y === (currentTurn ? 3 : 4)
        && game.previous !== null
        && game.previous.toPosition.y === (currentTurn ? 3 : 4)
        && game.previous.fromPosition.y === (currentTurn ? 1 : 6)
        && Math.abs(game.previous.toPosition.x - position.x) === 1
        && game.previous.piece.type === Type.PAWN
    )
    {
        const enpassentPosition = getPositionInDirection(
            game.previous.toPosition, forwardDirection);

        const enpassantMove = game.enpassant(piece, position, 
            enpassentPosition, game.previous.piece, game.previous.toPosition);

        moveMap = moveMap.set(enpassentPosition, enpassantMove);
    }
    
    return moveMap;
}

const findMovesFromLineDirections = (lineDirections, piece, position, game) =>
{

    const { currentTurn, board } = game;

    let moveMap = new Map();

    for (let lineDirection of lineDirections)
    {
        let multiplier = 1;

        while (true)
        {
            const currentDirection = lineDirection.multiply(multiplier);
            const currentPosition = getPositionInDirection(
                position, currentDirection);
            const currentPiece = board.get(currentPosition);

            if (!currentPosition)
            {
                break;                
            } 
            else if (currentPiece)
            {
                if (currentPiece.side !== currentTurn)
                {
                    const currentMove = game.to(piece, position, 
                        currentPosition, currentPiece);
                    if (currentMove === null) return null;
                    moveMap = moveMap.set(currentPosition, currentMove);
                }
                break;
            }
            else 
            {
                const currentMove = game.to(piece, position, currentPosition);
                if (currentMove === null) return null;
                moveMap = moveMap.set(currentPosition, currentMove);
            }
            multiplier += 1;
        }
    }
    return moveMap;
}

const findMovesFromDirections = (directions, piece, position, game) =>
{

    const { currentTurn, board } = game;
    let moveMap = Map();

    for (let direction of directions)
    {
        const currentPosition = getPositionInDirection(position, direction);
        const currentPiece = board.get(currentPosition, direction);

        if (currentPosition && 
            ((currentPiece && currentPiece.side !== currentTurn) 
            || !currentPiece))
        {
            const currentMove = game.to(piece, position, 
                currentPosition, currentPiece);

            if (currentMove === null) return null;
            moveMap = moveMap.set(currentPosition, currentMove);
        }
    }
    return moveMap;
}

const findPawnRegicide = (position, game) => {

    const { board, currentTurn } = game;

    const captureDirections = PAWN_CAPTURE_DIRECTIONS_SIDE[game.currentTurn];

    for (let captureDirection of captureDirections)
    {
        const capturePosition = getPositionInDirection(
            position, captureDirection);
        const capturePiece = board.get(capturePosition);

        if (capturePosition && capturePiece 
            && capturePiece.type == Type.KING
            && capturePiece.side !== game.currentTurn) return true;
    }
    return false;
}

const findRegicideFromLineDirections = (lineDirections, position, game) =>
{
    const { currentTurn, board } = game;

    for (let lineDirection of lineDirections)
    {
        let multiplier = 1;

        while (true)
        {
            const currentDirection = lineDirection.multiply(multiplier);
            const currentPosition = getPositionInDirection(
                position, currentDirection);
            const currentPiece = board.get(currentPosition);

            if (!currentPosition)
            {
                break;
            }
            else if (currentPiece)
            { 
                if (currentPiece.type === Type.KING 
                    && currentPiece.side !== currentTurn) return true; 

                return false;
            }
            multiplier += 1;
        }
    }
    return false;
}

const findRegicideFromDirections = (directions, position, game) =>
{
    const { currentTurn, board } = game;

    for (let direction of directions)
    {
        const currentPosition = getPositionInDirection(position, direction);
        const currentPiece = board.get(currentPosition, direction);

        if (currentPosition && currentPiece 
            && currentPiece.type === Type.KING
            && currentPiece.side !== currentTurn) return true;
    }
    return false;
}


const Piece = function(side, type)
{
    this.side = side;
    this.type = type;
}

export const Type = function(name, value, findMoves, findRegicide)
{
    this.name = name;
    this.value = value;
    this.findMoves = findMoves;
    this.findRegicide = findRegicide;
}

const findKnightMoves = (piece, position, game) => findMovesFromDirections(
    KNIGHT_DIRECTIONS, piece, position, game);
const findKnightRegicide = (position, game) => findRegicideFromDirections(
    KNIGHT_DIRECTIONS, position, game);

const findBishopMoves = (piece, position, game) => findMovesFromLineDirections(
    DIAGONAL_DIRECTIONS, piece, position, game);
const findBishopRegicide = (position, game) => findRegicideFromLineDirections(
    DIAGONAL_DIRECTIONS, position, game);

const findRookMoves = (piece, position, game) => findMovesFromLineDirections(
    NON_DIAGONAL_DIRECTIONS, piece, position, game);
const findRookRegicide = (position, game) => findRegicideFromLineDirections(
    NON_DIAGONAL_DIRECTIONS, position, game);

const findQueenMoves = (piece, position, game) => findMovesFromLineDirections(
    DIRECTIONS, piece, position, game);
const findQueenRegicide = (position, game) => findRegicideFromLineDirections(
    DIRECTIONS, position, game);

const findKingMoves = (piece, position, game) => findMovesFromDirections(
    DIRECTIONS, piece, position, game);
const findKingRegicide = () => false;

Type.PAWN = new Type('Pawn', 1, findPawnMoves, findPawnRegicide);
Type.KNIGHT = new Type('Knight', 3, findKnightMoves, findKnightRegicide);
Type.BISHOP = new Type('Bishop', 3, findBishopMoves, findBishopRegicide);
Type.ROOK = new Type('Rook', 5, findRookMoves, findRookRegicide);
Type.QUEEN = new Type('Queen', 9, findQueenMoves, findQueenRegicide);
Type.KING = new Type('King', null, findKingMoves, findKingRegicide);

export const TYPES = [
    Type.PAWN, Type.KNIGHT, Type.BISHOP, 
    Type.ROOK, Type.QUEEN, Type.KING];

export const PROMOTION_TYPES = [
    Type.QUEEN, Type.ROOK, Type.BISHOP, Type.KNIGHT];

export const Side = { LIGHT: 0, DARK: 1 };

export const STANDARD_PIECE_ARRANGEMENT = {
    '0,0': new Piece(Side.LIGHT, Type.ROOK),
    '1,0': new Piece(Side.LIGHT, Type.KNIGHT),
    '2,0': new Piece(Side.LIGHT, Type.BISHOP),
    '3,0': new Piece(Side.LIGHT, Type.QUEEN),
    '4,0': new Piece(Side.LIGHT, Type.KING),
    '5,0': new Piece(Side.LIGHT, Type.BISHOP),
    '6,0': new Piece(Side.LIGHT, Type.KNIGHT),
    '7,0': new Piece(Side.LIGHT, Type.ROOK),
    '0,1': new Piece(Side.LIGHT, Type.PAWN),
    '1,1': new Piece(Side.LIGHT, Type.PAWN),
    '2,1': new Piece(Side.LIGHT, Type.PAWN),
    '3,1': new Piece(Side.LIGHT, Type.PAWN),
    '4,1': new Piece(Side.LIGHT, Type.PAWN),
    '5,1': new Piece(Side.LIGHT, Type.PAWN),
    '6,1': new Piece(Side.LIGHT, Type.PAWN),
    '7,1': new Piece(Side.LIGHT, Type.PAWN),
    '0,6': new Piece(Side.DARK, Type.PAWN),
    '1,6': new Piece(Side.DARK, Type.PAWN),
    '2,6': new Piece(Side.DARK, Type.PAWN),
    '3,6': new Piece(Side.DARK, Type.PAWN),
    '4,6': new Piece(Side.DARK, Type.PAWN),
    '5,6': new Piece(Side.DARK, Type.PAWN),
    '6,6': new Piece(Side.DARK, Type.PAWN),
    '7,6': new Piece(Side.DARK, Type.PAWN),
    '0,7': new Piece(Side.DARK, Type.ROOK),
    '1,7': new Piece(Side.DARK, Type.KNIGHT),
    '2,7': new Piece(Side.DARK, Type.BISHOP),
    '3,7': new Piece(Side.DARK, Type.QUEEN),
    '4,7': new Piece(Side.DARK, Type.KING),
    '5,7': new Piece(Side.DARK, Type.BISHOP),
    '6,7': new Piece(Side.DARK, Type.KNIGHT),
    '7,7': new Piece(Side.DARK, Type.ROOK)
};

export default Piece;