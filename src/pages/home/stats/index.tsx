import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug: string = "";
	if (typeof router.query.id === "string") slug = router.query.id;
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 0 } subId={ 4 } slug={ slug } key={ slug }/>
	</main>);
}