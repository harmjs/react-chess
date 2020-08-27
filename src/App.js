import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

import GameNode, { State } from './models/GameNode';
import Vect2d from './models/Vect2d';
import { STANDARD_PIECE_ARRANGEMENT, PROMOTION_TYPES } from './models/Piece'; 

import { POSITION_8X8_2D_ARRAY, } from './constants';
import findPieceSvg from './findPieceSvg';

const CIRCLE_COLOR = '#F4A261';
const TILE_COLORS = ['#2A9D8F', '#264653'];
const SELECTED_TILE_COLORS = ['#F4A261', '#F4A261'];
const MOVED_TILE_COLORS = ['#E4B84C', '#CE9B1E'];

const GlobalStyle = createGlobalStyle`
    html {
    }
    body {
        margin: 0px;
        padding: 0px;
    }
`;

const findTileColor = (colorIndex, isFromPosition, isPreviousPosition) =>
{
    if (isFromPosition)
    {
        return SELECTED_TILE_COLORS[colorIndex];
    }
    if (isPreviousPosition)
    {
        return MOVED_TILE_COLORS[colorIndex];
    }
    return TILE_COLORS[colorIndex];
}

const Container = styled.div`
    display: flex;
    position: relative;
    justify-content: center;
`;

const Chessboard = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: hidden;
`;

const Row = styled.div`
    justify-content: center;
    display: flex;
    padding: 0;
    margin: 0;
    list-style: none;
`;

const Square = styled.div`
    position: relative;
    flex: 1 0 auto;
    height: auto;
    position: relative;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${({ colorIndex, isFromPosition, isPreviousPosition }) =>
        findTileColor(colorIndex, isFromPosition, isPreviousPosition)};
    :before {
        content:'';
        float: left;
        padding-top:100%;
    };
`;

const Piece = styled.img`
    position: absolute;
    height: 100%;
`;

const Circle = styled.div`
    position: absolute;
    height: 20%;
    width: 20%;
    background-color: ${CIRCLE_COLOR};
    border-radius: 100%;
`;

const Overlay = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.25);
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const PromotionType = styled.img`
    opacity: 1;
    width: 25%;
    height: 25%; 
`;

const Tile = ({ 
    onClick, position, piece, isFromPosition, isToPosition, 
    isPreviousPosition }) =>
{
    const colorIndex = (position.x + position.y) % 2;

    return (
        <Square
            onClick={() => onClick(position)}
            isFromPosition={isFromPosition}
            isPreviousPosition={isPreviousPosition}
            colorIndex={colorIndex}
        >
            { 
                piece &&
                    <Piece
                        src={findPieceSvg(piece.type, piece.side)}
                    />
            }
            {
                isToPosition &&
                    <Circle></Circle>
            }
        </Square>
    );
}

const PromotionOverlay = ({ side, onPromotionTypeSelect }) => (
    <Overlay>
        {
            PROMOTION_TYPES.map((type) => (
                <PromotionType
                    src={findPieceSvg(type, side)}
                    onClick={() => onPromotionTypeSelect(type)}
                />  
        ))}
    </Overlay>
);

const STANDARD_GAME_NODE = GameNode.fromPieceArrangement(STANDARD_PIECE_ARRANGEMENT);

const App = () =>
{
    const [gameNode, setGameNode] = useState(STANDARD_GAME_NODE);
    const [fromPosition, setFromPosition] = useState(null);

    const { game, children } = gameNode;

    let handleBoardInput = (position) => console.log(position);
    let toPositionMap = null;

    if (game.state === State.STANDARD)
    {
        const fromPositionMap = children;
        toPositionMap = fromPosition ? children.get(fromPosition) : null;

        handleBoardInput = (inputPosition) =>
        {
            if(fromPosition === null)
            {
                if (fromPositionMap.has(inputPosition))
                {
                    setFromPosition(inputPosition);
                }
            } else
            {
                if (fromPosition === inputPosition)
                {
                    setFromPosition(null);
                } else if (fromPositionMap.has(inputPosition))
                {
                    setFromPosition(inputPosition);
                } else if (toPositionMap.has(inputPosition))
                {
                    setGameNode(gameNode.play(fromPosition, inputPosition));
                    setFromPosition(null);
                }
            }
        }
    }

    const isPreviousPosition = (position) => 
        game.previous !== null
            ? game.previous.toPosition === position
                || game.previous.fromPosition === position
            : false;

    const boardArray = POSITION_8X8_2D_ARRAY
        .map((_) => _
            .map((position) => ({
                position, 
                piece: game.board.get(position)
            })));

    return (
        <Container>
            <GlobalStyle />
            <Chessboard>
                {
                    boardArray.map((_, x) => (
                        <Row
                            key={x}
                        >
                        {
                            _.map(({ position, piece }, y) => (
                                <Tile
                                    key={y}
                                    position={position}
                                    piece={piece}
                                    onClick={handleBoardInput}
                                    isFromPosition={
                                        fromPosition === position}
                                    isToPosition={toPositionMap ? 
                                        toPositionMap.has(position) : null }
                                    isPreviousPosition={
                                        isPreviousPosition(position)}
                                />
                            ))
                        }
                        </Row>
                    ))
                }
            </Chessboard>
            { 
                game.state === State.PROMOTION &&
                    <PromotionOverlay 
                        side={game.currentTurn}
                        onPromotionTypeSelect={(promotionType) => 
                            setGameNode(gameNode.play(promotionType))}
                    />
            }
            {
                (game.state === State.CHECKMATE 
                    || game.state === State.STALEMATE) &&
                    <Overlay>

                    </Overlay>
            }
            
        </Container>
    );
}

export default App;

