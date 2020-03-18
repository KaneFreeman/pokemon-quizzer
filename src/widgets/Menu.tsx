import { tsx, create } from '@dojo/framework/core/vdom';
import { createICacheMiddleware } from '@dojo/framework/core/middleware/icache';
import Toolbar from '@dojo/widgets/toolbar';

import { generations, generationLookup, Generation } from '../constants';

import * as css from './Menu.m.css';

export interface MenuProperties {
	onGenerationChange: (generations: Generation[]) => void;
}

interface MenuState {
	selectedGenerations: string[];
}

const icache = createICacheMiddleware<MenuState>();
const factory = create({ icache }).properties<MenuProperties>();

export default factory(({ middleware: { icache }, properties }) => {
	const { onGenerationChange } = properties();
	const selectedGenerations = icache.getOrSet('selectedGenerations', []);

	return (
		<div classes={css.root}>
			<Toolbar heading="Pokemon Quizzer!" collapseWidth={1070}>
				<div classes={css.generations}>
					{generations.map((generation) => {
						const rootClasses = [css.generationButton];
						const selected = selectedGenerations.indexOf(generation.name) >= 0;

						let addRemoveOnClick = (event: MouseEvent | undefined) => {
							if (event) {
								event.preventDefault();
								event.stopPropagation();
							}
							const selectedGenerations = icache.getOrSet('selectedGenerations', []);
							if (selectedGenerations.indexOf(generation.name) >= 0) {
								return;
							}
							icache.set('selectedGenerations', [ ...selectedGenerations, generation.name]);
							onGenerationChange(
								icache.getOrSet('selectedGenerations', []).map((generationName) => generations[generationLookup[generationName]])
							);
						};

						if (selected) {
							rootClasses.push(css.selected);
							if (selectedGenerations.length === 1) {
								rootClasses.push(css.onlyGeneration);
							}
							addRemoveOnClick = (event: MouseEvent | undefined) => {
								if (event) {
									event.preventDefault();
									event.stopPropagation();
								}
								const selectedGenerations = icache.getOrSet('selectedGenerations', []);
								if (selectedGenerations.indexOf(generation.name) < 0) {
									return;
								}
								icache.set('selectedGenerations', [ ...selectedGenerations ].splice(selectedGenerations.indexOf(generation.name), 1));
								onGenerationChange(
									icache.getOrSet('selectedGenerations', []).map((generationName) => generations[generationLookup[generationName]])
								);
							}
						}

						return (
							<button
								key={generation.name}
								classes={rootClasses}
								onclick={() => {
									icache.set('selectedGenerations', [generation.name]);
									onGenerationChange([generations[generationLookup[generation.name]]]);
								}}
							>
								{(!selected || selectedGenerations.length > 1) && (
									<button
										key={generation.name}
										classes={css.addButton}
										onclick={addRemoveOnClick}
									>
										<i class="material-icons">{selected ? 'remove' : 'add'}</i>
									</button>
								)}
								{generation.name} - {generation.region}
							</button>
						);
					})}
				</div>
			</Toolbar>
		</div>
	);
});
