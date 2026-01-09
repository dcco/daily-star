import React, { useState } from 'react'

import { IdService, keyIdent, rawIdent } from '../time_table'
import { PlayData, newPlayData } from '../play_data'
import { ExColumn } from '../table_parts/ex_column'
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
	idType: IdService
};

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

	const _playTableNodes: [React.ReactNode, number[]][] = [];
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
		_playTableNodes.push([<tr className="time-row" key={ keyIdent(player.id) }>{ playNodes }</tr>, sortObj]);
	}

	// sort players based on activated column
	_playTableNodes.sort(function (_a, _b) {
		const [a, b] = [_a[1], _b[1]];
		// we assume that they always have the same length
		for (let i = 0; i < a.length; i++) {
			if (a[i] === b[i]) continue;
			return a[i] - b[i];
		}
		return 0;
	})
	const playTableNodes = _playTableNodes.map((v) => v[0]);

	// final table
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