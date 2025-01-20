use dojo_starter::models::{Direction, Position, Field, FieldType, Battle};

// define the interface
#[starknet::interface]
trait IActions<T> {
    fn joinBattle(ref self: T);
    fn generateBattle(ref self: T);
    fn populateWorld(ref self: T);
    fn resetBattle(ref self: T);
    fn nextTurn(ref self: T);
    fn moveTo(ref self: T, from: u32, to: u32);
    fn buyFrog(ref self: T);

    
    fn spawn(ref self: T);
    fn move(ref self: T, direction: Direction);
}

// dojo decorator
#[dojo::contract]
pub mod actions {
    use super::{IActions, Direction, Position, next_position, Field, FieldType, Battle};
    use starknet::{ContractAddress, get_caller_address};
    use dojo_starter::models::{Vec2, Moves, DirectionsAvailable};

    use dojo::model::{ModelStorage, ModelValueStorage};
    use dojo::event::EventStorage;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct Moved {
        #[key]
        pub player: ContractAddress,
        pub direction: Direction,
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn buyFrog (ref self: ContractState) {
            let mut world = self.world_default();

            let battleId = 1000000;

            let mut spawnValid: bool = false;
            let mut battle: Battle = world.read_model(battleId);
            let mut spawnZoneId: u32 = 28;
            let player = get_caller_address();
            if (player == battle.playerAddress1){
                spawnZoneId = 71;
                if (battle.turnOrder == 0){
                    if (battle.p1Gold >= 100){
                        spawnValid = true;
                        battle.p1Gold -= 100;
                    }
                }
            }
            if (player == battle.playerAddress2){
                spawnZoneId = 28;
                if (battle.turnOrder == 1){
                    if (battle.p2Gold >= 100){
                        spawnValid = true;
                        battle.p2Gold -= 100;
                    }
                }
            }
            let mut spawnField: Field = world.read_model((spawnZoneId, battleId));
            if (spawnField.structureHp > 0){
                spawnValid = false;
            }
            if (spawnValid){
                spawnField.unitType = 1;
                spawnField.structureHp = 2;
                spawnField.movesLeft = 1;
                world.write_model(@spawnField);
                world.write_model(@battle);
            }

            
        }
        fn moveTo (ref self: ContractState, from: u32, to: u32) {
            // Get the address of the current caller, possibly the player's address.

            let mut world = self.world_default();
            let player = get_caller_address();
            let battleId = 1000000;

            let mut _battle: Battle = world.read_model(battleId);
            
            let mut fieldFrom: Field = world.read_model((from, battleId));
            let mut fieldTo: Field = world.read_model((to, battleId));

            let mut movesLeft = fieldFrom.movesLeft;

            
            if (movesLeft > 0 && fieldTo.structureHp <= 0 && fieldTo.fieldType == 0){
                fieldTo.structureHp = fieldFrom.structureHp;
                fieldTo.movesLeft = fieldFrom.movesLeft -1;
                fieldTo.unitType = fieldFrom.unitType;
                fieldTo.occupiedBy = fieldFrom.occupiedBy;
                
                fieldFrom.structureHp = 0;
                fieldFrom.movesLeft -= 1;
                fieldFrom.unitType = 0;

                world.write_model(@fieldTo);
                world.write_model(@fieldFrom);
            }

            if (movesLeft > 0 && fieldTo.structureHp > 0 && fieldTo.occupiedBy != player){
                fieldTo.structureHp -= 1;
                if (fieldTo.structureHp <= 0){
                    fieldTo.structureHp = fieldFrom.structureHp;
                    fieldTo.movesLeft = fieldFrom.movesLeft -1;
                    fieldTo.unitType = fieldFrom.unitType;
                    fieldTo.occupiedBy = fieldFrom.occupiedBy;
                    
                    fieldFrom.structureHp = 0;
                    fieldFrom.movesLeft -= 1;
                    fieldFrom.unitType = 0;

                    world.write_model(@fieldTo);
                    world.write_model(@fieldFrom);
                }
            }


            //TODO: moving needs to check that the field is valid on the smartcontract side, currently only checks client side
         


        }
        fn nextTurn(ref self: ContractState){

            let mut world = self.world_default();

            let mut battle: Battle = world.read_model(1000000);
            let player = get_caller_address();

            if (battle.turnOrder == 0){
                if (player == battle.playerAddress1){
                    battle.turnOrder = 1;
                    battle.p2Gold += 50;
                }
            }
            if (battle.turnOrder == 1){
                if (player == battle.playerAddress2){
                    battle.turnOrder = 0;
                    battle.p1Gold += 50;
                }
            }
            world.write_model(@battle);

            //reset moves
            let mut index: u32 = 0;
            while index < 100_u32 {
                let mut field: Field = world.read_model( (index, 1000000) );
                if (field.unitType == 1){
                    field.movesLeft = 1;
                }
                world.write_model(@field);
                index += 1;
            };
        }

        fn joinBattle(ref self: ContractState){
            let mut world = self.world_default();
            let mut battle: Battle = world.read_model(1000000);
            let player = get_caller_address();
            let battleId = 1000000;

            if (battle.initialized){
                if (battle.playerCount == 1 ){//&& battle.playerAddress1 != player){
                    battle.playerAddress2 = player;
                    battle.playerCount = 2;
                    world.write_model(@battle);
                    // two players joined, initialize spawnlocations, give hp to bases
                    let spawnLocations: Array<u32> = array![
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 4, 2, 0,
                        0, 0, 0, 0, 0, 0, 0, 4, 4, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 3, 3, 0, 0, 0, 0, 0, 0, 0,
                        0, 1, 3, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

                    let mut index = 0;
                    while index < 100 {
                        //let spawn: u32 = spawnLocations[index];
                        let spawn: u32 = *spawnLocations[index];
                        if (spawn == 1 || spawn == 2){
                            let mut field: Field = world.read_model((index, battleId));
                            field.structureType = 1;
                            field.structureHp = 10;
                            if (spawn == 1){
                                field.occupiedBy = battle.playerAddress1;
                            }
                            if (spawn == 2){
                                field.occupiedBy = battle.playerAddress2;
                            }
                            world.write_model(@field);
                        }

                        if (spawn == 3 || spawn == 4){
                            let mut field: Field = world.read_model((index, battleId));
                            field.unitType = 1;
                            field.structureHp = 2;
                            if (spawn == 3){
                                field.occupiedBy = battle.playerAddress1;
                                field.movesLeft = 1;
                            }
                            if (spawn == 4){
                                field.occupiedBy = battle.playerAddress2;
                                field.movesLeft = 1;
                            }
                            world.write_model(@field);
                        }                                       
                        
                        index += 1;
                    };

                }
            } else if (battle.playerCount == 0) {
                self.generateBattle();
                self.populateWorld();
                let mut battle: Battle = world.read_model(1000000);
                battle.playerCount = 1;
                battle.playerAddress1 = player;
                world.write_model(@battle);
            }
           
            
        }
        fn generateBattle(ref self: ContractState){
            let mut world = self.world_default();

            let mut newBattle = Battle {
                 battleId: 1000000,
                 playerAddress1: starknet::contract_address_const::<0x0>(),
                 playerAddress2: starknet::contract_address_const::<0x0>(),
                 initialized: false,
                 playerCount: 0,
                 turnOrder: 0,
                 p1Gold: 100,
                 p2Gold: 100,
            };

            world.write_model(@newBattle);
            
        }

        fn populateWorld(ref self: ContractState) {
            // Get the default world.
            let mut world = self.world_default();

            // generate map with 100 fields
            let battleId = 1000000;
            
            let mut index = 0;
            
            let initialBattleSettings: Array<u32> = array![
                0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 2, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 1, 1, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 2, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

            while index < 100 {
                let mut newField: Field = Field{
                    fieldId: index, 
                    battleId: battleId, 
                    fieldType: *initialBattleSettings.at(index),
                    unitType: 0, 
                    structureType: 0,
                    structureHp: 0,
                    occupiedBy: starknet::contract_address_const::<0x0>(),
                    movesLeft: 0 }; 
                world.write_model(@newField);
                index += 1;
             }; 

            let mut battle: Battle = world.read_model(1000000);
            battle.initialized = true;
            world.write_model(@battle);

        }


        fn resetBattle(ref self: ContractState){
            let mut world = self.world_default();

            let mut index = 0;
            let arr: Array<u32> = array![0];
            while index < 100 {
                let mut _fix = arr.at(index*0);
                let mut field: Field = world.read_model( (index, 1000000) );
                world.erase_model(@field);
                index += 1;
            };
            let mut battle: Battle = world.read_model(1000000);
            world.erase_model(@battle)
        }

        fn spawn(ref self: ContractState) {
            // Get the default world.
            let mut world = self.world_default();

            // Get the address of the current caller, possibly the player's address.
            let player = get_caller_address();
            // Retrieve the player's current position from the world.
            let position: Position = world.read_model(player);

            // Update the world state with the new data.

            // 1. Move the player's position 10 units in both the x and y direction.
            let new_position = Position {
                player, vec: Vec2 { x: position.vec.x + 10, y: position.vec.y + 10 }
            };

            // Write the new position to the world.
            world.write_model(@new_position);

            // 2. Set the player's remaining moves to 100.
            let moves = Moves {
                player, remaining: 100, last_direction: Option::None, can_move: true
            };

            // Write the new moves to the world.
            world.write_model(@moves);
        }

        // Implementation of the move function for the ContractState struct.
        fn move(ref self: ContractState, direction: Direction) {
            // Get the address of the current caller, possibly the player's address.

            let mut world = self.world_default();

            let player = get_caller_address();

            // Retrieve the player's current position and moves data from the world.
            let position: Position = world.read_model(player);
            let mut moves: Moves = world.read_model(player);
            // if player hasn't spawn, read returns model default values. This leads to sub overflow afterwards.
            // Plus it's generally considered as a good pratice to fast-return on matching conditions.
            if !moves.can_move {
                return;
            }

            // Deduct one from the player's remaining moves.
            moves.remaining -= 1;

            // Update the last direction the player moved in.
            moves.last_direction = Option::Some(direction);

            // Calculate the player's next position based on the provided direction.
            let next = next_position(position, moves.last_direction);

            // Write the new position to the world.
            world.write_model(@next);

            // Write the new moves to the world.
            world.write_model(@moves);

            // Emit an event to the world to notify about the player's move.
            world.emit_event(@Moved { player, direction });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Use the default namespace "dojo_starter". This function is handy since the ByteArray
        /// can't be const.
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }
}

// Define function like this:
fn next_position(mut position: Position, direction: Option<Direction>) -> Position {
    match direction {
        Option::None => { return position; },
        Option::Some(d) => match d {
            Direction::Left => { position.vec.x -= 1; },
            Direction::Right => { position.vec.x += 1; },
            Direction::Up => { position.vec.y -= 1; },
            Direction::Down => { position.vec.y += 1; },
        }
    };
    position
}
