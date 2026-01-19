import React, { useState } from 'react'

import { IdService, keyIdent, rawIdent } from '../time_table'
import { PlayData, newPlayData } from '../play_data'
import { ExColumn, lexicoSortFun } from '../table_parts/ex_column'
import { NameCell } from '../table_parts/rx_star_cell'
import { UserStatMap } from './stats_user_map'

	/*
		a generic board that shows score / stat data for every player
	*/

export type PlayerTableProps = {
	hrefBase: [string, string],
	hrefEx?: string,
	userMap: UserStatMap | null,
	pd?: PlayData
};

export type PlayerTableDef = PlayerTableProps & {
	defSortId: number,
	colList: ExColumn[],
	idType: IdService,
	numCol?: number
};

function sortEq(a: number[], b: number[]): boolean
{
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

export function PlayerTable(props: PlayerTableDef): React.ReactNode
{
	const [hrefMain, _hrefStar] = props.hrefBase;
	const userMap = props.userMap;
	if (userMap === null) return <div></div>;

	// sort-ability
	const [sortId, setSortId] = useState(props.defSortId);

	const imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);

	// construct header
	const headerNodes: React.ReactNode[] = [<td className="time-cell" width="20%" key="player">Player</td>];
	props.colList.map((col, i) => {
		if (col.widthRec !== undefined) {
			headerNodes.push(<td className="time-cell" width={ col.widthRec + "%" } key={ col.key }
				data-active="true" onClick={ () => setSortId(i) }>{ col.name } { imgNodeFun(sortId === i) }</td>);
		} else {
			headerNodes.push(<td className="time-cell" key={ col.key } data-active="true"
				onClick={ () => setSortId(i) }>{ col.name } { imgNodeFun(sortId === i) }</td>);
		}
	});

	// construct main player rows (collect w/ index for sorting)
	var pd = newPlayData();
	if (props.pd !== undefined) pd = props.pd;

	const _playTableNodes: [React.ReactNode[], number[]][] = [];
	for (const _player of Object.entries(userMap.stats)) {
		const player = _player[1];
		var sortObj: number[] = [];
		var playNodes: React.ReactNode[] = [];
		// name cell w/ URL
		var hrefX = "name";
		if (props.idType === "remote") hrefX = "id";
		var hrefMainPrefix = props.hrefEx ? hrefMain + "?" + props.hrefEx + "&" : hrefMain + "?";
		playNodes.push(<NameCell id={ player.id } pd={ pd } active={ true } onClick={ () => {} }
			href={ hrefMainPrefix + hrefX + "=" + encodeURIComponent(rawIdent(player.id)) } key="user"/>);

		// construct row cells
		props.colList.map((col, i) => {
			const [node, colSortObj] = col.dataFun(player.id);
			if (i === sortId) sortObj = colSortObj;
			playNodes.push(node);
		})
		_playTableNodes.push([playNodes, sortObj]);
	}

	// sort players based on activated column
	_playTableNodes.sort(function (a, b) {
		return lexicoSortFun(a[1], b[1]);
	})

	// add number column when relevant
	if (props.numCol) {
		var w = props.numCol;
		headerNodes.splice(1, 0, <td className="time-cell" width={ w + "%" } key="no">#</td>);
		var num = 0;
		var trueNum = 0;
		var prevSortObj: number[] = [];
		for (const [playTableRow, sortObj] of _playTableNodes) {
			trueNum = trueNum + 1;
			if (!sortEq(prevSortObj, sortObj)) num = trueNum;
			playTableRow.splice(1, 0, <td className="time-cell" key="no">{ num }</td>);
			prevSortObj = sortObj;
		}
	}

	// final table
	const playTableNodes = _playTableNodes.map((v, i) =>
		<tr className="time-row" key={ i }>{ v[0] }</tr>
	);
	return (
		<div className="table-cont">
			<table className="time-table small-table"><tbody>
				<tr className="time-row" key="header">
					{ headerNodes }	
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
	);
}