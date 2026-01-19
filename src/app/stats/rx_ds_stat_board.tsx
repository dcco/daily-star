import React, { useState } from 'react'

import { PlayData } from '../play_data'

import { newIdent } from '../time_table'
import { SimpToggle } from '../board_simple/rx_simp_toggle' 
import { totalColumn, percentColumn, bestOfXColumn_DS, best100cColumn_DS, bestCompColumn_DS,
	numDetCol, placementDetCol, scoreDetCol, timeDetCol, rankDetCol,
	rankPtsDetCol, bestStratDetCol, stratPtsDetCol, totalPtsDetCol } from './stat_columns'
import { UserStatMap, FilterCodeList, filterUserStatMap } from './stats_user_map' 
import { UserScoreMetaMap, filterUserMetaMap } from './ds_scoring'
import { ScoreCache, newScoreFilter, getUserDataScoreCache, getRankScoreCache, getDSScoreCache } from './score_cache'
import { PlayerTableProps, PlayerTable } from './rx_player_table'
import { DetailBaseProps, DetailTable } from './rx_detail_table'

	/*
		daily star player board: shows best of X, best 100cs, total score, best of all
	*/

type DS_PBProps = PlayerTableProps & {
	num: number,
	num100: number,
	userMetaMap: UserScoreMetaMap | null,
	starFilter?: FilterCodeList
}

export function DSPlayerBoard(props: DS_PBProps): React.ReactNode
{
	if (props.userMap === null || props.userMetaMap === null) return <div></div>;
	var userMap = props.userMap;
	var userMetaMap = props.userMetaMap;
	if (props.starFilter) {
		userMap = filterUserStatMap(userMap, props.starFilter);
		userMetaMap = filterUserMetaMap(userMetaMap, props.starFilter);
	}
	const starTotal = userMap.starTotal;
	const title100 = props.num100 === 1 ? "100c Pts" : "Best " + props.num100 + " (100c)";
	const colList = [
		totalColumn(userMap, 6),
		percentColumn(userMap, 6),
		bestOfXColumn_DS(userMetaMap, "Best of " + props.num, "best_" + props.num, props.num, 4),
		best100cColumn_DS(userMetaMap, title100, "best100", props.num100, 1),
		bestCompColumn_DS(userMetaMap, "Total", "total", [props.num, 4], [props.num100, 1]),
		bestOfXColumn_DS(userMetaMap, "Best of All (" + starTotal + ")", "all", starTotal, 1)
	];

	return <PlayerTable hrefBase={ props.hrefBase } hrefEx={ props.hrefEx } numCol={ 6 }
		defSortId={ 4 } colList={ colList } userMap={ userMap } idType={ "remote" } pd={ props.pd }/>;
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
		numDetCol("#", 4),
		placementDetCol("?/x", 6),
		timeDetCol("Time", 18, props.altFlag),
		scoreDetCol("Pts", 5, dsScore),
		rankDetCol(props.scoreData, props.scoreFilter, props.id, "Best Rank", 14),
		rankPtsDetCol("Pts", 5, dsScore),
		bestStratDetCol("Best Strat", 14, dsScore),
		stratPtsDetCol("Pts", 5, dsScore),
		totalPtsDetCol("Total Pts", 9, dsScore)
	];

	return <DetailTable hrefBase={ props.hrefBase } hrefEx={ props.hrefEx } id={ props.id }
		defSortId={ 7 } colList={ colList }
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
	rulesFlag: boolean,
	verifFlag: boolean,
	setRulesFlag: (b: boolean) => void,
	setVerifFlag: (b: boolean) => void,
	starFilter?: FilterCodeList,
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
	const [altFlag, setAltFlag] = useState(false);
	const [rulesFlag, setRulesFlag] = [props.rulesFlag, props.setRulesFlag];
	const [verifFlag, setVerifFlag] = [props.verifFlag, props.setVerifFlag];
	const [player, setPlayer] = useState(initPlayer);

	// initialize get appropriate score data
	var userMap: UserStatMap | null = null;
	var userMetaMap: UserScoreMetaMap | null = null;

	const fsx = newScoreFilter(rulesFlag ? "ext" : "rules", false, verifFlag);
	if (props.scoreData !== null) {
		var [_starMap, _userMap] = getUserDataScoreCache(props.scoreData, fsx);
		userMap = _userMap;
		userMetaMap = getDSScoreCache(props.scoreData, fsx);
	}

	// setup toggle nodes
	var toggleNodeList: React.ReactNode[] = [];
	// verification toggle
	toggleNodeList.push(<SimpToggle key="rules" name={ "Allow Extensions*" } state={ rulesFlag }
		toggle={ () => setRulesFlag(!rulesFlag) }/>);
	toggleNodeList.push(<SimpToggle key="verif" name={ "Require Video" } state={ verifFlag }
		toggle={ () => setVerifFlag(!verifFlag) }/>);
	// - detailed table only toggle
	if (player !== null) toggleNodeList.push(
		<div className="toggle-box" key="alt">
			<div className="toggle-button" data-plain="true"
				data-active={ altFlag.toString() } onClick={ () => setAltFlag(!altFlag) }>
				<div className="toggle-inner">Show Alternates</div>
		</div></div>);
	var toggleNode = <div className="row-wrap no-space">{ toggleNodeList }</div>;

	var board = null;
	if (player === null) board = <DSPlayerBoard hrefBase={ props.hrefBase } hrefEx={ props.hrefEx } userMap={ userMap }
		userMetaMap={ userMetaMap } num={ props.num } num100={ props.num100 } starFilter={ props.starFilter } pd={ props.pd }/>;
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