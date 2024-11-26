import playData from './json/player_data.json'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { newIdent } from './time_table'
import { newPlayData } from './play_data'
import { orgStarId, orgStarDef } from './org_star_def'
import { G_SHEET, StarRef, StarStats } from './api_xcam'
import { TimeCell, NameCell } from './rx_star_cell'

const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

export function getStarColor(cat: string | null): string
{
	if (cat === "only:16" || cat === "notin:120") return "n120";
	if (cat === "in:16" || cat === "in:16no") return "c16";
	if (cat === "only:70") return "c70";
	if (cat === "only:120") return "c120";
	if (cat === "only:any" || cat === "only:beg"
		|| cat === "only:70beg" || cat === "only:120beg") return "rare";
	if (cat === null) return "default";
	throw ("Unknown category: " + cat);
}

type DetailTableProps = {
	name: string
}

export function DetailTable(props: DetailTableProps): React.ReactNode
{
	if (G_SHEET.playerMap === null || G_SHEET.stratMap === null
		|| G_SHEET.playerMap.stats[props.name] === undefined) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}

	var playStats = G_SHEET.playerMap.stats[props.name];
	playStats.starList.sort(function (a, b) {
		if (b.allStratPts === a.allStratPts) return b.rank[1] - a.rank[1];
		return b.allStratPts - a.allStratPts;
	});

	// construct the board
	var playTableNodes: React.ReactNode[] = [];
	var ix = 0;
	var fullList: (StarRef | StarStats)[] = playStats.starList.map((x) => x);
	var incompleteList = Object.entries(playStats.incomplete).map((x) => x[1]);
	incompleteList.sort(function(a, b) { return b.total - a.total });
	fullList = fullList.concat(incompleteList);
	for (const starData of fullList)
	{
		// strat data
		var starKey = starData.stageId + "_" + starData.starId;
		if (starData.alt === 1) starKey = starKey + "_alt";
		var starDef = orgStarDef(starData.stageId, orgStarId(starData.stageId, starData.starId));
		var stratData = G_SHEET.stratMap[starKey];
		var recordDat = stratData.recordMap["Open"];
		// calculate star name
		var starName = starKey;
		var alt = starData.alt;
		if (starData.stageId >= 0 && starData.stageId <= 14) {
			starName = PERM[starData.stageId].toUpperCase() + " " + starDef.short[alt];
		} else {
			starName = starDef.short[alt];
		}
		// calculate star color
		var starColor = "default";
		if (starDef.catInfo !== undefined) starColor = getStarColor(starDef.catInfo[alt]);
		// build player row
		var playNodes: React.ReactNode[] = [];
		playNodes.push(<td className="time-cell link-cont" data-active={ true } data-complete={ starData.comp }
			data-sc={ starColor } key="star">{ starName }
			<Link className="link-span" href={ "/xcam?star=" + PERM[starData.stageId] + "_" + starData.starId }></Link></td>);
		// incomplete case
		if (starData.comp === "false") {
			playNodes.push(<td className="time-cell" key="no">-</td>);
			playNodes.push(<td className="time-cell" data-complete="false" key="rank">{ "?/" + starData.total }</td>);
			for (let i = 0; i < 2; i++) {
				playNodes.push(<td className="time-cell" key={ i }>-</td>);
			}
		} else {
			var rankNo = starData.rank[0] + 1;
			playNodes.push(<td className="time-cell" key="no">{ ix + 1 }</td>);
			playNodes.push(<td className="time-cell" key="rank">{ rankNo + "/" + starData.rank[1] }</td>);
			playNodes.push(<td className="time-cell" key="score">{ (starData.allStratPts * 100).toFixed(2) }</td>);
			playNodes.push(<TimeCell timeDat={ starData.allStratTime } verOffset={ stratData.vs }
				active={ false } onClick={ () => {} } hiddenFlag={ false } key="time"/>);
		}
		playNodes.push(<TimeCell timeDat={ recordDat } verOffset={ stratData.vs } complete={ starData.comp }
			active={ false } onClick={ () => {} } hiddenFlag={ false } key="best"/>);
		playTableNodes.push(<tr className="time-row" key={ starKey }>{ playNodes }</tr>);
		ix = ix + 1;
	}

	var pd = newPlayData();
	var playerId = newIdent("xcam", props.name);
	return (
		<div>
		<div className="table-cont">
			<table className="time-table small-table"><tbody>
				<tr className="time-row" key="header">
					<NameCell id={ playerId } pd={ pd } active={ true } onClick={ () => {} } href="/xcam/players"/>
					<td className="time-cell" width="5%">#</td>
					<td className="time-cell" width="10%">Rank</td>
					<td className="time-cell" width="8%">Score</td>
					<td className="time-cell">Time</td>
					<td className="time-cell">Sheet Best</td>
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}

export function PlayerTable(props: {}): React.ReactNode
{
	if (G_SHEET.playerMap === null) return <div></div>;
	var starTotal = G_SHEET.playerMap.total;

	const [sortId, setSortId] = useState(1);

	// perform calcs for board
	var playerList = Object.entries(G_SHEET.playerMap.stats).map((_player) => {
		var [name, player] = _player;
		var total = player.starList.length;
		player.starList.sort(function (a, b) { return b.allStratPts - a.allStratPts; });
		var top30 = 0;
		var top50 = 0;
		var topAll = 0;
		var ix = 0;
		for (const starDat of player.starList) {
			if (ix < 30) top30 = top30 + starDat.allStratPts;
			if (ix < 50) top50 = top50 + starDat.allStratPts;
			topAll = topAll + starDat.allStratPts;
			ix = ix + 1;
		}
		return {
			'name': name,
			'total': total,
			'top30': top30 / 30,
			'top50': top50 / 50,
			'topAll': topAll / starTotal
		};
	});
	playerList.sort(function (a, b) {
		if (sortId === 0) return b.total - a.total;
		else if (sortId === 2) return b.top50 - a.top50;
		else if (sortId === 3) return b.topAll - a.topAll;
		else return b.top30 - a.top30;
	});

	// construct the board
	var pd = newPlayData();
	var playTableNodes: React.ReactNode[] = [];
	for (const data of playerList)
	{
		var playerId = newIdent("xcam", data.name);
		var playNodes: React.ReactNode[] = [];
		playNodes.push(<NameCell id={ playerId } pd={ pd } active={ true } onClick={ () => {} }
			href={ "/xcam/players?name=" + encodeURIComponent(data.name) } key="user"/>);
		playNodes.push(<td className="time-cell" key="total">{ data.total }</td>);
		playNodes.push(<td className="time-cell" key="perc">{ (data.total * 100 / starTotal).toFixed(1) }</td>);
		playNodes.push(<td className="time-cell" key="0">{ (data.top30 * 100).toFixed(2) }</td>);
		playNodes.push(<td className="time-cell" key="1">{ (data.top50 * 100).toFixed(2) }</td>);
		playNodes.push(<td className="time-cell" key="2">{ (data.topAll * 100).toFixed(2) }</td>);
		playTableNodes.push(<tr className="time-row" key={ data.name }>{ playNodes }</tr>);
	}

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);
	return (
		<div>
		<div className="table-cont">
			<table className="time-table small-table"><tbody>
				<tr className="time-row" key="header">
					<td className="time-cell" width="20%">Player</td>
					<td className="time-cell" width="8%" data-active="true"
						onClick={ () => setSortId(0) }>Fill { imgNodeFun(sortId === 0) }</td>
					<td className="time-cell" width="8%">%</td>
					<td className="time-cell" data-active="true" onClick={ () => setSortId(1) }>Best of 30 { imgNodeFun(sortId === 1) }</td>
					<td className="time-cell" data-active="true" onClick={ () => setSortId(2) }>Best of 50 { imgNodeFun(sortId === 2) }</td>
					<td className="time-cell" data-active="true" onClick={ () => setSortId(3) }>Best of All ({ starTotal }) { imgNodeFun(sortId === 3) }</td>
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}

export function PlayerBoard(props: { slug?: string }): React.ReactNode
{
	var initPlayer: string | null = null;
	if (props.slug !== undefined && props.slug !== "") { // && G_SHEET.playerMap !== null
		//if (G_SHEET.playerMap.stats[props.slug] !== undefined)
		initPlayer = decodeURIComponent(props.slug); 
	}

	const [about, setAbout] = useState(false);
	const [player, setPlayer] = useState(initPlayer);
	const router = useRouter();

	/*const updatePlayer = (player: string | null) => {
		setPlayer(player);
		if (player === null) router.push("/xcam/players");
		else router.push("/xcam/players?name=" + encodeURIComponent(player));
	};

	const gotoStar = (stageId: number, starId: string) => {
		router.push("/xcam?star=" + PERM[stageId] + "_" + starId);
	};*/

	var board = null;
	if (player === null) board = <PlayerTable/>;
	else board = <DetailTable name={ player }/>;
	var aboutNode = (<div className="blurb-cont" onClick={ () => setAbout(true) }><div className="para">
			<div className="h-em">[+] Score Calculation</div>
		</div></div>);
	if (about) {
		aboutNode = (<div className="blurb-cont" onClick={ () => setAbout(false) }>
			<div className="para">
				<div className="h-em">[-] Score Calculation</div>
				<div className="para-inner">
					For each star in the Xcam viewer, players are sorted based on their best time
					across all strats (adjusted for version differences). To calculate a score,
					this ordering is turned into a rank. Players are given scores for each star
					based on this rank, and a player's Best X scores are averaged to calculate
					the total score. (Name colors are calculated based on Best of 30 scores).
				</div>
			</div>
			<div className="para">
				<p>Click on a player's name for a detailed break down of scores, click again to return.</p>
				<p>NOTE: This feature is still in BETA, calculation method subject to change, errors may exist.</p>
			</div>
		</div>);
	}
	return (<div>
		{ aboutNode }
		{ board }
	</div>);
}

/*
	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);
	var headerNodes: React.ReactNode[] = nameList.map((name, i) => {
		return (<td className="time-cell" key={ name } data-active={ sortActive.toString() } width={ tdWidth }
			onClick={ () => { if (sortActive) setSortId(i + 1) } }>{ name } { imgNodeFun(sortId === i + 1) }</td>);
	});
	headerNodes.unshift(<td className="time-cell" key="strat" data-active={ sortActive.toString() } width="15%"
		onClick={ () => setSortId(0) }>Strat { imgNodeFun(sortId === 0) }</td>);*/