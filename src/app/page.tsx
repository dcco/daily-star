import { MultiBoard } from './multiboard'

export const metadata = {
	title: "Daily Star",
	description: "Daily Star webpage prototype"
};

export default function Main() {
	return (
		<main>
			<div className="header">Daily Star</div>
			<MultiBoard/>
		</main>
	);
}