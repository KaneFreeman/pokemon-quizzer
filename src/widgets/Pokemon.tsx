
import { tsx, create } from '@dojo/framework/core/vdom';
import { createICacheMiddleware } from '@dojo/framework/core/middleware/icache';
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

const icache = createICacheMiddleware<PokemonState>();
const factory = create({ icache }).properties<PokemonProperties>();

function getPokemonDisplayNameFromName(name: string) {
	return dataByIdAll[idByNameAll[name]].speciesData.name;
}

function getEvolution(
	target: string,
	chainLink: PokemonEvolutionChainLink,
	parentLink?: PokemonEvolutionChainLink
): { from?: string; to: string[] } | undefined {
	if (chainLink.species.name === target) {
		return {
			from: parentLink ? getPokemonDisplayNameFromName(parentLink.species.name) : undefined,
			to: chainLink.evolves_to.map((childChainLink) =>
				getPokemonDisplayNameFromName(childChainLink.species.name)
			)
		};
	}

	for (let childChainLink of chainLink.evolves_to) {
		const response = getEvolution(target, childChainLink, chainLink);
		if (response) {
			return response;
		}
	}

	return undefined;
}

export default factory(({ properties, middleware: { icache } }) => {
	const { data, evolutionChain, options, next } = properties();
	if (!data) {
		return <div classes={css.root} />;
	}

	const revealed = icache.getOrSet('revealed', false);
	const correct = icache.get('correct');
	const type1Name = data.types[0].type.name;
	const type1Class = types[type1Name];
	let type2Name = type1Name;
	let type2Class = type1Class;
	if (data.types.length > 1) {
		type2Name = data.types[1].type.name;
		type2Class = types[type2Name];
	}

	const flavorText = data.speciesData.flavor_text;
	const genus = data.speciesData.genus;
	const name = data.speciesData.name;
	const evolution = evolutionChain ? getEvolution(data.name, evolutionChain.chain) : undefined;

	const imageStyles: Partial<CSSStyleDeclaration> = {
		backgroundImage: `url('${data.sprites.front_default}')`
	};

	if (!revealed) {
		return (
			<div key={`pokemon-${data.id}`} classes={css.root}>
				<div key="content" classes={css.content}>
					<h1 classes={[css.sectionHeader]}>?????</h1>
					<div key="summary" classes={css.summary}>
						<div
							key={`image-${name}`}
							title="?????"
							styles={imageStyles}
							classes={[css.image, css.hidden]}
						></div>
					</div>
					<div key="answer" classes={css.answer}>
						{options &&
							options.map((option) => (
								<Button
									onClick={() => {
										const { data, onAnswer } = properties();
								
										let correct = false;
										if (option.id === data.id) {
											correct = true;
										}
								
										onAnswer(correct);
										icache.set('revealed', true);
										icache.set('correct', correct);
									}}
									classes={{ "@dojo/widgets/button": { root: [ css.answerButton ] } }}
								>
									{option.speciesData.name}
								</Button>
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
					<h4 class="genus">{genus}</h4>
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
					<Button extraClasses={{ root: css.nextButton }} onClick={next}>
						<i class="material-icons">chevron_right</i>
					</Button>
				</div>
			</div>
		</div>
	);
});
