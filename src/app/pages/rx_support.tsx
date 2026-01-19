import React from 'react'

import { rawExCellCheck } from "../api_xcam"

export function Support(): React.ReactNode {
	var names = rawExCellCheck(1, 17);
	var nameNode = null;
	if (names !== null) {
		nameNode = <div className="para">
			Shoutouts to monthly supporters { names }! Thank you all so much.
		</div>;
	}
	return <div className="about-cont">
		<div className="para">
			You can support me (Twig64) and my work on the Daily Star
			through my <a className="bright" href="https://ko-fi.com/twig64">Ko-Fi</a> with
			a one-time tip or a recurring membership.
		</div>
		{ nameNode }
	</div>
}