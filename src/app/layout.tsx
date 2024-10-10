
import "./main.css"
import React from 'react'

export const metadata = {
	title: "Daily Star",
	description: "Daily Star webpage prototype"
};

type LayoutProps = {
	"children": React.ReactNode
}

export default function Layout(props: LayoutProps): React.ReactNode {
	return (
		<html lang="en">
			<body>{ props.children }</body>
		</html>
	);
}
