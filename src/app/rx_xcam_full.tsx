import React, { useState } from 'react'

import { RouterMain, navRM } from './router_main'
import { MenuOpt } from './rx_menu_opt'
import { XcamBoard } from './rx_xcam_board'
import { PlayerBoard } from './rx_player_board'

export function XcamFull(props: { rm: RouterMain }): React.ReactNode
{
	const [menuId, setMenuId] = useState(props.rm.core.subId);
	//const router = useRouter();

	var board = null;
	if (menuId === 0) {
		board = <XcamBoard rm={ props.rm }/>;
	} else if (menuId === 1) {
		board = <PlayerBoard slug={ props.rm.core.slug } key={ props.rm.core.slug }/>;
	}

	const updateMenuId = (i: number) => {
		setMenuId(i);
		if (i === 0) navRM(props.rm, "xcam", "", "");
		else if (i === 1) navRM(props.rm, "xcam", "players", "");
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