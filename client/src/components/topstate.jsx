import React, { Component } from "react";
import FieldContainer from "./fieldcontainer";
import {createBetList} from "./playerbetcontainer";
import Pot from './pot';
import BoardCards from "./boardcards";
import Board from "./board";
import {rankHandInt} from "../deck";

function getRaceUpdate(props) {
    // console.log(props);
    // console.log(this.state);
    if (props.raceInProgress) {
        let currentTime = Date.now();
        console.log('currentTime in getRaceUpdate', currentTime);
        if (currentTime >= props.raceSchedule['river']) {
            return {
                raceBoard: props.table.game.board,
                raceInProgress: false,
                raceSchedule: null
            }
        } else if (currentTime >= props.raceSchedule['turn']) {
            return {raceBoard: props.table.game.board.slice(0, 4)}
        } else if (currentTime >= props.raceSchedule['flop']) {
            return {raceBoard: props.table.game.board.slice(0, 3)};
        } else { // we are still on the deal. I don't think this ever happens.
            return {raceBoard: []};
        }
    } else {
        return {raceBoard: props.table.game? props.table.game.board : []};
    }
}

export class Table extends Component {
    // props: {table, player, gameInProgress, betWidth, betHeight, tableWidth, tableHeight
    //   raceInProgress: bool, nextCardTurn: datetime, nextStreet: "flop"|"turn"|"river",
    //   raceSchedule: {
    //      'flop': UTC milliseconds time
    //      'turn': UTC milliseconds time
    //      'river': UTC milliseconds time
    //   } | null}
    constructor(props) {
        super(props);
        this.state = {
            raceInProgress: this.props.raceInProgress,
            raceSchedule: this.props.raceSchedule,
        }

        Object.assign(this.state, getRaceUpdate(this.props));
    }

    getPlayerHandRanks(raceBoard) {
        return this.props.table.allPlayers.map(p=>
            p === null || p.cards.length < 1 ?
                '' :
                rankHandInt({cards: p.cards.concat(raceBoard)}).message);
    }
    
    scheduleBoardUpdate() {
        let currentTime = Date.now();
        if (currentTime >= this.state.raceSchedule['river']) {
            this.setState({allInRace: false, raceSchedule: null});
        } else if (currentTime >= this.state.raceSchedule['turn']) {
            setTimeout(()=>{
                this.setState({raceBoard: this.props.table.game.board});
            }, this.state.raceSchedule['river'] - Date.now());
        } else if (currentTime >= this.state.raceSchedule['flop']) {
            setTimeout(()=>{
                this.setState({raceBoard: this.props.table.game.board.slice(0, 4)});
            }, this.state.raceSchedule['turn'] - Date.now());
        } else {
            setTimeout(()=>{
                this.setState({raceBoard: this.props.table.game.board.slice(0, 3)});
            }, this.state.raceSchedule['flop'] - Date.now());
        }
    }
    componentDidMount() {
        if (this.state.raceInProgress) {
            this.scheduleBoardUpdate();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // if allInRace and raceBoard changed, raceBoard was updated by a setTimeout. do next setTimeout.
        if (this.state.raceInProgress && this.state.raceBoard.length > 0 && this.state.raceBoard.length !== prevState.raceBoard.length) {
            this.scheduleBoardUpdate();
        }
    }

    render() {
        // console.log(this.props.raceInProgress, this.props.raceSchedule);
        // console.log(this.state.raceInProgress, this.state.raceSchedule, this.state.raceBoard);
        let board = this.props.table.game? this.props.table.game.board : [];
        let handRanks = this.getPlayerHandRanks(board);
        console.log(board);
        return (
            <div id="table">
                {/*render pot and board*/}
                <div className="group-actions u-full-width">
                    {/*render pot slot (with no number if a game is not in progress)*/}
                    <Pot potAmount={this.props.table.game ? this.props.table.game.pot : null}/>
                    {/* render the board (cards) */}
                    <Board>
                        <BoardCards board={board}/>
                    </Board>
                </div>
                {/* render player bets, hands, names*/}
                <TopState handRanks={handRanks} table={this.props.table} player={this.props.player}
    gameInProgress={this.props.gameInProgress} betWidth={this.props.betWidth}
    betHeight={this.props.betHeight} tableWidth={this.props.tableWidth}
    tableHeight={this.props.tableHeight}/>
            </div>
        );
    }
}


export default class TopState extends Component {
    // constructor(props) {
    //     super(props);
    //     // this.state = {
    //     //     table: transformTable(this.props.table),
    //     //     player: transformPlayer(null, this.props.player),
    //     //     gameInProgress: this.props.gameInProgress,
    //     //     socket: this.props.socket,
    //     //
    //     // }
    // }
    // componentDidMount() {
    //     const socket = this.state.socket;
    //     socket.on('state-snapshot', (data) => {
    //         if (data.table) {
    //             this.setState({
    //                 table: transformTable(data.table)
    //             })
    //         }
    //         if (data.player) {
    //             this.setState((prevState) => {
    //                 return {player: transformPlayer(prevState, data.player)}
    //             })
    //         }
    //         this.setState({gameInProgress: data.gameInProgress});
    //     })
    // }

    render() {
        const playerBets = this.props.table.allPlayers.map(p=>p===null ?0:p.bet);
        return (
            <div>
                <FieldContainer handRanks={this.props.handRanks} allPlayers={this.props.table.allPlayers} fieldWidth={150} fieldHeight={10} fieldsLength={10} tableWidth={this.props.tableWidth} tableHeight={this.props.tableHeight}/>
                {createBetList(playerBets, this.props.tableWidth, this.props.tableHeight, this.props.betWidth, this.props.betHeight)}
            </div>
        );
    }
}


