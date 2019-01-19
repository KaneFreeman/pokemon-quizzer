const { describe, it } = intern.getInterface('bdd');
import harness from '@dojo/framework/testing/harness';
import { tsx } from '@dojo/framework/widget-core/tsx';

import About from '../../../src/widgets/Pokemon';
import * as css from '../../../src/widgets/About.m.css';

describe('About', () => {
	it('default renders correctly', () => {
		const h = harness(() => <About />);
		h.expect(() => <h1 classes={[css.root]}>About Page</h1>);
	});
});
