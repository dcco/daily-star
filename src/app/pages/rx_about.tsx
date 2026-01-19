import React from 'react'

export function About(): React.ReactNode {
	return <div className="about-cont">
		<div className="para">
			Welcome to Season 4 of the Daily Star! For those who are new,
			the Daily Star is a casual speedrunning event
			for practicing and competing on the 120 indivdual stars in Super Mario 64.
		</div>
		<div className="para">
			<div className="h-em">Format:</div>
			<div className="para-inner">Every day, a random "daily star" is selected
			and players have 24 hrs to submit the fastest completion possible.
			In addition to the daily star, once a week a 100 coin star is selected,
			and players have the entire week to submit a completion. This continues
			until every star and 100 coin from the pool have been selected. After this,
			the season ends and the Daily Star takes a break until the next one begins.
			</div>
		</div>
		<div className="para">
			<div className="h-em">How to Play:</div>
			<div className="para-inner">To play, all you have to do is make an account
			and you can begin playing the star and submitting times to the table on the
			front page.
			</div>
			<div className="para-inner">To make an account, simply click the Log In
			button on the main Daily Star page, and connect a Google account.
			This is used purely for identification purposes.
			Your e-mail/identity will NEVER be displayed to other users on the site,
			you can set a nickname for yourself instead (which can be changed any time).
			</div>
			<ul>
				<li><em className="em-alert">IMPORTANT: If you are a new player to the site, your first submission
					may be buggy (will not accept, not save nickname, etc). This is a known
					issue, for now simply refresh and try to submit again - this works in most cases.</em></li>
				<li>Some stars may ask you to fill out "variant" information (JP/US,
					does Chip Clip, etc). You will not be able to submit until all
					variant information has been filled out.
					Do your best to make this as accurate as possible,
					but if you are unsure of what a variant means it's ok to just put N/A.</li>
				<li>In the submission area there is space to submit a link to a video,
					which is highly recommended.</li>
			</ul>
		</div>
		<div className="para">
			<div className="h-em">Scoring:</div>
			<div className="para-inner">Players are scored on their
			best times achieved for individual stars, as well as on a selection
			of their best times over a weekly (7 day), monthly (28 day), and season-long period.
			</div>
			<div className="para-inner">Daily scores are scored out of 100 pts based on three things:</div>
			<ul>
				<li><em className="em-alert">(60 pts)</em> Overall Time - This score takes everyone's best time submission
					(from allowed strats), ranks them, and points are given propotional to one's rank.
					Ex: If you place 6th out of 6 people, you will receive 10 pts, the next person will
						receive 20 pts, then 30 pts, etc.</li>
				<li>(Given a ranking of X/N, the score may be calculated as 60 * (N + 1 - X) / N).</li> 
				<li><em className="em-alert">(20 pts)</em> Rank Standards - Every strat has a set of "Ranks" that can be achieved
					by meeting certain goal times (Bronze, Silver, Gold, etc). The best rank achieved
					across any strat awards up to 20 pts. These rank standards and their point values
					may be viewed in a modal on the submission page.</li>
				<li><em className="em-alert">(20 pts)</em> Per-Strat Time - Each strat submission is scored as like the score for
					overall time, but scaled to 20 pts, with the best one being added to the total.</li>
			</ul>
			<div className="para-inner">The weekly, monthly, and season-long scores take these individual scores and
				calculate an aggregate score out of 500 pts based on two things:</div>
			<ul>
				<li><em className="em-alert">(400 pts)</em> Best of X -
					A certain number of a player's best scores for the timeframe are taken, averaged, and multiplied by 4
					to give a score out of 400 pts. For a week, the best 5 scores are taken. For a month, the best 14.
					For the entire season, the best 50.
				</li>
				<li><em className="em-alert">(100 pts)</em> Best X (100 Coins) -
					The same, but only 100 coin scores are eligible. This means only 400 pts (80%)
					may be achieved without participating in the 100 coin stars.
					For a week, there can only be one 100 coin. For a month, 2 100 coins are taken.
					For the entire season, the best 6.
				</li>
			</ul>
		</div>
		<div className="para">
			<div className="h-em">Community:</div>
			<div className="para-inner">If you have further questions or would like to get involved
				with the community, feel free to join us in the #daily_star channel at
				the <a className="bright" href="https://discord.gg/hkvxxrK6">SM64 discord</a>.
			</div>
		</div>
		<div className="para">
			<div className="h-em">Misc Rules:</div>
			<ul>
				<li>Submissions use standard xcam timing.</li>
				<li>Since the competition is casual/un-monetized, video is not required for submission,
					but highly recommended, especially if setting a top time.</li>
				<li>Daily stars are selected at 4:00am UTC (11pm/12am EST depending on DST).</li>
				<li>Weekly stars are selected at that time on Sunday (Saturday night EST).</li>
				<li>For the purposes of scoring, certain strats are marked as "Extensions*" and are not
					scored by default. Note that this is different from the Xcam Viewer's set of
					Extension strats, as many strats have been allowed.</li>
				<li>All strats are allowed under the Open column, including strats banned from community xcam sheets,
					but will still not be scored by default.</li>
				<li>Special Triple Jump is NOT allowed.</li>
				<li>Otherwise, standards for submission follow commonly-accepted standards for
					community xcam sheets (codes allowed, etc).</li>
			</ul>
		</div>
		<div className="para">
			<div className="h-em">Background:</div>
			<div className="para-inner">Daily Star was started on Oct 16, 2023 by MontyVR as a fun, community event
			for practicing individual stars/tasks in Super Mario 64. Daily Star was
			originally run through Google Sheets. The current website for Daily Star
			is created and maintained by Twig64 (dcco on Discord).</div>
		</div>
		<div className="para">
			This site is very much UNDER CONSTRUCTION, with several known bugs -
			I apologize for any inconvenience using this site. This project
			is <a className="bright" href="https://github.com/dcco/daily-star">open source
			</a> (in the hopes that if something happens to me the site won't completely die.) 
		</div>
		<div className="para">
			<div className="h-em">Xcam Viewer:</div>
			<div className="para-inner">This site also hosts an (unofficial) viewer for the <a className="bright"
					href="https://docs.google.com/spreadsheets/d/1J20aivGnvLlAuyRIMMclIFUmrkHXUzgcDmYa31gdtCI/edit?gid=1663140350">Ultimate Star Sheet
				</a> in a leaderboard format. Column options for submitting to the Daily Star are based on this sheet (with some additions),
				and the sheet times are presented as a useful reference/resource. NOTE: Submissions to the daily star are not
				taken from / stored on this sheet.
			</div>
			<ul>
				<li>A version of the Xcam Viewer that uses the Daily Star ranks may be found <a className="bright" href="/beta">here</a>.</li>
			</ul>
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