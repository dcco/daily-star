import React, { useState } from 'react'

import { PlayData } from '../play_data'

import { newIdent } from '../time_table'
import { VerifToggle } from '../board_simple/rx_verif_toggle' 
import { totalColumn, percentColumn, bestOfXColumn, best100cColumn, bestCompColumn,
	numDetCol, scoreDetCol, timeDetCol, rankDetCol,
	rankPtsDetCol, bestStratDetCol, stratPtsDetCol, totalPtsDetCol } from './stat_columns'
import { UserStatMap } from './stats_user_map' 
import { ScoreCache, newScoreFilter, getUserDataScoreCache, getRankScoreCache, getDSScoreCache } from './score_cache'
import { PlayerTableProps, PlayerTable } from './rx_player_table'
import { DetailBaseProps, DetailTable } from './rx_detail_table'

	/*
		daily star player board: shows best of X, best 100cs, total score, best of all
	*/

type DS_PBProps = PlayerTableProps & {
	num: number,
	num100: number,
	starFilter?: (f: UserStatMap) => UserStatMap
}

export function DSPlayerBoard(props: DS_PBProps): React.ReactNode
{
	if (props.userMap === null) return <div></div>;
	var userMap = props.userMap;
	if (props.starFilter) userMap = props.starFilter(userMap);
	const starTotal = userMap.starTotal;
	const title100 = props.num100 === 1 ? "100c Pts" : "Best " + props.num100 + " (100c)";
	const colList = [
		totalColumn(userMap),
		percentColumn(userMap),
		bestOfXColumn(userMap, "Best of " + props.num, "best_" + props.num, props.num, true),
		best100cColumn(userMap, title100, "best100", props.num100),
		bestCompColumn(userMap, "Total", "total", props.num, props.num100),
		bestOfXColumn(userMap, "Best of All (" + starTotal + ")", "all", starTotal, true)
	];

	return <PlayerTable hrefBase={ props.hrefBase } hrefEx={ props.hrefEx }
		defSortId={ 2 } colList={ colList } userMap={ userMap } idType={ "remote" } pd={ props.pd }/>;
}

	/*
		xcam detail board: shows # (note: rank (x/X)), base score, base time (note: sheet best), rank bonus, rank
	*/

export function DSDetailBoard(props: DetailBaseProps & { showStd?: boolean }): React.ReactNode
{
	if (props.scoreData === null || props.scoreData.dsScore === null) {
		return <div className="blurb-cont"><div className="para">Error while calculating score.</div></div>;
	}

	const scoreData = props.scoreData;
	const dsScore = getDSScoreCache(scoreData, props.scoreFilter);

	const colList = [
		numDetCol("#", 5),
		scoreDetCol("Base", 6, dsScore),
		timeDetCol("Time", 20, props.altFlag),
		rankPtsDetCol("Rank", 6, dsScore),
		rankDetCol(props.scoreData, props.scoreFilter, props.id, "Best Rank", 15),
		stratPtsDetCol("Strat", 6, dsScore),
		bestStratDetCol("Best Strat", 15, dsScore),
		totalPtsDetCol("Total Pts", 10, dsScore)
	];

	return <DetailTable hrefBase={ props.hrefBase } hrefEx={ props.hrefEx } id={ props.id } colList={ colList }
		altFlag={ props.altFlag } scoreFilter={ props.scoreFilter } scoreData={ props.scoreData }
		starFilter={ props.starFilter } pd={ props.pd } wideFlag={ true }/>;
}

	/*
		complete daily star player board - adds:
		- toggles
		- detail view
	*/

type DS_SBProps = {
	idSlug: string | null,
	hrefBase: [string, string],
	hrefEx?: string,
	num: number,
	num100: number,
	aboutNode: React.ReactNode,
	scoreData: ScoreCache | null,
	defVerif: boolean,
	starFilter?: (f: UserStatMap) => UserStatMap,
	pd?: PlayData
};

export function DSStatBoard(props: DS_SBProps): React.ReactNode
{
	// load slug information
	var initPlayer: string | null = props.idSlug;
	/*if (props.slug !== undefined && props.slug !== "") {
		const sll = props.slug.split(";");
		if (sll[0] !== "null") initPlayer = decodeURIComponent(sll[0]);
	}*/

	// setup flags
	const [splitFlag, setSplitFlag] = useState(false);
	const [altFlag, setAltFlag] = useState(false);
	const [verifFlag, setVerifFlag] = useState(props.defVerif);
	const [player, setPlayer] = useState(initPlayer);

	// initialize get appropriate score data
	var userMap: UserStatMap | null = null;

	const fsx = newScoreFilter(false, splitFlag, verifFlag);
	if (props.scoreData !== null) {
		var [_starMap, _userMap] = getUserDataScoreCache(props.scoreData, fsx);
		userMap = _userMap;
	}

	// setup toggle nodes
	var toggleNodeList: React.ReactNode[] = [];
	// verification toggle
	toggleNodeList.push(<div className="toggle-box slight-margin" key="verif">
		<div className="toggle-button" data-plain="true"
			data-active={ verifFlag.toString() } onClick={ () => setVerifFlag(!verifFlag) }>
			<div className="toggle-inner">Require Video</div>
		</div></div>);
	/*toggleNodeList.push(<div className="toggle-box slight-margin" key="split">
		<div className="toggle-button" data-plain="true"
			data-active={ splitFlag.toString() } onClick={ () => setSplitFlag(!splitFlag) }>
			<div className="toggle-inner">Split Offset Stars</div>
		</div></div>);*/
	/*
		TODO: Allow this, but for "rules" instead
	toggleNodeList.push(<div className="toggle-box slight-margin" key="ext">
		<div className="toggle-button" data-plain="true"
			data-active={ extFlag.toString() } onClick={ () => setExtFlag(!extFlag) }>
			<div className="toggle-inner">Allow Extensions</div>
		</div></div>);
	*/
	// - detailed table only toggle
	if (player !== null) toggleNodeList.push(
		<div className="toggle-box" key="alt">
			<div className="toggle-button" data-plain="true"
				data-active={ altFlag.toString() } onClick={ () => setAltFlag(!altFlag) }>
				<div className="toggle-inner">Show Alternates</div>
		</div></div>);
	var toggleNode = <div className="row-wrap no-space">{ toggleNodeList }</div>;

	var board = null;
	if (player === null) board = <DSPlayerBoard hrefBase={ props.hrefBase } hrefEx={ props.hrefEx }
		userMap={ userMap } num={ props.num } num100={ props.num100 } starFilter={ props.starFilter } pd={ props.pd }/>;
	else board = <DSDetailBoard hrefBase={ props.hrefBase } hrefEx={ props.hrefEx } id={ newIdent("remote", player) }
		altFlag={ altFlag } starFilter={ props.starFilter } scoreFilter={ fsx } scoreData={ props.scoreData } pd={ props.pd }/>;
		/*  */
	return (<div>
		{ props.aboutNode }
		<div className="row-wrap">
			<div className="toggle-sidebar big-indent">
				{ toggleNode }
			</div>
		</div>
		{ board }
	</div>);
}