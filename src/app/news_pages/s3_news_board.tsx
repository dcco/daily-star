
export function S3NewsBoard(props: {}): React.ReactNode
{
	return <div className="about-cont">
		<div className="para">
			<div className="h-em">Update:</div>
			Sorry for the late update, life has been in the way.
			Daily Star is on a longer break than anticipated, but my hope is
			that after making the fixes/changes I'm trying to make it shouldn't
			have to go down again for so long. If I work on it diligently it
			should be back up mid-June (but it could be longer).
		</div>
		<div className="para">
			<div className="h-em">Results of Daily Star Survey:</div>
			In the meantime, here are the Daily Star survey results. We had 20 respondents.
		</div>
		<div className="para">
			<div className="h-em">Should Open strats (not viable for runs) or Extension sheet strats
			be allowed when scoring the best time across all strats?</div>
			<div className="chart-cont">
				<img src="/s3_survey/chart1.png"></img>
			</div>
			It seems to be split almost evenly between people who want only Main sheet strats, and
			people who want to allow Extension sheet strats. However, most people do not want all strats to
			be allowed.
		</div>
		<div className="para">
			<div className="h-em">Should the best times for specific strats also be taken into consideration
			for scoring? (EX: 1st place time for an intermediate/beginner strat would get extra points,
			even if it's not good compared to a completion of the "main" strat)</div>
			<div className="chart-cont">
				<img src="/s3_survey/chart2.png"></img>
			</div>
			The majority of people want specific strats to be taken into consideration for scoring.
			Within that group, it seems the majority of people want secondary strats to be weighted a bit less
			than the "fastest" strat.
		</div>
		<div className="para">
			<div className="h-em">Should any stars be given special consideration for scoring?
			(Ex: hard stars [carpetless/island hop], non main category stars [solo thwomp/solo SL reds]) /
			Any other thoughts on how strat scoring should be implemented?</div>
			These were free response questions. The most common request was special consideration for 100 coin stars.
			Few mentioned special consideration for stars based on the specific type of star (like in the
			examples given by the question), but a few mentioned consideration for longer stars or
			stars with more/less competition in general. However, other than the 100 coins,
			it generally seems people do not want special treatment of stars. 
		</div>
		<div className="para">
			<div className="h-em">While scoring for the entire season, how many stars (out of 122) should be considered?
			(How much participation should be mandatory for complete score)</div>
			<div className="chart-cont">
				<img src="/s3_survey/chart3.png"></img>
			</div>
			A completion rate of around 35-60 seems to be favored.
		</div>
		<div className="para">
			<div className="h-em">In addition to scoring for the entire season, scoring may be implemented for
			select portions of the season. If this was implemented, what would be most interesting?</div>
			<div className="chart-cont">
				<img src="/s3_survey/chart4.png"></img>
			</div>
			Scoring based on monthly results (every 4 weeks) seems to be by far the most popular option,
			with weekly scoring being secondary. I will try to implement all three, but use of monthly
			results is more likely to be used for short-form competitions, etc that we might do.
		</div>
		<div className="para">
			<div className="h-em">Any other thoughts for seasonal scoring? / Any other feedback / ideas / thoughts?</div>
			People seem mostly satisfied with how scoring has been, with most requests concerning
			more user stats / history info - which of course I plan to work on anyway :)
		</div>
		<div className="para">
			<div className="h-em">Other:</div>
			Even if I didn't mention your feedback I still read it and have it in consideration. As always
			my focus is on fixing major issues / getting core features up and running. However, I'm
			open to feedback even while the season is ongoing. If you have any other requests / feedback
			feel free to reach out to me @dcco on Discord, or in the #daily-star channel in the SM64 Discord.
			Once again, Thanks for playing the Daily Star.
		</div>

	</div>
}