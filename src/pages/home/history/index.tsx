import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug: { [key: string]: string } = {};
	if (typeof router.query.star === "string") slug["star"] = router.query.star;
	if (typeof router.query.season === "string") slug["season"] = router.query.season;
	// slug combination
	/*var slug = slug1;
	if (slug2 !== "") {
		if (slug1 === "") slug = "null;" + slug2;
		else slug = slug1 + ";" + slug2; 
	}*/
	var subId = 3;
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 0 } subId={ subId } slug={ slug } key={ slug["star"] + slug["season"] }/>
	</main>);
}