import React, { useState } from 'react'
import { useRouter } from 'next/navigation' 

import { MenuOpt } from './rx_menu_opt'
import { XcamBoard } from './rx_xcam_board'
import { PlayerBoard } from './rx_player_board'

export function XcamFull(props: { subId: number, slug?: string }): React.ReactNode
{
	const [menuId, setMenuId] = useState(props.subId);
	const router = useRouter();

	var board = null;
	if (menuId === 0) {
		board = <XcamBoard slug={ props.slug }/>;
	} else if (menuId === 1) {
		board = <PlayerBoard slug={ props.slug }/>;
	}

	const updateMenuId = (i: number) => {
		setMenuId(i);
		if (i === 0) router.push("/xcam");
		else if (i === 1) router.push("/xcam/players");
	};

	return (<React.Fragment>
		<div className="menu-cont">
			<MenuOpt id={ 0 } selId={ menuId } setSelId={ updateMenuId }>Times</MenuOpt>
			<MenuOpt id={ 1 } selId={ menuId } setSelId={ updateMenuId }>Players</MenuOpt>
		</div>
		<div className="sep"><hr/></div>
		{ board }	
	</React.Fragment>);
}