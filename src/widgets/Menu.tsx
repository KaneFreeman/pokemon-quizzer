import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { tsx } from '@dojo/framework/widget-core/tsx';
import Toolbar from '@dojo/widgets/toolbar';

import { generations, generationLookup, Generation } from '../constants';

import * as css from './Menu.m.css';

export interface MenuProperties {
	correct: number;
	incorrect: number;
	total: number;
	onGenerationChange: (generation: Generation) => void;
}

export class Menu extends WidgetBase<MenuProperties> {
	private _generationChange(event: any) {
		this.properties.onGenerationChange(generations[generationLookup[event.target.value]]);
	}

	protected render() {
		const { correct, incorrect, total } = this.properties;

		return (
			<div classes={css.root}>
				<Toolbar heading="Pokemon Quizzer!" collapseWidth={600}>
					<div key="score" classes={css.score}>
						<div key="total" classes={css.total}>
							{`${total}`}
							<i class="material-icons">bug_report</i>
						</div>
						<div key="correct" classes={css.correct}>
							{`${correct}`}
							<i class="material-icons">done</i>
						</div>
						<div key="incorrect" classes={css.incorrect}>
							{`${incorrect}`}
							<i class="material-icons">close</i>
						</div>
					</div>
					<select key="generation-selection" onchange={this._generationChange}>
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
