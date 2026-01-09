import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug1: string = "";
	if (typeof router.query.id === "string") slug1 = router.query.id;
	var slug2 = "";
	if (typeof router.query.season === "string") slug2 = router.query.season;
	// slug combination
	var slug = slug1;
	if (slug2 !== "") {
		if (slug1 === "") slug = "null;" + slug2;
		else slug = slug1 + ";" + slug2; 
	}
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 0 } subId={ 10 } slug={ slug } key={ slug }/>
	</main>);
}