import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug: { [key: string]: string } = {};
	if (typeof router.query.name === "string") slug["name"] = router.query.name;
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 1 } subId={ 1 } slug={ slug } key={ slug["name"] }/>
	</main>);
}