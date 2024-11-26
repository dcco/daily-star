import '../app/main.css'
import { MultiBoard } from '../app/rx_multi_board'

export default function() {
	return (<main>
		<div className="header">Daily Star</div>
		<MultiBoard boardId={ 2 }/>
	</main>);
}