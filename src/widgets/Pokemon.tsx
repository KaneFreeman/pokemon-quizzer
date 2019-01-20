import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { tsx } from '@dojo/framework/widget-core/tsx';
import diffProperty from '@dojo/framework/widget-core/decorators/diffProperty';
import Button from '@dojo/widgets/button';
import { idByNameAll, dataByIdAll } from '../App';

import * as css from './Pokemon.m.css';

export interface PokemonProperties {
	data: PokemonData;
	evolutionChain?: PokemonEvolutionChain;
	options?: PokemonData[];
	onAnswer: (correct: boolean) => void;
	next: () => void;
}

interface PokemonState {
	revealed: boolean;
	answer?: string;
	correct?: boolean;
}

export interface PokemonData {
	id: number;
	name: string;
	types: PokemonType[];
	sprites: PokemonSprites;
	speciesData: PokemonSpeciesData;
}

export interface PokemonSpeciesData {
	flavor_text: string;
	genus: string;
	name: string;
	evolution_chain: { url: string };
}

interface PokemonType {
	slot: number;
	type: {
		name: string;
		url: string;
	};
}

interface PokemonSprites {
	front_default: string;
}

export interface PokemonEvolutionChain {
	id: number;
	chain: PokemonEvolutionChainLink;
}

export interface PokemonEvolutionChainLink {
	evolution_details: PokemonEvolutionDetails;
	evolves_to: PokemonEvolutionChainLink[];
	species: {
		name: string;
	};
}

interface PokemonEvolutionDetails {}

const types: { [name: string]: string } = {
	normal: css.typeNormal,
	fighting: css.typeFighting,
	flying: css.typeFlying,
	poison: css.typePoison,
	ground: css.typeGround,
	rock: css.typeRock,
	bug: css.typeBug,
	ghost: css.typeGhost,
	steel: css.typeSteel,
	fire: css.typeFire,
	water: css.typeWater,
	grass: css.typeGrass,
	electric: css.typeElectric,
	psychic: css.typePsychic,
	ice: css.typeIce,
	dragon: css.typeDragon,
	dark: css.typeDark,
	fairy: css.typeFairy
};

export class Pokemon extends WidgetBase<PokemonProperties> {
	private _state: PokemonState = {
		revealed: false
	};

	private _getTypeClass(typeName: string): string {
		return types[typeName];
	}

	private _onSubmit(id: number) {
		const { data } = this.properties;

		let correct = false;
		if (id === data.id) {
			correct = true;
		}

		this.properties.onAnswer(correct);
		this._state.revealed = true;
		this._state.correct = correct;
		this.invalidate();
	}

	private _getPokemonDisplayNameFromName(name: string) {
		return dataByIdAll[idByNameAll[name]].speciesData.name;
	}

	private _getEvolution(
		target: string,
		chainLink: PokemonEvolutionChainLink,
		parentLink?: PokemonEvolutionChainLink
	): { from?: string; to: string[] } | undefined {
		if (chainLink.species.name === target) {
			return {
				from: parentLink ? this._getPokemonDisplayNameFromName(parentLink.species.name) : undefined,
				to: chainLink.evolves_to.map((childChainLink) =>
					this._getPokemonDisplayNameFromName(childChainLink.species.name)
				)
			};
		}

		for (let childChainLink of chainLink.evolves_to) {
			const response = this._getEvolution(target, childChainLink, chainLink);
			if (response) {
				return response;
			}
		}

		return undefined;
	}

	@diffProperty('data')
	protected onDataChange() {
		this._state.answer = undefined;
		this._state.correct = undefined;
		this._state.revealed = false;
		this.invalidate();
	}

	protected render() {
		const { data, evolutionChain, options } = this.properties;
		if (!data) {
			return <div classes={css.root} />;
		}

		const { revealed, correct } = this._state;
		const type1Name = data.types[0].type.name;
		const type1Class = this._getTypeClass(type1Name);
		let type2Name = type1Name;
		let type2Class = type1Class;
		if (data.types.length > 1) {
			type2Name = data.types[1].type.name;
			type2Class = this._getTypeClass(type2Name);
		}

		const flavorText = data.speciesData.flavor_text;
		const genus = data.speciesData.genus;
		const name = data.speciesData.name;
		const evolution = evolutionChain ? this._getEvolution(data.name, evolutionChain.chain) : undefined;

		if (!revealed) {
			return (
				<div key={`pokemon-${data.id}`} classes={css.root}>
					<div key="content" classes={css.content}>
						<h1 classes={[css.sectionHeader]}>?????</h1>
						<div key="summary" classes={css.summary}>
							<img
								key={`image-${name}`}
								title="?????"
								src={data.sprites.front_default}
								classes={[css.image, css.hidden]}
							/>
						</div>
						<div key="answer" classes={css.answer}>
							{options &&
								options.map((option) => (
									<Button onClick={() => this._onSubmit(option.id)} extraClasses={{root: css.answerButton}}>{option.speciesData.name}</Button>
								))}
						</div>
					</div>
				</div>
			);
		}

		return (
			<div key={`pokemon-${data.id}`} classes={css.root}>
				<div key="type1" classes={[css.type1, type1Class]} />
				<div key="type2" classes={[css.type2, type2Class]} />
				<div key="content" classes={css.content}>
					<h1 classes={[css.sectionHeader, type1Class]}>
						{`#${data.id} ${name}`}
						{correct !== undefined ? (
							<i classes={['material-icons', css.answerIndicator]}>{correct ? 'done' : 'close'}</i>
						) : (
							''
						)}
					</h1>
					<div key="summary" classes={css.summary}>
						<img key={`image-${name}`} title={name} src={data.sprites.front_default} classes={css.image} />
						<div classes={css.summaryDetails}>
							<div classes={css.typeNames}>
								<div classes={[css.typeName, type1Class]}>{type1Name}</div>
								{type1Name !== type2Name ? (
									<div classes={[css.typeName, type2Class]}>{type2Name}</div>
								) : (
									''
								)}
							</div>
						</div>
					</div>
					<div key="details" classes={css.details}>
						<h4>{genus}</h4>
						{evolution && [
							evolution.from && (
								<p classes={css.evolutionText}>
									<strong>Evolves from</strong>: {evolution.from}
								</p>
							),
							evolution.to.length > 0 && (
								<p classes={css.evolutionText}>
									<strong>Evolves into</strong>: {evolution.to.join(', ')}
								</p>
							)
						]}
						<p classes={css.flavorText}>{flavorText}</p>
						<Button extraClasses={{ root: css.nextButton }} onClick={this.properties.next}>
							<i class="material-icons">chevron_right</i>
						</Button>
					</div>
				</div>
			</div>
		);
	}
}
