import {spy} from 'sinon';
import test from 'ava';
import {h, build, Component, Group} from '..';
import renderToString from '../lib/render-to-string';
import {rerender} from '../lib/render-queue';

test('render text', t => {
	class A extends Component {
		render() {
			return 'Hello';
		}
	}

	t.is(renderToString(build(<A/>)), 'Hello');
});

test('receive props', t => {
	class A extends Component {
		render() {
			return this.props.message;
		}
	}

	t.is(renderToString(build(<A message="Hello"/>)), 'Hello');
});

test('receive props in render arguments', t => {
	class A extends Component {
		render(props) {
			return props.message;
		}
	}

	t.is(renderToString(build(<A message="Hello"/>)), 'Hello');
});

test('rerender on new props', t => {
	class Hi extends Component {
		render(props) {
			return `Hello, ${props.name}`;
		}
	}

	const initialTree = build(<Hi name="John"/>);
	t.is(renderToString(initialTree), 'Hello, John');

	const finalTree = build(<Hi name="Michael"/>, initialTree);
	t.is(renderToString(finalTree), 'Hello, Michael');
});

test('render nested component', t => {
	class B extends Component {
		render() {
			return 'Hello';
		}
	}

	class A extends Component {
		render() {
			return <B/>;
		}
	}

	t.is(renderToString(build(<A/>)), 'Hello');
});

test('rerender nested components', t => {
	class C extends Component {
		render() {
			return 'C';
		}
	}

	class B extends Component {
		render() {
			return 'B';
		}
	}

	class A extends Component {
		render(props) {
			const X = props.component === 'B' ? B : C;
			return <X/>;
		}
	}

	const initialTree = build(<A component="B"/>);
	t.is(renderToString(initialTree), 'B');

	const finalTree = build(<A component="C"/>, initialTree);
	t.is(renderToString(finalTree), 'C');
});

test('render children', t => {
	class World extends Component {
		render() {
			return ' World';
		}
	}

	class Hello extends Component {
		render() {
			return 'Hello';
		}
	}

	class HelloWorld extends Component {
		render(props) {
			return (
				<Group>
					{props.children}
				</Group>
			);
		}
	}

	const tree = build((
		<HelloWorld>
			<Hello/>
			<World/>
		</HelloWorld>
	));

	t.is(renderToString(tree), 'Hello World');
});

test('update children', t => {
	class A extends Component {
		render() {
			return 'A';
		}
	}

	class B extends Component {
		render() {
			return 'B';
		}
	}

	class C extends Component {
		render() {
			return 'C';
		}
	}

	const firstTree = build((
		<Group>
			<A/>
			<B/>
		</Group>
	));

	t.is(renderToString(firstTree), 'AB');

	const secondTree = build((
		<Group>
			<A/>
			<B/>
			<C/>
		</Group>
	), firstTree);

	t.is(renderToString(secondTree), 'ABC');

	const thirdTree = build((
		<Group>
			<A/>
		</Group>
	), secondTree);

	t.is(renderToString(thirdTree), 'A');
});

test('render component with missing children', t => {
	class A extends Component {
		render(props) {
			return props.children;
		}
	}

	t.is(renderToString(build(<A/>)), '');
});

test('render optional children', t => {
	class A extends Component {
		render() {
			return 'A';
		}
	}

	class B extends Component {
		render() {
			return 'B';
		}
	}

	class Root extends Component {
		render(props) {
			return (
				<Group>
					{props.a && <A/>}
					{props.b && <B/>}
				</Group>
			);
		}
	}

	const firstTree = build(<Root a b/>);
	t.is(renderToString(firstTree), 'AB');

	const secondTree = build(<Root a/>, firstTree);
	t.is(renderToString(secondTree), 'A');

	const thirdTree = build(<Root/>, secondTree);
	t.is(renderToString(thirdTree), '');
});

test('render different root components', t => {
	class A extends Component {
		render() {
			return 'A';
		}
	}

	class B extends Component {
		render() {
			return 'B';
		}
	}

	// Component -> Component
	t.is(renderToString(build(<A/>, build(<B/>))), 'A');

	// String -> Component
	t.is(renderToString(build(<A/>, build('text'))), 'A');

	// Number -> Component
	t.is(renderToString(build(<A/>, build(10))), 'A');

	// Boolean -> Component
	t.is(renderToString(build(<A/>, build(false))), 'A');

	// Component -> String
	t.is(renderToString(build('text', build(<A/>))), 'text');

	// Component -> Number
	t.is(renderToString(build(10, build(<A/>))), '10');

	// Component -> Boolean
	t.is(renderToString(build(false, build(<A/>))), '');

	// String -> Number
	t.is(renderToString(build(10, build('text'))), '10');

	// String -> Boolean
	t.is(renderToString(build(false, build('text'))), '');

	// Number -> String
	t.is(renderToString(build('text', build(10))), 'text');

	// Number -> Boolean
	t.is(renderToString(build(false, build('text'))), '');
});

test('render with initial state', t => {
	class A extends Component {
		constructor() {
			super();

			this.state = {
				message: 'Hello'
			};
		}

		render() {
			return this.state.message;
		}
	}

	t.is(renderToString(build(<A/>)), 'Hello');
});

test('receive state in render arguments', t => {
	class A extends Component {
		constructor(props) {
			super(props);

			this.state = {
				message: 'Hello'
			};
		}

		render(props, state) {
			return `${state.message} to ${props.name}`;
		}
	}

	t.is(renderToString(build(<A name="Joe"/>)), 'Hello to Joe');
});

test('rerender when state updates', t => {
	let component;

	class A extends Component {
		constructor() {
			super();

			this.state = {
				message: 'Hello'
			};

			component = this;
		}

		render(props, state) {
			return state.message;
		}
	}

	const onUpdate = spy();
	const firstTree = build(<A/>, null, onUpdate);
	t.is(renderToString(firstTree), 'Hello');

	component.setState({message: 'Goodbye'});
	rerender();
	t.true(onUpdate.calledOnce);

	const secondTree = build(<A/>, firstTree);
	t.is(renderToString(secondTree), 'Goodbye');
});

test('store next state and set it only on rerender', t => {
	let component;

	class A extends Component {
		constructor(props) {
			super(props);

			this.state = {
				message: 'Hello'
			};

			component = this;
		}

		render(props, state) {
			return state.message;
		}
	}

	const firstTree = build(<A/>, null);
	t.is(renderToString(firstTree), 'Hello');

	component.setState({message: 'Goodbye'});
	t.is(renderToString(firstTree), 'Hello');

	const secondTree = build(<A/>, firstTree);
	t.is(renderToString(secondTree), 'Goodbye');
});

test('merge pending states', t => {
	let component;

	class A extends Component {
		constructor() {
			super();

			this.state = {
				first: 'Hello',
				second: 'Joe'
			};

			component = this;
		}

		render(props, state) {
			return `${state.first} ${state.second}`;
		}
	}

	const firstTree = build(<A/>, null);
	t.is(renderToString(firstTree), 'Hello Joe');

	const firstCallback = spy();
	const secondCallback = spy();

	component.setState({first: 'Bye'}, firstCallback);
	component.setState({second: 'Ross'}, secondCallback);

	const secondTree = build(<A/>, firstTree);
	t.is(renderToString(secondTree), 'Bye Ross');

	t.true(firstCallback.calledOnce);
	t.true(secondCallback.calledOnce);
	t.true(firstCallback.calledBefore(secondCallback));
});

test('state callbacks', t => {
	let component;

	class A extends Component {
		constructor(props) {
			super(props);

			this.state = {
				message: 'Hello'
			};

			component = this;
		}

		render(props, state) {
			return state.message;
		}
	}

	spy(A.prototype, 'componentDidUpdate');

	const firstTree = build(<A/>);
	t.is(renderToString(firstTree), 'Hello');

	const callback = spy(() => {
		component.setState({
			message: 'Ciao'
		});
	});

	component.setState({
		message: 'Bonjour'
	}, callback);

	const secondTree = build(<A/>, firstTree);
	t.is(renderToString(secondTree), 'Bonjour');
	t.true(callback.calledOnce);
	t.true(callback.calledAfter(A.prototype.componentDidUpdate));

	const thirdTree = build(<A/>, secondTree);
	t.is(renderToString(thirdTree), 'Ciao');
	t.true(callback.calledOnce);
});

test('force render', t => {
	let component;
	let renders = 0;

	class A extends Component {
		constructor() {
			super();

			component = this;
		}

		render() {
			renders++;

			return 'A';
		}
	}

	let tree; // eslint-disable-line prefer-const
	const onUpdate = spy(() => {
		build(<A/>, tree, onUpdate);
	});

	tree = build(<A/>, null, onUpdate);
	t.is(renders, 1);

	component.forceUpdate();
	t.is(renders, 1);

	rerender();
	t.true(onUpdate.calledOnce);
	t.is(renders, 2);
});

test('dont render falsey values', t => {
	class A extends Component {
		render() {
			return (
				<Group>
					{null},{undefined},{false},{0},{NaN}
				</Group>
			);
		}
	}

	t.is(renderToString(build(<A/>)), ',,,0,NaN');
});

test('dont render null', t => {
	t.is(renderToString(build(null)), '');
});

test('dont render undefined', t => {
	t.is(renderToString(build(undefined)), '');
});

test('dont render boolean', t => {
	t.is(renderToString(build(false)), '');
	t.is(renderToString(build(true)), '');
});

test('render NaN as text', t => {
	t.is(renderToString(build(NaN)), 'NaN');
});

test('render numbers as text', t => {
	t.is(renderToString(build(0)), '0');
	t.is(renderToString(build(1)), '1');
});

test('render string', t => {
	t.is(renderToString(build('A')), 'A');
});

test('render functional component', t => {
	const A = () => 'A';

	t.is(renderToString(build(<A/>)), 'A');
});

test('render nested functional components', t => {
	const A = () => 'A';
	const B = () => <A/>;
	const C = () => <B/>;

	t.is(renderToString(build(<C/>)), 'A');
});

test('receive props in functional component', t => {
	const Hi = ({name}) => {
		return `Hi, ${name}`;
	};

	t.is(renderToString(build(<Hi name="John"/>)), 'Hi, John');
});
