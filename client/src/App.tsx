import { useEffect, useMemo, useState } from "react";
import { ParsedEntity, QueryBuilder } from "@dojoengine/sdk";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { AccountInterface, addAddressPadding, CairoCustomEnum } from "starknet";

import { ModelsMapping, SchemaType } from "./typescript/models.gen.ts";
import { useSystemCalls } from "./useSystemCalls.ts";
import { useAccount } from "@starknet-react/core";
import { WalletAccount } from "./wallet-account.tsx";
import { HistoricalEvents } from "./historical-events.tsx";
import { useDojoSDK, useModel } from "@dojoengine/sdk/react";

// Images
import empty_tile from './assets/empty.png';
import empty_field_1 from './assets/placeholder_standard.png';
import empty_field_2 from './assets/placeholder_standard_2.png';
import empty_field_3 from './assets/placeholder_standard_3.png';
import unpassable_terrain_1 from './assets/unpassable_terrain_1.png';
import spawning_pool_p1 from './assets/spawning_pool_p1.png';
import spawning_pool_p2 from './assets/spawning_pool_p2.png';

function App() {
    const { useDojoStore, client, sdk } = useDojoSDK();
    const { account } = useAccount();
    const state = useDojoStore((state) => state);
    const entities = useDojoStore((state) => state.entities);

    //GAMESTATE
    const [myTurn, setMyturn] = useState(true);

    // SELECTION
    const [selectedFieldx, setSelectedFieldx] = useState(-1);
    const [selectedFieldy, setSelectedFieldy] = useState(-1);
    const [selectedFieldId, setSelectedFieldId] = useState(-1);
    const [selectedFieldType, setSelectedFieldType] = useState(-1);
    const [selectedFieldOwner, setSelectedFieldOwner] = useState(false);
    const [selectedFieldHp, setSelectedFieldHp] = useState(0);
    const [selectedUnitType, setSelectedUnitType] = useState(-1);
    const [selectedUnitdHp, setSelectedUnitHp] = useState(0);
    const [selectedFieldCanMove, setSelectedFieldCanMove] = useState(false);



    // CONSISTENT GRASS
    const [grass_state, setGrass_state] = useState(new Array(100).fill(-1));
    const updateGrassState = (index, value) => {
        setGrass_state((prevArray) => {
            const newArray = [...prevArray]; // Create a shallow copy
            newArray[index] = value; // Update the desired index
            return newArray;
        });
    };

    // INFO TEXT
    const [infoTextTitle, setInfoTextTitle] = useState("Getting Started");
    const [infoText, setInfoText] = useState("Join Battle to initialize a world, once two  playershave connected each players main base will spawn and the game will begin");
    const [bothPlayersJoined, setBothPlayersJoined] = useState(false);

    const { spawn } = useSystemCalls();

    const entityId = useMemo(() => {
        if (account) {
            return getEntityIdFromKeys([BigInt(account.address)]);
        }
        return BigInt(0);
    }, [account]);

    useEffect(() => {
        let unsubscribe;

        const subscribe = async (account) => {
            const subscription = await sdk.subscribeEntityQuery({
                query: new QueryBuilder<SchemaType>()
                    .namespace("dojo_starter", (n) =>
                        n.entity("Field", (e) =>
                            e.is("battleId", 1000000)
                        )
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
        const fetchEntities = async (account) => {
            try {
                await sdk.getEntities({
                    query: new QueryBuilder<SchemaType>()
                        .namespace("dojo_starter", (n) =>
                            n.entity("Field", (e) =>
                                e.eq("battleId", 1000000)
                            )
                        )
                        .build(),
                    callback: (resp) => {
                        if (resp.error) {
                            console.error("resp.error.message:", resp.error.message);
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

                {/* Button Row */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "left",
                        gap: "10px",
                        padding: "10px",
                    }}
                >
                    {["Join Battle", "Reset Battle", "Complete Turn"].map((name, index) => (
                        <button
                            key={index}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#006400",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                transition: "background-color 0.3s ease",
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.backgroundColor = "#32CD32";
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor = "#006400";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#006400";
                            }}
                            onClick={() => {
                                console.log(`${name} clicked`);
                                if (name === "Join Battle") {
                                    const joinBattle = async () => {
                                        console.log("client.actions:", client.actions);
                                        await client.actions.joinBattle(account!);
                                    };
                                    joinBattle();
                                }
                                if (name === "Reset Battle") {
                                    const resetBattle = async () => {
                                        console.log("client.actions:", client.actions);
                                        await client.actions.resetBattle(account!);
                                    };
                                    resetBattle();
                                }
                                if (name === "Complete Turn") {
                                    console.log("Complete Turn clicked");
                                }
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>

                {/* Layout for Grid and INFO Container */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        gap: "20px",
                        alignItems: "flex-start",
                        boxSizing: "border-box",
                    }}
                >
                    {/* Grid */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(10, 100px)`,
                            gridTemplateRows: `repeat(10, 100px)`,
                            gap: "0",
                            boxSizing: "border-box",
                        }}
                    >
                        {Object.entries(entities).map(([entityId, entity]) => {
                            const transparentImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAf8lmt8AAAAASUVORK5CYII=";
                            const fieldId = entity.models.dojo_starter.Field?.fieldId;
                            const fieldType = entity.models.dojo_starter.Field?.fieldType;

                            const structureType = entity.models.dojo_starter.Field?.structureType;
                            const structureHp = entity.models.dojo_starter.Field?.structureHp;

                            const unitType = entity.models.dojo_starter.Field?.unitType;

                            const ownedBy = entity.models.dojo_starter.Field?.occupiedBy;

                            const myAddress = addAddressPadding(account!.address);
                            const rand1 = Math.random() < 0.33;
                            const rand2 = Math.random() < 0.5;
                            var ttype = 0;
                            if (structureType == 1 && !bothPlayersJoined){
                                setBothPlayersJoined(true);
                                setInfoTextTitle("Ready To Start");
                                setInfoText("Click on a tile in the game for more Information on it");
                            }
                            ttype = rand1 ? 0 : (rand2 ? 1 : 2);
                            if (grass_state[fieldId] < 0) {
                                updateGrassState(fieldId, ttype);
                            }
                            var images = [
                                grass_state[fieldId] === 0 ? empty_field_1 : grass_state[fieldId] === 1 ? empty_field_2 : empty_field_3,
                                structureType === 0 ? transparentImage : ((ownedBy === myAddress) ?
                                    (structureType === 1 ? spawning_pool_p1 : spawning_pool_p1) :
                                    (structureType === 1 ? spawning_pool_p2 : spawning_pool_p2)),
                                transparentImage,
                            ];

                            if (fieldType === 1) {
                                images = [
                                    unpassable_terrain_1,
                                    transparentImage,
                                    transparentImage,
                                ];
                            }

                            const x = fieldId % 10;
                            const y = Math.floor(fieldId / 10);

                            var highlightForMovement = false;
                            if ((x-1 == selectedFieldx || x+1 == selectedFieldx) && (y == selectedFieldy) ){
                                if (structureType == 0 && unitType  == 0){
                                    if (fieldType == 0){
                                        if (selectedFieldCanMove)
                                            highlightForMovement = true;
                                    }
                                }
                            }
                            if ((x == selectedFieldx ) && (y-1 == selectedFieldy || y+1 == selectedFieldy) ){
                                if (structureType == 0 && unitType  == 0){
                                    if (fieldType == 0){
                                        if (selectedFieldCanMove)
                                            highlightForMovement = true;
                                    }
                                }
                            }
                            return (
                                <div
                                    key={entityId}
                                    style={{
                                        gridColumn: x + 1,
                                        gridRow: y + 1,
                                        position: "relative",
                                        width: "100px",
                                        height: "100px",
                                        border: fieldId === selectedFieldId ? "2px solid blue" : highlightForMovement ? ("2px solid blue") : "1px solid black",
                                        boxSizing: "border-box",
                                        cursor: "pointer",
                                    }}
                                    title={`x: ${x}, y: ${y}, st: ${structureType}, sh: ${structureHp}, owner: ${ownedBy}, / ${myAddress}`}
                                    onClick={() => {
                                        setSelectedFieldx(x);
                                        setSelectedFieldy(y);
                                        setSelectedFieldId(fieldId);
                                        setSelectedFieldType(structureType);
                                        setSelectedFieldHp(0);
                                        setSelectedFieldOwner(true);
                                        setInfoTextTitle("Terrain");
                                        

                                        //info texts
                                        if (fieldType == 0){
                                            setInfoText("An empty field of grass, can be moved onto");
                                        }
                                        if (fieldType == 1){
                                            setInfoText("Unpassable terrain, can not be moved onto or through");
                                        }
                                        if (structureType == 1 || structureType == 2){
                                            if (ownedBy == myAddress){
                                                setInfoText("Your spawning pool, can be used to summon units");
                                            } else {
                                                setInfoText("Enemy spawning pool, can be used to summon units");
                                            }
                                            setInfoTextTitle("Structure");
                                            setSelectedFieldHp(structureHp);
                                            if (myAddress == ownedBy){
                                                setSelectedFieldOwner(true);
                                            } else {
                                                setSelectedFieldOwner(false);
                                            }                                           
                                        }
                                        
                                        if (unitType == 1 || structureType == 2){
                                            if (ownedBy == myAddress){
                                                setInfoText("Your spawning pool, can be used to summon units");
                                            } else {
                                                setInfoText("Enemy spawning pool, can be used to summon units");
                                            }
                                            setInfoTextTitle("Structure");
                                            if (myAddress == ownedBy){
                                                setSelectedFieldOwner(true);
                                            } else {
                                                setSelectedFieldOwner(false);
                                            }
                                            setSelectedFieldCanMove(true);                                           
                                        }

                                    }}
                                >
                                    {images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={structureHp !== 0 ? '' : structureType}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                zIndex: index,
                                            }}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* INFO Container */}
                    <div
                        style={{
                            width: "300px",
                            height: "300px",
                            backgroundColor: selectedFieldOwner ? "#8FBC8F" : "#8B0000", // Softer green or darkish red
                            border: `5px solid ${selectedFieldOwner ? "#006400" : "#8B0000"}`, // Border matches the background color
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            boxSizing: "border-box",
                            overflow: "hidden",
                        }}
                    >
                        {/* Top field */}
                        <div
                            style={{
                                width: "100%",
                                height: "30px",
                                backgroundColor: "#8FBC8F",
                                borderBottom: "2px solid #006400",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                fontWeight: "bold",
                                color: "#006400",
                            }}
                        >
                            {infoTextTitle} 
                        </div>

                        {/* Multiline text field */}
                        <div
                            style={{
                                flex: 1,
                                width: "100%",
                                backgroundColor: "#8FBC8F",
                                border: "2px solid #006400",
                                padding: "10px",
                                boxSizing: "border-box",
                                overflowY: "auto",
                                color: "#006400",
                                fontSize: "14px",
                            }}
                        >
                        {account? infoText : "Connect a Wallet to get started"} 
                        </div>
                        {/* Stats */}
                        <div
                            style={{
                                flex: 1,
                                width: "100%",
                                height: "50%",
                                backgroundColor: "#8FBC8F",
                                border: "2px solid #006400",
                                padding: "10px",
                                boxSizing: "border-box",
                                overflowY: "auto",
                                color: "#006400",
                                fontSize: "14px",
                            }}
                        >
                        {selectedFieldHp > 0 ? `HP ${selectedFieldHp}` : ""}
                        </div>
                        {/* Buttons */}
                        <div
                            style={{
                                display: "flex", // Arrange buttons in a row
                                justifyContent: "space-evenly", // Even spacing between buttons
                                alignItems: "center", // Align buttons vertically
                                gap: "10px", // Space between buttons
                                padding: "10px",
                            }}
                        >
                            {["Box 1", "Box 2", "Box 3", "Box 4"].map((boxName, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        width: "80px", // Fixed width for buttons
                                        height: "40px", // Fixed height for buttons
                                        backgroundColor: "#006400", // Dark green background
                                        color: "white", // White text
                                        borderRadius: "5px", // Rounded corners
                                        cursor: "pointer", // Indicate clickable
                                        fontSize: "14px", // Font size
                                        transition: "background-color 0.2s ease", // Smooth transition effect
                                        userSelect: "none", // Prevent text selection
                                    }}
                                    onClick={(e) => {
                                        const target = e.currentTarget; // Save reference to the target
                                        target.style.backgroundColor = "#32CD32"; // Light green flash
                                        setTimeout(() => {
                                            target.style.backgroundColor = "#006400"; // Reset to dark green
                                        }, 150); // Quick flash duration (150ms)
                                    }}
                                >
                                    {boxName}
                                </div>
                            ))}
                        </div>
                        {/* Turn Indicator */}
                        <div
                            style={{
                                flex: 1,
                                width: "100%",
                                height: "50%",
                                backgroundColor: myTurn ? "#8FBC8F" : "#8B0000", // Softer green if true, dark red if false
                                border: "2px solid #006400",
                                padding: "10px",
                                boxSizing: "border-box",
                                overflowY: "auto",
                                color: myTurn ? "#006400" : "#FFFFFF", // Text color: Dark green for true, white for false
                                fontSize: "14px",
                                textAlign: "center", // Center the text horizontally
                                display: "flex", // Center the text vertically
                                alignItems: "center", // Center the text vertically
                                justifyContent: "center", // Center the text horizontally
                            }}
                        >
                            {myTurn ? "Your Turn" : "Enemy's Turn"}
                        </div>
                    </div>




                </div>

                <HistoricalEvents />
            </div>
        </div>
    );
}

export default App;