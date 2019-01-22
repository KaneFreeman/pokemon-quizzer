import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { tsx } from '@dojo/framework/widget-core/tsx';
import Toolbar from '@dojo/widgets/toolbar';

import { generations, generationLookup, Generation } from '../constants';

import * as css from './Menu.m.css';

export interface MenuProperties {
	onGenerationChange: (generations: Generation[]) => void;
}

interface MenuState {
	selectedGenerations: string[];
}

export class Menu extends WidgetBase<MenuProperties> {
	private _state: MenuState = {
		selectedGenerations: ['Generation I']
	};

	private _generationChange(generationName: string) {
		console.log('set');
		this._state.selectedGenerations = [generationName];
		this.properties.onGenerationChange([generations[generationLookup[generationName]]]);
		this.invalidate();
	}

	private _addGeneration(event: MouseEvent | undefined, generationName: string) {
		console.log('add');
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		const { selectedGenerations } = this._state;
		if (selectedGenerations.indexOf(generationName) >= 0) {
			return;
		}
		this._state.selectedGenerations.push(generationName);
		this.properties.onGenerationChange(
			this._state.selectedGenerations.map((generationName) => generations[generationLookup[generationName]])
		);
		this.invalidate();
	}

	private _removeGeneration(event: MouseEvent | undefined, generationName: string) {
		console.log('remove');
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		const { selectedGenerations } = this._state;
		if (selectedGenerations.indexOf(generationName) < 0) {
			return;
		}
		this._state.selectedGenerations.splice(selectedGenerations.indexOf(generationName), 1);
		this.properties.onGenerationChange(
			this._state.selectedGenerations.map((generationName) => generations[generationLookup[generationName]])
		);
		this.invalidate();
	}

	protected render() {
		const { selectedGenerations } = this._state;

		return (
			<div classes={css.root}>
				<Toolbar heading="Pokemon Quizzer!" collapseWidth={1070}>
					<div classes={css.generations}>
						{generations.map((generation) => {
							const rootClasses = [css.generationButton];
							const selected = selectedGenerations.indexOf(generation.name) >= 0;
							let addRemoveOnClick = (event: MouseEvent | undefined) =>
								this._addGeneration(event, generation.name);
							if (selected) {
								rootClasses.push(css.selected);
								if (selectedGenerations.length === 1) {
									rootClasses.push(css.onlyGeneration);
								}
								addRemoveOnClick = (event: MouseEvent | undefined) =>
									this._removeGeneration(event, generation.name);
							}
							return (
								<button
									key={generation.name}
									classes={rootClasses}
									onclick={() => this._generationChange(generation.name)}
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
	}
}
