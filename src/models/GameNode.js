import { Map as IMap, List as IList, Set as ISet } from 'immutable';  
import { Side, POSITION_MAP, POSITION_8X8_ARRAY, BACKROWS } from '../constants';
import Piece, { Type, PROMOTION_TYPES } from '../models/Piece';

const standardPlay = function(node, fromPosition, toPosition)
{
    const { children } = node; 

    return children.get(fromPosition)
        .get(toPosition).increaseDepth();
}

const standardIncreaseDepth = function(node)
{
    let { children, game } = node;


    if (children === null)
    {
        let fromToPositionMap = IMap();

        const currentPieces = game.pieces.get(game.currentTurn);
        for (let [position, piece] of currentPieces.entries())
        {
            const moveMap = piece.type.findMoves(piece, position, game);
            if (moveMap === null) return null;

            fromToPositionMap = fromToPositionMap.set(position, moveMap);
        }

        const castler = game.castlers.get(game.currentTurn);

        if (castler !== null)
        {
            fromToPositionMap = castler.addCastlingMoves(
                game, fromToPositionMap);
        }

        children = fromToPositionMap
            .map((toPositionMap) => toPositionMap
                .filter((game) => game !== null)
                .map((game) => new GameNode(game, null)));
    }
    else
    {
        children = children
            .map((toPositionMap) => toPositionMap
                .map((node) => node.increaseDepth())
                .filter((node) => node !== null));
        
        const totalMoves = children.reduce(
            (total, toPositionMap) => total + toPositionMap.count(), 0);
        
            if (totalMoves === 0)
        {
            game = game._cloneInstance();
            game.state = game.check ? State.CHECKMATE : State.STALEMATE;
        }
    }

    return new GameNode(game, children);
}

const promotionIncreaseDepth = function(node, type) 
{
    let { children, game } = node;
    
    if (children === null)
    {
        children = IMap();

        for (let promotionType of PROMOTION_TYPES)
        {
            children = children.set(promotionType,
                new GameNode(game.promote(promotionType), null));
        }
    }
    else
    {
        children = children.map(
            (node) => node.increaseDepth());
    }

    return new GameNode(game, children);
};

const promotionPlay = function(node, type)
{
    let { children, game } = node;

    return children.get(type).increaseDepth();
};

export const State = function(play, increaseDepth)
{
    this.play = play;
    this.increaseDepth = increaseDepth;
}

State.STANDARD = new State(standardPlay, standardIncreaseDepth);
State.PROMOTION = new State(promotionPlay, promotionIncreaseDepth);
State.CHECKMATE = new State(() => null, () => null);
State.STALEMATE = new State(() => null, () => null);

const Castler = function(
    leftRookNotMoved, rightRookNotMoved)
{
    this.leftRookMoved = leftRookNotMoved;
    this.rightRookMoved = rightRookNotMoved;
}

Castler.ACTIVE  = new Castler(false, false);
Castler.CASTLERS = IList([Castler.ACTIVE, Castler.ACTIVE]);

Castler.prototype._cloneInstance = function()
{
    return new Castler(
        this.leftRookMoved, 
        this.rightRookMoved);
}

Castler.prototype.update = function(side, fromPosition)
{
    const backRow = BACKROWS[side];

    if (fromPosition === backRow[4])
    {
        return null;
    }
    else if (fromPosition === backRow[0])
    {
        if (this.rightRookMoved) return null;

        const castler = this._cloneInstance();
        castler.leftRookMoved = true;
        
        return castler;
    }
    else if (fromPosition === backRow[7])
    {
        if (this.leftRookMoved) return null;

        const castler = this._cloneInstance();
        castler.rightRookMoved = true;

        return castler;
    }

    return this;
}

Castler.prototype.addCastlingMoves = function(game, fromToPositionMap)
{
    const { board } = game;
    const backrow = BACKROWS[game.currentTurn];

    if (!game.check)
    {
        const kingPiece = board.get(backrow[4]);

        if (!this.leftRookMoved
            && !board.get(backrow[3])
            && !board.get(backrow[2])
            && !board.get(backrow[1])
            && !game.to(kingPiece, backrow[4], backrow[3]).findRegicide()
            && !game.to(kingPiece, backrow[4], backrow[2]).findRegicide())

            fromToPositionMap = fromToPositionMap.update(
                backrow[4], (toPositionMap) => toPositionMap.set(
                    backrow[2],  game.castleLeft()));
        
        if (!this.rightRookMoved
            && !board.get(backrow[5])
            && !board.get(backrow[6])
            && !game.to(kingPiece, backrow[4], backrow[5]).findRegicide()
            && !game.to(kingPiece, backrow[4], backrow[6]).findRegicide())

            fromToPositionMap = fromToPositionMap.update(
                backrow[4], (toPositionMap) => toPositionMap.set(
                    backrow[6], game.castleRight()));
    }  
    return fromToPositionMap;
}

const Game = function(
    state, board, pieces, capturedPieces, 
    currentTurn, previous, castlers, check)
{
    this.state = state;
    this.board = board;
    this.pieces = pieces;
    this.capturedPieces = capturedPieces;
    this.currentTurn = currentTurn;
    this.previous = previous;
    this.castlers = castlers;
    this.check = check;
}

Game.fromPieceArrangement = function(pieceArrangement)
{
    const positionPieceEntries = Object.entries(pieceArrangement)
    .map(([positionKey, piece]) => 
    [POSITION_MAP.get(positionKey), piece]);
    const positionPieceMap = new Map(positionPieceEntries);

    const board = IMap(POSITION_8X8_ARRAY
        .map((position) => [position, positionPieceMap.has(position) 
            ? positionPieceMap.get(position) : null]));

    const pieces = positionPieceEntries
        .reduce((pieces, [position, piece]) => 
            pieces.update(piece.side, (pieceMap) => 
                pieceMap.set(position, piece)),
        IList([IMap(), IMap()]));

    const capturedPieces = IList([ISet(), ISet()]);

    return new Game(State.STANDARD, board, pieces,
        capturedPieces, 0, null, Castler.CASTLERS, null);
}

Game.prototype._cloneInstance = function()
{
    return new Game(this.state, this.board, this.pieces, 
        this.capturedPieces, this.currentTurn, 
        this.previous, this.castlers, this.check);
}

Game.prototype._capturePiece = function(capturedPiece, capturedPosition)
{
    this.capturedPieces = this.capturedPieces.update(
        capturedPiece.side, 
        (pieceSet) => pieceSet.add(capturedPiece));
    
    this.pieces = this.pieces.update(
        capturedPiece.side, (pieceMap) => pieceMap.delete(capturedPosition));
}

Game.prototype._movePiece = function(piece, fromPosition, toPosition)
{
    this.board = this.board
        .set(fromPosition, null)
        .set(toPosition, piece);
    
    this.pieces = this.pieces
        .update(piece.side, (pieceMap) => pieceMap.delete(fromPosition))
        .update(piece.side, (pieceMap) => pieceMap.set(toPosition, piece));
}

Game.prototype._toNextTurn = function()
{
    this.check = this.findRegicide();
    this.currentTurn = (this.currentTurn + 1) % 2;
}

Game.prototype._updateCastler = function(fromPosition)
{
    if (this.castlers.get(this.currentTurn) !== null)
    {
        this.castlers = this.castlers.update(
            this.currentTurn, (castler) => castler.update(
                this.currentTurn, fromPosition));
    }
}

Game.prototype.findRegicide = function()
{
    const currentPieces = this.pieces.get(this.currentTurn);
    for (let [position, piece] of currentPieces.entries())
    {
        if (piece.type.findRegicide(position, this)) return true;
    }
    return false;
}

Game.prototype.to = function(piece, fromPosition, toPosition, capturedPiece)
{
    const game = this._cloneInstance();

    if (capturedPiece) 
    {
        if (capturedPiece.type === Type.KING ) return null;
        game._capturePiece(capturedPiece, toPosition);
    }

    game._movePiece(piece, fromPosition, toPosition);
    game._updateCastler(fromPosition);

    game.previous = { fromPosition, toPosition, piece, game: this };

    game._toNextTurn();

    return game;
}

Game.prototype.enpassant = function(piece, fromPosition, toPosition, 
    capturedPiece, capturedPosition)
{
    const game = this._cloneInstance();
    if (capturedPiece.type === Type.KING) return null;

    game._capturePiece(capturedPiece, capturedPosition);
    game._movePiece(piece, fromPosition, toPosition);

    game.board = game.board.set(capturedPosition, null);

    game.previous = { fromPosition, toPosition, piece, game: this };
    game._toNextTurn();

    return game;
}

Game.prototype.castleRight = function()
{
    const game = this._cloneInstance();

    const backrow = BACKROWS[this.currentTurn];

    const king = game.board.get(backrow[4]);
    const rightRook = game.board.get(backrow[7]);
    
    game._movePiece(king, backrow[4], backrow[6]);
    game._movePiece(rightRook, backrow[7], backrow[5]);
    
    game.previous = { 
        fromPosition: backrow[4], 
        toPosition: backrow[6], 
        piece: king, 
        game: this 
    };

    game.castlers = game.castlers.update(this.currentTurn, () => null);

    game._toNextTurn();

    return game;
}

Game.prototype.castleLeft = function()
{
    const game = this._cloneInstance();

    const backrow = BACKROWS[this.currentTurn];

    const king = game.board.get(backrow[4]);
    const leftRook = game.board.get(backrow[0]);
    
    game._movePiece(king, backrow[4], backrow[2]);
    game._movePiece(leftRook, backrow[0], backrow[3]);
    
    game.previous = { 
        fromPosition: backrow[4], 
        toPosition: backrow[2], 
        piece: king, 
        game: this 
    };

    game.castlers = game.castlers.update(this.currentTurn, () => null);

    game._toNextTurn();

    return game;
}

Game.prototype.promote = function(promotionType)
{
    const game = this._cloneInstance();

    const piece = game.previous.piece;
    const position = game.previous.toPosition;
    const promotedPiece = new Piece(game.currentTurn, promotionType);

    game.board = game.board.set(position, promotedPiece);

    game.pieces = game.pieces.update(piece.side, (pieceMap) => 
        pieceMap.set(position, promotedPiece));

    game.state = State.STANDARD;
    game._toNextTurn();

    return game;
}

Game.prototype.toPromotionState = function(piece, fromPosition, toPosition, 
    capturedPiece)
{
    const game = this._cloneInstance();

    if (capturedPiece) 
    {
        if (capturedPiece.type === Type.KING ) return null;
        game._capturePiece(capturedPiece, toPosition);
    }

    game._movePiece(piece, fromPosition, toPosition);

    game.previous = { toPosition, fromPosition, piece, game: this };
    game.state = State.PROMOTION;

    return game;
}

const GameNode = function(game, children, evaluation = null)
{
    this.game = game;
    this.children = children;
    this.evaluation = evaluation;
}

GameNode.fromPieceArrangement = function(pieceArrangement)
{
    const game = Game.fromPieceArrangement(pieceArrangement);
    return new GameNode(game, null).increaseDepth().increaseDepth();
}

GameNode.prototype.increaseDepth = function()
{
    return this.game.state.increaseDepth(this);
}

GameNode.prototype.play = function(...argvs)
{
    return this.game.state.play(this, ...argvs)
}

export default GameNode;