export interface Generation {
	name: string;
	region?: string;
	games?: string[];
	pokemon: {
		startId: number;
		endId: number;
	};
	skipMatrix?: SkipMatrix[];
}

export interface SkipMatrix {
	index: number;
	numberToSkip: number;
}

export const generations: Generation[] = [
	{
		name: 'Generation I',
		region: 'Kanto',
		games: ['Red', 'Blue', 'Yellow'],
		pokemon: {
			startId: 1,
			endId: 151
		}
	},
	{
		name: 'Generation II',
		region: 'Johto',
		games: ['Silver', 'Gold', 'Crystal'],
		pokemon: {
			startId: 152,
			endId: 251
		}
	},
	{
		name: 'Generation III',
		region: 'Hoenn',
		games: ['Ruby', 'Sapphire', 'Emerald', 'FireRed', 'LeafGreen'],
		pokemon: {
			startId: 252,
			endId: 386
		}
	},
	{
		name: 'Generation IV',
		region: 'Sinnoh',
		games: ['Diamond', 'Pearl', 'Platinum', 'HeartGold', 'SoulSilver'],
		pokemon: {
			startId: 387,
			endId: 493
		}
	},
	{
		name: 'Generation V',
		region: 'Unova',
		games: ['Black', 'White', 'Black 2', 'White 2'],
		pokemon: {
			startId: 494,
			endId: 649
		}
	},
	{
		name: 'Generation VI',
		region: 'Kalos',
		games: ['X', 'Y', 'Omega Ruby', 'Alpha Sapphire'],
		pokemon: {
			startId: 650,
			endId: 721
		}
	},
	{
		name: 'Generation VII',
		region: '	Alola',
		games: ['Sun', 'Moon', 'Ultra Sun', 'Ultra Moon', "Let's Go, Pikachu!", "Let's Go, Eevee!"],
		pokemon: {
			startId: 722,
			endId: 802
		}
	}
];

export const generationLookup: { [key: string]: number } = {};
for (let i = 0; i < generations.length; i++) {
	generationLookup[generations[i].name] = i;
}
