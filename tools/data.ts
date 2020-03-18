import { EvolutionData, GenerationData } from '../src/App';
import { PokemonData, PokemonSpeciesData } from '../src/widgets/Pokemon';
import { generations } from '../src/constants';
import fetch from 'node-fetch';
import { writeFileSync, readJSONSync } from 'fs-extra';
import { join } from 'path';
import { blue, green } from 'chalk';

const ora = require('ora');
let evolutionData: EvolutionData = {};

interface RawPokemonData extends PokemonData {
	speciesData: RawPokemonSpeciesData;
	abilities: any;
	game_indices: any;
	moves: any;
}

interface RawPokemonSpeciesData extends PokemonSpeciesData {
	flavor_text_entries: any[];
	genera: any[];
	names: any[];
}

function getEnglishString(data: any[], key: string): string {
	return data.filter(entry => entry.language.name === 'en')[0][key];
}

async function fetchPokemonData(id: number) {
	const baseUrl = 'https://pokeapi.co/api/v2/';
	let response = await fetch(`${baseUrl}pokemon/${id}/`)
	const data: RawPokemonData = await response.json();

	response = await fetch(`${baseUrl}pokemon-species/${id}/`);
	data.speciesData = await response.json();

	const evolutionIdMatch = /\/([0-9]+)\/$/g.exec(data.speciesData.evolution_chain.url);
	if (evolutionIdMatch) {
		const evolutionId = +evolutionIdMatch[1];

		if (!evolutionData[evolutionId]) {
			response = await fetch(data.speciesData.evolution_chain.url);
			evolutionData[evolutionId] = await response.json();
		}
	}

	// Shrink size of data by deleting data we do not need
	delete data.abilities;
	delete data.game_indices;
	delete data.moves;

	// Filter out only the english entries
	data.speciesData.flavor_text = getEnglishString(data.speciesData.flavor_text_entries, 'flavor_text');
	delete data.speciesData.flavor_text_entries;
	data.speciesData.genus = getEnglishString(data.speciesData.genera, 'genus');
	delete data.speciesData.genera;
	data.speciesData.name = getEnglishString(data.speciesData.names, 'name');
	delete data.speciesData.names;

	return data;
}

async function getData(startG: number) {
	for (let g = startG; g <= generations.length; g++) {
		const generation = generations[g - 1];
		console.info(blue.bold(generation.name));
		evolutionData = readJSONSync(join(__dirname, `../src/data/evolutions.json`));
		const data: GenerationData = {
			dataById: {},
			idByName: {}
		};
		const total = generation.pokemon.endId - generation.pokemon.startId + 1;
		const spinner = ora('Loading pokemon...').start();
		spinner.color = 'green';
		for (let i = generation.pokemon.startId; i <= generation.pokemon.endId; i++) {
			spinner.text = green(` Loading pokemon... ${i - generation.pokemon.startId + 1} / ${total}`);
			const pokemonData = await fetchPokemonData(i);
			data.dataById[i] = pokemonData;
			data.idByName[pokemonData.name] = pokemonData.id;
		}
		spinner.stopAndPersist();
		writeFileSync(join(__dirname, `../src/data/${generation.name}.json`), JSON.stringify(data, null, 2));
		writeFileSync(join(__dirname, `../src/data/evolutions.json`), JSON.stringify(evolutionData, null, 2));
	}
	writeFileSync(join(__dirname, `../src/data/evolutions.json`), JSON.stringify(evolutionData, null, 2));
}

let startGeneration = 1;
if (!isNaN(+process.argv[2])) {
	startGeneration = +process.argv[2];
}
getData(startGeneration);
