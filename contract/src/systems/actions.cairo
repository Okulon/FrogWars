use dojo_starter::models::{Direction, Position, Field, FieldType, Battle};

// define the interface
#[starknet::interface]
trait IActions<T> {
    fn joinBattle(ref self: T);
    fn generateBattle(ref self: T);
    fn populateWorld(ref self: T);
    fn resetBattle(ref self: T);

    
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
        fn joinBattle(ref self: ContractState){
            let mut world = self.world_default();
            let mut battle: Battle = world.read_model(1000000);
            let player = get_caller_address();

            if (battle.initialized){
                if (battle.playerCount == 1){
                    battle.playerAddress2 = player;
                    battle.playerCount = 2

                    // two players joined, initialize spawnlocations
                }
            } else {
                self.generateBattle();
                self.populateWorld();
                battle.playerAddress1 = player;
                battle.playerCount = 1
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
                let mut newField: Field = Field{fieldId: index, battleId: battleId, fieldType: *initialBattleSettings.at(index), occupiedBy: starknet::contract_address_const::<0x0>() }; 
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
