import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug: string = "";
	if (typeof router.query.star === "string") slug = router.query.star;
	var subId = 3;
	if (slug !== "") subId = 1;
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 0 } subId={ subId } slug={ slug } key={ slug }/>
	</main>);
}