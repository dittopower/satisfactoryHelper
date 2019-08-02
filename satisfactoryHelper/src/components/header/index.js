import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

const Header = () => (
	<header class={style.header}>
		<h1>Satisfactory Helper</h1>
		<nav>
			<Link activeClassName={style.active} href="/">Search</Link>
			<Link activeClassName={style.active} href="/explore">Recipe Explorer</Link>
			<Link activeClassName={style.active} href="/visual">Visual Explorer</Link>
			<Link activeClassName={style.active} href="/manager">Recipe Manager</Link>
		</nav>
	</header>
);

export default Header;
