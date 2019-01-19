import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { DNode } from '@dojo/framework/widget-core/interfaces';
import { tsx } from '@dojo/framework/widget-core/tsx';
import Button from '@dojo/widgets/button';

import { generations, Generation } from './constants';
import { Menu } from './widgets/Menu';
import { Pokemon, PokemonData, PokemonEvolutionChain, PokemonEvolutionChainLink } from './widgets/Pokemon';

import * as GenerationI from './data/Generation I.json';
import * as GenerationII from './data/Generation II.json';
import * as GenerationIII from './data/Generation III.json';
import * as GenerationIV from './data/Generation IV.json';
import * as GenerationV from './data/Generation V.json';
import * as GenerationVI from './data/Generation VI.json';
import * as GenerationVII from './data/Generation VII.json';
import * as evolutions from './data/evolutions.json';

import * as css from './App.m.css';

interface AppState {
	generation: Generation;
	generationData: GenerationData;
	evolutionData: EvolutionData;
	quiz?: Quiz;
	options?: PokemonData[];
	complete: boolean;
}

interface Quiz {
	currentIndex: number;
	questions: PokemonQuestion[];
}

interface PokemonQuestion {
	id: number;
	order: number;
	answered: boolean;
	correct: boolean;
}

export interface GenerationData {
	dataById: { [id: number]: PokemonData };
	idByName: { [name: string]: number };
}

export interface EvolutionData {
	[id: number]: PokemonEvolutionChain;
}

function randomIntInclusive(min: number, max: number): number {
	return Math.round(Math.random() * (max - min)) + min;
}

export const globalData = {
	generations: {
		'Generation I': GenerationI as any,
		'Generation II': GenerationII as any,
		'Generation III': GenerationIII as any,
		'Generation IV': GenerationIV as any,
		'Generation V': GenerationV as any,
		'Generation VI': GenerationVI as any,
		'Generation VII': GenerationVII as any
	} as { [generationName: string]: GenerationData },
	evolutions: evolutions as EvolutionData
};

let dataByIdAllTemp: { [id: number]: PokemonData } = {};
generations.map(
	(generation) => (dataByIdAllTemp = { ...dataByIdAllTemp, ...globalData.generations[generation.name].dataById })
);
export const dataByIdAll = dataByIdAllTemp;

let idByNameAllTemp: { [id: string]: number } = {};
generations.map(
	(generation) => (idByNameAllTemp = { ...idByNameAllTemp, ...globalData.generations[generation.name].idByName })
);
export const idByNameAll = idByNameAllTemp;

export class App extends WidgetBase {
	private _state: AppState = {
		generation: generations[0],
		evolutionData: globalData.evolutions,
		generationData: globalData.generations['Generation I'],
		complete: false
	};

	private _loadPokemon(index: number) {
		const { generation, evolutionData } = this._state;
		if (!this._state.quiz || !this._state.generationData || this._state.complete) {
			return;
		}

		if (index > this._state.quiz.questions.length - 1) {
			this._state.complete = true;
			this.invalidate();
			return;
		}

		const id = this._state.quiz.questions[index].id;

		if (this._state.generationData.dataById[id]) {
			const data = this._state.generationData.dataById[id];
			this._state.quiz.currentIndex = index;

			const options: { id: number; order: number }[] = [
				{
					id: data.id,
					order: Math.random()
				}
			];

			let evolutionChain: PokemonEvolutionChain | undefined;
			const evolutionIdMatch = /\/([0-9]+)\/$/g.exec(data.speciesData.evolution_chain.url);
			if (evolutionIdMatch) {
				const evolutionId = +evolutionIdMatch[1];
				evolutionChain = evolutionData[evolutionId];
			}

			if (Math.random() < 0.5) {
				const evolutionChainIds = this._getAllEvolutionIds(evolutionChain && evolutionChain.chain).filter(
					(num) => num !== data.id
				);
				if (evolutionChainIds.length > 0) {
					options.push({
						id: evolutionChainIds[randomIntInclusive(0, evolutionChainIds.length - 1)],
						order: Math.random()
					});
				}
			}

			const optionsSoFar = options.map((option) => option.id);
			while (options.length < 12) {
				const id = randomIntInclusive(generation.pokemon.startId, generation.pokemon.endId);
				if (optionsSoFar.indexOf(id) < 0) {
					options.push({
						id: id,
						order: Math.random()
					});
					optionsSoFar.push(id);
				}
			}
			options.sort((a, b) => a.order - b.order);
			this._state.options = options.map((option) => dataByIdAll[option.id]);

			this.invalidate();
			return;
		}
	}

	private _getAllEvolutionIds(chainLink?: PokemonEvolutionChainLink): number[] {
		if (!chainLink || !chainLink.species.name) {
			return [];
		}
		const response = [idByNameAll[chainLink.species.name]];
		chainLink.evolves_to.map((childChainLink) => {
			const ids = this._getAllEvolutionIds(childChainLink);
			if (ids && ids.length > 0) {
				response.push(...ids);
			}
		});
		return response;
	}

	private _onGeneartionChange(generation: Generation) {
		this._state.generation = generation;
		this._state.generationData = globalData.generations[generation.name];
		this._state.quiz = undefined;
		this.invalidate();
	}

	private _next() {
		const {
			quiz: { currentIndex = 0, questions = [] } = {},
			generation: { pokemon: { endId = 1 } = {} } = {}
		} = this._state;
		if (!this._state.quiz || questions[currentIndex].id > endId) {
			return;
		}

		this._loadPokemon(currentIndex + 1);
	}

	private _startQuiz() {
		const { generation } = this._state;
		const questions: PokemonQuestion[] = [];
		for (let i = generation.pokemon.startId; i <= generation.pokemon.endId; i++) {
			questions.push({
				id: i,
				order: Math.random(),
				answered: false,
				correct: false
			});
		}
		questions.sort((a, b) => a.order - b.order);
		this._state.quiz = {
			currentIndex: 0,
			questions
		};
		this._state.complete = false;
		this._loadPokemon(0);
	}

	private _onAnswer(correct: boolean) {
		if (!this._state.quiz) {
			return;
		}

		this._state.quiz.questions[this._state.quiz.currentIndex].answered = true;
		this._state.quiz.questions[this._state.quiz.currentIndex].correct = correct;
		this.invalidate();
	}

	private _renderQuiz(quiz: Quiz): DNode {
		const { options, generationData, evolutionData } = this._state;
		const pokemonQuestion = quiz.questions[quiz.currentIndex];
		const data = generationData.dataById[pokemonQuestion.id];

		let evolutionChain: PokemonEvolutionChain | undefined;
		const evolutionIdMatch = /\/([0-9]+)\/$/g.exec(data.speciesData.evolution_chain.url);
		if (evolutionIdMatch) {
			const evolutionId = +evolutionIdMatch[1];
			evolutionChain = evolutionData[evolutionId];
		}

		return (
			<Pokemon
				key={`pokemon-view`}
				data={data}
				evolutionChain={evolutionChain}
				onAnswer={this._onAnswer}
				next={this._next}
				options={options}
			/>
		);
	}

	private _renderStart(correct: number, incorrect: number): DNode {
		const { complete } = this._state;

		return (
			<div classes={css.startView}>
				{complete && (
					<div classes={css.score}>
						<div key="correct" classes={css.correct}>
							{`${correct}`}
							<i class="material-icons">done</i>
						</div>
						<div key="incorrect" classes={css.incorrect}>
							{`${incorrect}`}
							<i class="material-icons">close</i>
						</div>
					</div>
				)}
				<Button extraClasses={{ root: css.startQuizButton }} onClick={this._startQuiz}>
					Start Quiz
				</Button>
			</div>
		);
	}

	protected render() {
		const { quiz, generation, complete } = this._state;

		let correct = 0;
		let incorrect = 0;
		if (quiz) {
			const answeredQuestions = quiz.questions.filter((question) => question.answered);
			const correctQuestions = answeredQuestions.filter((question) => question.correct);
			correct = correctQuestions.length;
			incorrect = answeredQuestions.length - correct;
		}

		return (
			<div classes={css.root}>
				<Menu
					onGenerationChange={this._onGeneartionChange}
					total={generation.pokemon.endId - generation.pokemon.startId + 1}
					correct={correct}
					incorrect={incorrect}
				/>
				<div classes={css.mainView}>
					{quiz && !complete ? this._renderQuiz(quiz) : this._renderStart(correct, incorrect)}
				</div>
			</div>
		);
	}
}
