import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_generateBattle_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "generateBattle",
			calldata: [],
		};
	};

	const actions_generateBattle = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_generateBattle_calldata(),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_joinBattle_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "joinBattle",
			calldata: [],
		};
	};

	const actions_joinBattle = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_joinBattle_calldata(),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_move_calldata = (direction: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "move",
			calldata: [direction],
		};
	};

	const actions_move = async (snAccount: Account | AccountInterface, direction: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_move_calldata(direction),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_populateWorld_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "populateWorld",
			calldata: [],
		};
	};

	const actions_populateWorld = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_populateWorld_calldata(),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_resetBattle_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "resetBattle",
			calldata: [],
		};
	};

	const actions_resetBattle = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_resetBattle_calldata(),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_spawn_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "spawn",
			calldata: [],
		};
	};

	const actions_spawn = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_spawn_calldata(),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			generateBattle: actions_generateBattle,
			buildGenerateBattleCalldata: build_actions_generateBattle_calldata,
			joinBattle: actions_joinBattle,
			buildJoinBattleCalldata: build_actions_joinBattle_calldata,
			move: actions_move,
			buildMoveCalldata: build_actions_move_calldata,
			populateWorld: actions_populateWorld,
			buildPopulateWorldCalldata: build_actions_populateWorld_calldata,
			resetBattle: actions_resetBattle,
			buildResetBattleCalldata: build_actions_resetBattle_calldata,
			spawn: actions_spawn,
			buildSpawnCalldata: build_actions_spawn_calldata,
		},
	};
}