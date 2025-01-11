import React from 'react'

export function About(): React.ReactNode {
	return <div className="about-cont">
		<div className="para">
			Daily Star was started on Oct 16, 2023 by MontyVR as a fun, community event
			for practicing individual stars/tasks in Super Mario 64. Daily Star was
			originally run through Google Sheets. The current website for Daily Star
			is created and maintained by Twig64 (dcco on Discord). 
		</div>
		<div className="para">
			This site is very much	UNDER CONSTRUCTION, with several known bugs -
			I apologize for any inconvenience using this site. This project
			is <a className="bright" href="https://github.com/dcco/daily-star">open source
			</a> (in the hopes that if something happens to me the site won't completely die.) 
		</div>
		<div className="para">
			NOTE: If you have problems with submission, try refreshing the page first, this
			fixes most known issues.
		</div>
		<div className="para">
			<div className="h-em">Format:</div>
			<div className="para-inner">Every day, a random star is selected and players have 24 hrs
			to submit the fastest completion possible. In addition to a daily star,
			once a week a 100 coin star is selected, and players have
			the entire week to submit a completion.
			</div>
		</div>
		<div className="para">
			<div className="h-em">Rules:</div>
			<ul>
				<li>Submissions use standard xcam timing.</li>
				<li>Google Account is required to submit times. This is used purely for identification
					purposes. Your e-mail/identity will NEVER be displayed to other users on the site.</li>
				<li>Since the competition is casual/un-monetized, video is not required for submission,
					but highly recommended if setting a top time.</li>
				<li>Daily stars are selected at 4:00am UTC (11pm/12am EST depending on DST).</li>
				<li>Weekly stars are selected at that time on Sunday (Saturday night EST).</li>
				<li>All strats are allowed under the Open column, including strats banned from community xcam sheets.</li>
				<li>Special Triple Jump is NOT allowed.</li>
				<li>Otherwise, standards for submission follow commonly-accepted standards for
					community xcam sheets (codes allowed, etc).</li>
			</ul>
		</div>
		<div className="para">
			<div className="h-em">Xcam Viewer:</div>
			<div className="para-inner">This site also hosts an (unofficial) viewer for the <a className="bright"
					href="https://docs.google.com/spreadsheets/d/1J20aivGnvLlAuyRIMMclIFUmrkHXUzgcDmYa31gdtCI/edit?gid=1663140350">Ultimate Star Sheet
				</a> in a leaderboard format. Column options for submitting to the Daily Star are based on this sheet (with some additions),
				and the sheet times are presented as a useful reference/resource. NOTE: Submissions to the daily star are not
				taken from / stored on this sheet.
			</div>
		</div>
		<div className="para">
			<div className="h-em">Contact:</div>
			<div className="para-inner">
				If you notice errors on the site, feel free to message me on Discord (dcco).
				Professional inquiries can be sent to jxlee904 [at] gmail [dot] com.
			</div>
		</div>
	</div>
}