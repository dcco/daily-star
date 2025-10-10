import '../../../app/main.css'
import { useRouter } from 'next/router'
import { MultiBoard } from '../../../app/rx_multi_board'

export default function() {
	const router = useRouter();
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 0 } subId={ 6 }/>
	</main>);
}