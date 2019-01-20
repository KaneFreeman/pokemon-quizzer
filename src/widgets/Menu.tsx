import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { tsx } from '@dojo/framework/widget-core/tsx';
import Toolbar from '@dojo/widgets/toolbar';

import { generations, generationLookup, Generation } from '../constants';

import * as css from './Menu.m.css';

export interface MenuProperties {
	onGenerationChange: (generation: Generation) => void;
}

export class Menu extends WidgetBase<MenuProperties> {
	private _generationChange(event: any) {
		this.properties.onGenerationChange(generations[generationLookup[event.target.value]]);
	}

	protected render() {
		return (
			<div classes={css.root}>
				<Toolbar heading="Pokemon Quizzer!" collapseWidth={600}>
					<select key="generation-selection" onchange={this._generationChange} classes={css.select}>
						{generations.map((generation) => (
							<option key={generation.name} value={generation.name}>
								{generation.name} - {generation.region}
							</option>
						))}
					</select>
				</Toolbar>
			</div>
		);
	}
}
