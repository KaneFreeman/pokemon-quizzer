import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { DNode } from '@dojo/framework/widget-core/interfaces';
import { tsx } from '@dojo/framework/widget-core/tsx';
import Button from '@dojo/widgets/button';

import { generations, Generation, SkipMatrix } from './constants';
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
	difficulty?: 'easy' | 'medium' | 'hard' | 'very hard';
	amount?: 10 | 25 | 50 | 'all';
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

interface AnswerOption {
	id: number;
	order: number;
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

function mergeGenerationData(...generationsData: GenerationData[]): GenerationData {
	return generationsData.reduce((previous, currentData) => {
		return {
			dataById: { ...previous.dataById, ...currentData.dataById },
			idByName: { ...previous.idByName, ...currentData.idByName }
		};
	});
}

function createCustomGeneration(...generations: Generation[]): Generation {
	const skipMatrix: SkipMatrix[] = [];

	generations.sort((a, b) => a.pokemon.startId - b.pokemon.startId);

	let endId = 0;
	generations.forEach((generation) => {
		console.log(endId, endId + 1 - generation.pokemon.startId);
		skipMatrix.push({
			index: endId + 1,
			numberToSkip: generation.pokemon.startId - (endId + 1)
		});
		endId += generation.pokemon.endId - generation.pokemon.startId + 1;
		console.log(endId, skipMatrix);
	});

	const generation: Generation = {
		name: 'Custom',
		pokemon: {
			startId: 1,
			endId: endId
		},
		skipMatrix
	};

	return generation;
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
		const { difficulty, amount } = this._state;
		if (!this._state.quiz || !this._state.generationData || this._state.complete) {
			return;
		}

		if (index > (!amount || amount === 'all' ? this._state.quiz.questions.length - 1 : amount - 1)) {
			this._state.complete = true;
			this.invalidate();
			return;
		}

		const id = this._computeTrueId(this._state.quiz.questions[index].id);

		if (this._state.generationData.dataById[id]) {
			const data = this._state.generationData.dataById[id];
			this._state.quiz.currentIndex = index;

			const options: AnswerOption[] = [
				{
					id: data.id,
					order: Math.random()
				}
			];

			const evolutionConfusionChance = Math.random();
			let evolutionOption: AnswerOption | undefined;
			if (evolutionConfusionChance <= 0.6 && evolutionConfusionChance > 0.2) {
				evolutionOption = this._getRandomOptionFromEvolutionChain(options, data);
			}

			if (evolutionConfusionChance <= 0.2 || (!evolutionOption && evolutionConfusionChance <= 0.4)) {
				const randomOption = this._getRandomGenerationOption(options);
				options.push(randomOption);
				evolutionOption = this._getRandomOptionFromEvolutionChain(options, dataByIdAll[randomOption.id]);
			}

			if (evolutionOption) {
				options.push(evolutionOption);
			}

			let optionCnt = 4;
			switch (difficulty) {
				case 'medium':
					optionCnt = 8;
					break;
				case 'hard':
					optionCnt = 12;
					break;
			}

			while (options.length < optionCnt) {
				const randomOption = this._getRandomGenerationOption(options);
				options.push(randomOption);
			}
			options.sort((a, b) => a.order - b.order);
			this._state.options = options.map((option) => dataByIdAll[option.id]);

			this.invalidate();
			return;
		}
	}

	private _computeTrueId(id: number): number {
		const { generation } = this._state;
		console.log('initial id', id, generation.skipMatrix);
		if (generation.skipMatrix) {
			for (let i = generation.skipMatrix.length - 1; i >= 0; i--) {
				const skipMatrixEntry = generation.skipMatrix[i];
				if (skipMatrixEntry.index <= id) {
					console.log(`${skipMatrixEntry.index} <= ${id}`, `adding ${skipMatrixEntry.numberToSkip}`);
					id += skipMatrixEntry.numberToSkip;
				}
			}
		}

		console.log('final id', id);
		return id;
	}

	private _getRandomGenerationOption(currentOptions: AnswerOption[]): AnswerOption {
		const { generation } = this._state;
		const optionsSoFar = currentOptions.map((option) => option.id);
		let id;
		do {
			id = this._computeTrueId(randomIntInclusive(generation.pokemon.startId, generation.pokemon.endId));
		} while (optionsSoFar.indexOf(id) >= 0);

		return {
			id: id,
			order: Math.random()
		};
	}

	private _getRandomOptionFromEvolutionChain(
		currentOptions: AnswerOption[],
		data: PokemonData
	): AnswerOption | undefined {
		const { evolutionData } = this._state;
		let evolutionChain: PokemonEvolutionChain | undefined;
		const evolutionIdMatch = /\/([0-9]+)\/$/g.exec(data.speciesData.evolution_chain.url);
		if (evolutionIdMatch) {
			const evolutionId = +evolutionIdMatch[1];
			evolutionChain = evolutionData[evolutionId];
		}

		const evolutionChainIds = this._getAllEvolutionIds(evolutionChain && evolutionChain.chain).filter(
			(num) => num !== data.id
		);

		if (evolutionChainIds.length > 0) {
			return {
				id: evolutionChainIds[randomIntInclusive(0, evolutionChainIds.length - 1)],
				order: Math.random()
			};
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

	private _onGeneartionChange(generations: Generation[]) {
		if (generations.length === 1) {
			this._state.generation = generations[0];
			this._state.generationData = globalData.generations[generations[0].name];
		} else {
			this._state.generation = createCustomGeneration(...generations);
			this._state.generationData = mergeGenerationData(
				...generations.map((generation) => globalData.generations[generation.name])
			);
		}
		this._state.quiz = undefined;
		this._state.difficulty = undefined;
		this._state.amount = undefined;
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
		this._state.difficulty = undefined;
		this._state.amount = undefined;
		this.invalidate();
	}

	private _onAnswer(correct: boolean) {
		if (!this._state.quiz) {
			return;
		}

		this._state.quiz.questions[this._state.quiz.currentIndex].answered = true;
		this._state.quiz.questions[this._state.quiz.currentIndex].correct = correct;
		this.invalidate();
	}

	private _onAmountSelection(amount: 10 | 25 | 50 | 'all') {
		if (!this._state.quiz) {
			return;
		}

		this._state.amount = amount;
		this._loadPokemon(0);
	}

	private _onDifficultySelection(difficulty: 'easy' | 'medium' | 'hard' | 'very hard') {
		if (!this._state.quiz) {
			return;
		}

		this._state.difficulty = difficulty;
		this.invalidate();
	}

	private _renderQuiz(quiz: Quiz): DNode {
		const { options, generationData, evolutionData } = this._state;
		const pokemonQuestion = quiz.questions[quiz.currentIndex];
		const id = this._computeTrueId(pokemonQuestion.id);
		const data = generationData.dataById[id];

		let evolutionChain: PokemonEvolutionChain | undefined;
		console.log(quiz.currentIndex, id, data);
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

	private _renderStart(correct: number, total: number): DNode {
		const { complete, difficulty, quiz, amount } = this._state;

		const percent = Math.round((correct / (!amount || amount === 'all' ? total : amount)) * 100);

		return (
			<div classes={css.startView}>
				<div>{complete && <h1 classes={css.percent}>{`${percent}%`}</h1>}</div>
				<div>
					{quiz && difficulty && !amount && (
						<div classes={css.amount}>
							<Button onClick={() => this._onAmountSelection(10)}>{`10`}</Button>
							<Button onClick={() => this._onAmountSelection(25)}>{`25`}</Button>
							<Button onClick={() => this._onAmountSelection(50)}>{`50`}</Button>
							<Button onClick={() => this._onAmountSelection('all')}>All</Button>
						</div>
					)}
				</div>
				<div>
					{quiz && !difficulty && (
						<div classes={css.difficulty}>
							<Button onClick={() => this._onDifficultySelection('easy')}>Easy</Button>
							<Button onClick={() => this._onDifficultySelection('medium')}>Medium</Button>
							<Button onClick={() => this._onDifficultySelection('hard')}>Hard</Button>
						</div>
					)}
				</div>
				<div>
					{(!quiz || complete) && (
						<Button extraClasses={{ root: css.startQuizButton }} onClick={this._startQuiz}>
							Start {complete ? 'Another ' : ''}Quiz
						</Button>
					)}
				</div>
			</div>
		);
	}

	protected render() {
		const { quiz, generation, complete, difficulty, amount } = this._state;

		let correct = 0;
		let incorrect = 0;
		let total = 0;
		if (quiz) {
			const answeredQuestions = quiz.questions.filter((question) => question.answered);
			const correctQuestions = answeredQuestions.filter((question) => question.correct);
			correct = correctQuestions.length;
			incorrect = answeredQuestions.length - correct;
			total = generation.pokemon.endId - generation.pokemon.startId + 1;
		}

		const quizTotal = !amount || amount === 'all' ? total : amount;

		return (
			<div classes={css.root}>
				<Menu onGenerationChange={this._onGeneartionChange} />
				<div classes={css.mainView}>
					{quiz && difficulty && amount && (
						<div key="score" classes={css.scoreWrapper}>
							<div classes={css.score}>
								<div key="total" classes={css.total}>
									{`${quizTotal}`}
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
						</div>
					)}
					{quiz && difficulty && amount && !complete
						? this._renderQuiz(quiz)
						: this._renderStart(correct, total)}
				</div>
			</div>
		);
	}
}
