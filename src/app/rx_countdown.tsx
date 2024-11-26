import React, { useState, useEffect } from 'react'

export function Countdown(props: { endTime: number }): React.ReactNode
{
	var [checkTime, setCheckTime] = useState(Date.now());
	var remTime = props.endTime - Date.now();

	useEffect(() => {
		if (remTime > 0) { setTimeout(() => setCheckTime(Date.now()), 990) }
	}, [checkTime]);

	var timeText = "Refresh for New Star!";
	if (remTime > 0) {
		var rawSec = Math.floor(remTime / 1000);
		var days = Math.floor(rawSec / (60 * 60 * 24));
		var hour = Math.floor(rawSec / (60 * 60)) % 24;
		var min = Math.floor(rawSec / 60) % 60;
		var seconds = rawSec % 60;
		if (days > 0) timeText = "Time to Next Star: " + days + "d " + hour + "h " + min + "m " + seconds + "s";
		else if (hour > 0) timeText = "Time to Next Star: " + hour + "h " + min + "m " + seconds + "s";
		else if (min > 0) timeText = "Time to Next Star: " + min + "m " + seconds + "s";
		else timeText = "Time to Next Star: " + seconds + "s";
	}

	return <div className="label-cont minor-label">{ timeText }</div>;
}