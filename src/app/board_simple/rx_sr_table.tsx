import { RANK_NAME_LIST } from "../standards/rank_const"
import { G_SHEET } from "../api_xcam"

import React, { useState } from 'react'

import { TimeDat, zeroVerOffset } from "../time_dat"
import { StarDef } from "../org_star_def"
import { lookupStarMapW } from "../star_map"
import { SimpleTimeCell, TimeCell } from "../table_parts/rx_star_cell"
import { RankList } from "../standards/rank_list"
import { StarRankSet } from "../standards/star_rank_set"

import { RANK_PTS } from "../stats/ds_scoring"

type SingleRankProps = {
	"stratSet": StarRankSet,
	"stratList": string[],
	"showPts"?: boolean
}

export function SingleRankTable(props: SingleRankProps): React.ReactNode
{
	var stratSet = props.stratSet;
	var stratList = props.stratList;

	// calculate spacing
	var stratEx = 140;
	if (stratList.length > 4) stratEx = 110;
	//var minWidth = (stratList.length * stratEx) + 80;
	var minWidth = (stratList.length * stratEx) + 110;
	var nd = Math.ceil(110 * 100 / minWidth);
	//var tdWidth = 85 / stratList.length;
	var tdWidth = (100 - nd) / stratList.length;

	// build the spacing + header row
	var sxNodeList: React.ReactNode[] = [];
	var headerNodeList: React.ReactNode[] = [];
	stratList.map((stratName, i) => {
		sxNodeList.push(<col key={ i } width={ "" + tdWidth + "%" }/>);
		headerNodeList.push(<td key={ i } className="time-cell"><div className="buffer-cont">{ stratName }</div></td>);
	});
	sxNodeList.unshift(<col key="s" width={ nd + "%" }/>);
	headerNodeList.unshift(<td key="s" className="time-cell">Strat</td>);
	// for each rank
	var rowNodeList: React.ReactNode[] = [];
	for (const rankDef of RANK_NAME_LIST) {
		// we start with the rank name node
		var [rankName] = rankDef;
		var showName = rankName;
		if (props.showPts === true) showName = rankName + " (" + RANK_PTS[rankName] + ")";
		var rankNode = <td key="rank" className="rank-name" data-ps={ rankName }><div className="buffer-cont">{ showName }</div></td>;
		// for each strat, get a time node
		var colNodeList: React.ReactNode[] = [];
		stratList.map((stratName, i) => {
			var rankList = stratSet[stratName];
			var rankObj = rankList.times[rankName];
			// get alt version when relevant
			var altTime: [number, string] | undefined = undefined;
			if (rankObj.sr !== "none" && rankObj.time.alt !== null) {
				altTime = rankObj.time.alt;
			}
			// build column node
			if (rankObj.sr === "none") {
				colNodeList.push(<td key={ i } className="dark-cell"></td>);
			} else {
				colNodeList.push(<SimpleTimeCell key={ i } time={ rankObj.time.time } alter={ false } altTime={ altTime }/>);
			}
			//stNodeList.push(<SingleRankTable key={ i } stratName={ stratName } rankList={ rankList }/>);
		});
		// build full row node
		rowNodeList.push(<tr key={ rankName } className="time-row">{ rankNode }{ colNodeList }</tr>);
	}
	return <div className="rank-table-cont">
		<table className="rank-table" style={{ minWidth: "" + minWidth + "px" }}>
			<colgroup>{ sxNodeList }</colgroup><tbody>
			<tr key="header" className="time-row">{ headerNodeList }</tr>
			{ rowNodeList }
		</tbody></table></div>;

}

type SRTableProps = {
	"stageId": number,
	"starDef": StarDef,
	"stratList": string[][],
	"showPts"?: boolean
}

export function StratRankTable(props: SRTableProps): React.ReactNode
{
	const starDef = props.starDef;
	var stratList = props.stratList;
	// show state
	const [showFlag, setShowFlag] = useState(false);
	if (!showFlag) {
		return <div className="rank-wrap"><div className="rank-cont">
			<div className="rank-cont-toggle" onClick={ () => setShowFlag(true) }>[+] Rank Standards</div>
		</div></div>
	}
	// lookup strat map for star
	const stratSet = lookupStarMapW(G_SHEET.srMap, starDef);
	if (stratSet === null) return <div></div>;
	//var starKey = props.stageId + "_" + starDef.id;
	//if (G_SHEET.srMap[starKey] === undefined) return <div></div>;
	//var stratSet = G_SHEET.srMap[starKey];
	// filter strats if necessary
	stratList = stratList.map((sl) => sl.filter((name) => stratSet[name] !== undefined));
	var altTable: React.ReactNode = "";
	if (stratList.length > 1) altTable = <SingleRankTable stratSet={ stratSet } stratList={ stratList[1] } showPts={ props.showPts }/>;
	return <div className="rank-wrap"><div className="rank-cont" data-open="true">
		<div className="rank-cont-toggle" onClick={ () => setShowFlag(false) }>[-] Rank Standards</div>
		<div className="center-cont">
			<SingleRankTable stratSet={ stratSet } stratList={ stratList[0] } showPts={ props.showPts }/>
			{ altTable }
		</div>
	</div></div>;
}
