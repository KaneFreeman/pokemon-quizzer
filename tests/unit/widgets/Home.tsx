const { describe, it } = intern.getInterface('bdd');
import harness from '@dojo/framework/testing/harness';
import { tsx } from '@dojo/framework/widget-core/tsx';

import Home from '../../../src/widgets/Home';
import * as css from '../../../src/widgets/Home.m.css';

describe('Home', () => {
	it('default renders correctly', () => {
		const h = harness(() => <Home />);
		h.expect(() => <h1 classes={[css.root]}>Home Page</h1>);
	});
});
