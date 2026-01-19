import '../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	var slug: string | undefined = "";
	if (typeof router.query.star === "string") slug = router.query.star;
	return (<main>
		<div className="header">Support</div>
		<MultiBoard boardId={ 5 } slug={ slug } key={ slug }/>
	</main>);
}