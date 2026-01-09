import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug: string = "";
	if (typeof router.query.name === "string") slug = router.query.name;
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 4 } subId={ 1 } slug={ slug } key={ slug }/>
	</main>);
}