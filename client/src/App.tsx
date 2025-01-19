import { useEffect, useMemo } from "react";
import { ParsedEntity, QueryBuilder } from "@dojoengine/sdk";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { AccountInterface, addAddressPadding, CairoCustomEnum } from "starknet";

import { ModelsMapping, SchemaType } from "./typescript/models.gen.ts";
import { useSystemCalls } from "./useSystemCalls.ts";
import { useAccount } from "@starknet-react/core";
import { WalletAccount } from "./wallet-account.tsx";
import { HistoricalEvents } from "./historical-events.tsx";
import { useDojoSDK, useModel } from "@dojoengine/sdk/react";




//images
import empty_tile from './assets/empty.png';
import empty_field_1 from './assets/placeholder_standard.png';
import empty_field_2 from './assets/placeholder_standard_2.png';
import empty_field_3 from './assets/placeholder_standard_3.png';

import unpassable_terrain_1 from './assets/unpassable_terrain_1.png';
/**
 * Main application component that provides game functionality and UI.
 * Handles entity subscriptions, state management, and user interactions.
 *
 * @param props.sdk - The Dojo SDK instance configured with the game schema
 */
function App() {
    const { useDojoStore, client, sdk } = useDojoSDK();
    const { account } = useAccount();
    const state = useDojoStore((state) => state);
    const entities = useDojoStore((state) => state.entities);

    const { spawn } = useSystemCalls();

    const entityId = useMemo(() => {
        if (account) {
            return getEntityIdFromKeys([BigInt(account.address)]);
        }
        return BigInt(0);
    }, [account]);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const subscribe = async (account: AccountInterface) => {
            const subscription = await sdk.subscribeEntityQuery({
                query: new QueryBuilder<SchemaType>()
                    .namespace("dojo_starter", (n) =>
                        n
                            // .entity("Moves", (e) =>
                            //     e.eq(
                            //         "player",
                            //         addAddressPadding(account.address)
                            //     )
                            // )
                            // .entity("Position", (e) =>
                            //     e.is(
                            //         "player",
                            //         addAddressPadding(account.address)
                            //     )
                            // )
                            .entity("Field", (e) =>
                                e.is(
                                    "battleId",
                                    1000000
                                )
                            )
                            // .entity("Field", (e) =>
                            //     e.is(
                            //         "mapId",
                            //         1000000
                            //     )
                            // )
                    )
                    .build(),
                callback: ({ error, data }) => {
                    if (error) {
                        console.error("Error setting up entity sync:", error);
                    } else if (
                        data &&
                        (data[0] as ParsedEntity<SchemaType>).entityId !== "0x0"
                    ) {
                        state.updateEntity(data[0] as ParsedEntity<SchemaType>);
                        console.log("Updated state.entities:", state.entities);
                    }
                },
            });

            unsubscribe = () => subscription.cancel();
        };

        if (account) {
            subscribe(account);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [sdk, account]);

    useEffect(() => {
        const fetchEntities = async (account: AccountInterface) => {
            try {
                await sdk.getEntities({
                    query: new QueryBuilder<SchemaType>()
                        .namespace("dojo_starter", (n) =>
                            n.entity("Field", (e) => //Moves
                                e.eq(
                                    "battleId",//"player",
                                    1000000//addAddressPadding(account.address)
                                )
                                
                            )
                        )
                        .build(),
                    callback: (resp) => {
                        if (resp.error) {
                            console.error(
                                "resp.error.message:",
                                resp.error.message
                            );
                            return;
                        }
                        if (resp.data) {
                            state.setEntities(
                                resp.data as ParsedEntity<SchemaType>[]
                            );
                            console.log("First Updated state.entities:", state.entities);
                        }
                    },
                });
            } catch (error) {
                console.error("Error querying entities:", error);
            }
        };

        if (account) {
            fetchEntities(account);
        }
    }, [sdk, account]);

    const moves = useModel(entityId as string, ModelsMapping.Moves);
    const position = useModel(entityId as string, ModelsMapping.Position);

    return (
        <div className="bg-black min-h-screen w-full p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <WalletAccount />

                {/* { <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="bg-gray-700 p-4 rounded-lg shadow-inner">
                        <div className="grid grid-cols-3 gap-2 w-full h-48">
                            <div className="col-start-2">
                                <button
                                    className="h-12 w-12 bg-gray-600 rounded-full shadow-md active:shadow-inner active:bg-gray-500 focus:outline-none text-2xl font-bold text-gray-200"
                                    onClick={async () => await spawn()}
                                >
                                    +
                                </button>
                            </div>
                            <div className="col-span-3 text-center text-base text-white">
                                Moves Left:{" "}
                                {moves ? `${moves.remaining}` : "Need to Spawn"}
                            </div>
                            <div className="col-span-3 text-center text-base text-white">
                                {position
                                    ? `x: ${position?.vec?.x}, y: ${position?.vec?.y}`
                                    : "Need to Spawn"}
                            </div>
                            <div className="col-span-3 text-center text-base text-white">
                                {moves && moves.last_direction.isSome()
                                    ? moves.last_direction.unwrap()
                                    : ""}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg shadow-inner">
                        <div className="grid grid-cols-3 gap-2 w-full h-48">
                            {[
                                {
                                    direction: new CairoCustomEnum({
                                        Up: "()",
                                    }),
                                    label: "↑",
                                    col: "col-start-2",
                                },
                                {
                                    direction: new CairoCustomEnum({
                                        Left: "()",
                                    }),
                                    label: "←",
                                    col: "col-start-1",
                                },
                                {
                                    direction: new CairoCustomEnum({
                                        Right: "()",
                                    }),
                                    label: "→",
                                    col: "col-start-3",
                                },
                                {
                                    direction: new CairoCustomEnum({
                                        Down: "()",
                                    }),
                                    label: "↓",
                                    col: "col-start-2",
                                },
                            ].map(({ direction, label, col }, idx) => (
                                <button
                                    className={`${col} h-12 w-12 bg-gray-600 rounded-full shadow-md active:shadow-inner active:bg-gray-500 focus:outline-none text-2xl font-bold text-gray-200`}
                                    key={idx}
                                    onClick={async () => {
                                        await client.actions.move(
                                            account!,
                                            direction
                                        );
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div> } */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "left", // Center the row
                        gap: "10px", // Space between buttons
                        padding: "10px", // Optional padding
                    }}
                >
                    {["Start Battle", "Reset Battle", "Complete Turn"].map((name, index) => (
                        <button
                            key={index}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#006400", // Dark green background
                                color: "white", // White text
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                transition: "background-color 0.3s ease", // Smooth transition effect
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.backgroundColor = "#32CD32"; // Light green on click
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor = "#006400"; // Reset to dark green
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#006400"; // Reset if the mouse leaves the button
                            }}
                            onClick={() => {
                                console.log(`${name} clicked`); // Log the button click
                                if (name == "Start Battle"){
                                    const startBattle = async () => {
                                        console.log("client.actions:", client.actions);
                                        await client.actions.generateBattle(account!);
                            
                                 
                                    };
                            
                                    startBattle(); // Explicitly invoke the function

                                }
                                if (name == "Reset Battle"){
                                    const startBattle2 = async () => {
                                        console.log("client.actions:", client.actions);
                                    
                            
                                        await client.actions.populateWorld(account!);
                                    };
                            
                                    startBattle2(); // Explicitly invoke the function
                                }
                                if (name == "Complete Turn"){
                                    const startBattle3 = async () => {
                                        console.log("client.actions:", client.actions);
                                    
                            
                                        await client.actions.resetBattle(account!);
                                    };
                            
                                    startBattle3(); // Explicitly invoke the function
                                }
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(10, 100px)`, // 10 columns of 100px width
                        gridTemplateRows: `repeat(10, 100px)`,   // 10 rows of 100px height
                        gap: "0", // No additional gaps, only borders
                    }}
                >
                    {Object.entries(entities).map(([entityId, entity]) => {
                        const transparentImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAf8lmt8AAAAASUVORK5CYII=";
                        const fieldId = entity.models.dojo_starter.Field?.fieldId;
                        const fieldType = entity.models.dojo_starter.Field?.fieldType;

                        // Placeholder for multiple image URLs
                        var images = [
                            Math.random() < 0.33 ? empty_field_1 : Math.random() < 0.5 ? empty_field_2 : empty_field_3, // Base layer
                            transparentImage, // Layer on top
                            transparentImage, // Optional additional layer
                        ];

                        if (fieldType == 1) {
                            images = [
                                unpassable_terrain_1, // Base layer
                                transparentImage, // Layer on top
                                transparentImage, // Optional additional layer
                            ];
                        }

                        // Calculate x and y for grid placement
                        const x = fieldId % 10; // Column (0-9)
                        const y = Math.floor(fieldId / 10); // Row (0-9)

                        return (
                            <div
                                key={entityId}
                                style={{
                                    gridColumn: x + 1, // Grid columns start at 1
                                    gridRow: y + 1,    // Grid rows start at 1
                                    position: "relative", // Allows stacking inside this square
                                    width: "100px",
                                    height: "100px",
                                    border: "1px solid black", // Optional border for separation
                                    boxSizing: "border-box", // Include borders in size calculation
                                }}
                                title={`x: ${x}, y: ${y}`} // Tooltip for debugging
                            >
                                {images.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`x: ${x}, y: ${y}`}
                                        style={{
                                            position: "absolute", // Stack on top of each other
                                            top: 0,
                                            left: 0,
                                            width: "100%", // Match the square size
                                            height: "100%", // Match the square size
                                            objectFit: "cover", // Ensures images fit the square
                                            zIndex: index, // Controls stacking order
                                        }}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>             
                
                {/* // Here sdk is passed as props but this can be done via contexts */}
                <HistoricalEvents />
            </div>
        </div>
    );
}

export default App;
