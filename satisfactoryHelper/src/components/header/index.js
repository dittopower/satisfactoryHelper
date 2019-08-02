import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

const Header = () => (
	<header class={style.header}>
		<h1>Satisfactory Helper</h1>
		<nav>
			<Link activeClassName={style.active} href="/">Recipe Explorer</Link>
			<Link activeClassName={style.active} href="/profile">Visual Explorer</Link>
			<Link activeClassName={style.active} href="/profile/john">Recipe Manager</Link>
		</nav>
	</header>
);

export default Header;
