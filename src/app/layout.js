import "./main.css";

export const metadata = {
	title: "Daily Star",
	description: "Daily Star webpage prototype"
};

export default function Layout({ children }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
