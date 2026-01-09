import React from 'react'

import { G_HISTORY } from '../api_history'

export type SeasonSelProps = {
	seasonId: number | null,
	setSeasonId: (s: number | null) => void
}

export function SeasonSel(props: SeasonSelProps): React.ReactNode
{
	if (G_HISTORY.pastList.length === 0) return "";
	// build options
	const optNodeList: React.ReactNode[] = [];
	optNodeList.push(<option value={ -1 } key={ -1 }>Current</option>);
	for (const season of G_HISTORY.pastList) {
		var seasonId = season.header.season.canon_id;
		optNodeList.push(<option value={ seasonId } key={ seasonId }>Season { seasonId }</option>);
	}
	// wrap season selector
	const setFun = (e: React.ChangeEvent<HTMLSelectElement>) => {
		var i = parseInt(e.target.value);
		if (i === -1) props.setSeasonId(null);
		else props.setSeasonId(i);
	};
	// default season indicator
	var v = -1;
	if (props.seasonId !== null) v = props.seasonId;
	return <div className="stage-select"><select value={ v } onChange={ setFun }>{ optNodeList }</select></div>;
}