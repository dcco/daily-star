import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug: { [key: string]: string } = {};
	if (typeof router.query.id === "string") slug["id"] = router.query.id;
	if (typeof router.query.season === "string") slug["season"] = router.query.season;
	if (typeof router.query.week === "string") slug["week"] = router.query.week;
	// slug combination
	/*var slug = slug1;
	if (slug2 !== "") {
		if (slug1 === "") slug = "null;" + slug2;
		else slug = slug1 + ";" + slug2; 
	}*/
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 0 } subId={ 11 } slug={ slug } key={ slug["id"] + slug["season"] + slug["week"] }/>
	</main>);
}