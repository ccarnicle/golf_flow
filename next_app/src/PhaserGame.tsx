import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';
import { DiceGame } from './game/components/DiceGame';

export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps
{
    currentActiveScene?: (scene_instance: Phaser.Scene) => void
}

interface InputBox
{
    x: number;
    y: number;
    width: number;
    height: number;
    initialValue: string;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene }, ref)
{
    const game = useRef<Phaser.Game | null>(null!);
    const [currentScene, setCurrentScene] = useState<Phaser.Scene | null>(null);
    const [inputBox, setInputBox] = useState<InputBox | null>(null);

    useLayoutEffect(() =>
    {
        if (game.current === null)
        {
            console.log('Initializing Phaser game');
            game.current = StartGame("game-container");

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }
        }

        return () =>
        {
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() =>
    {
        const onSceneReady = (scene_instance: Phaser.Scene) =>
        {
            console.log('Scene ready:', {
                key: scene_instance.scene.key,
                isDiceGame: scene_instance.scene.key === 'DiceGameScene'
            });
            
            setCurrentScene(scene_instance);
            setInputBox(null); // Hide input box on scene change
            
            if (currentActiveScene && typeof currentActiveScene === 'function')
            {
                currentActiveScene(scene_instance);
            }

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: scene_instance });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: scene_instance };
            }
        };

        const onShowInput = (data: InputBox) =>
        {
            setInputBox(data);
            EventBus.emit('input-active');
        };

        EventBus.on('current-scene-ready', onSceneReady);
        EventBus.on('show-number-input', onShowInput);
        
        return () =>
        {
            EventBus.removeListener('current-scene-ready', onSceneReady);
            EventBus.removeListener('show-number-input', onShowInput);
        }
    }, [currentActiveScene, ref]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        EventBus.emit('number-input-changed', e.target.value);
    };

    const handleInputBlur = () =>
    {
        setInputBox(null);
        EventBus.emit('input-inactive');
    };

    const isDiceGame = currentScene?.scene.key === 'DiceGameScene';
    console.log('Rendering PhaserGame:', { 
        isDiceGame,
        currentSceneKey: currentScene?.scene.key 
    });

    const numberInputArrowStyle = `
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
    `;

    return (
        <div className="game-wrapper">
            <div className="game-container-wrapper">
                <style>{numberInputArrowStyle}</style>
                <div id="game-container" style={{ position: 'relative' }}></div>
                {isDiceGame && currentScene && (
                    <DiceGame scene={currentScene} />
                )}
                {inputBox && (
                    <input
                        type="number"
                        defaultValue={inputBox.initialValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        style={{
                            position: 'absolute',
                            top: `${inputBox.y}px`,
                            left: `${inputBox.x}px`,
                            width: `${inputBox.width}px`,
                            height: `${inputBox.height}px`,
                            fontFamily: 'Comic Sans MS',
                            fontSize: '38px',
                            color: '#FFFFFF',
                            backgroundColor: 'transparent',
                            border: 'none',
                            textAlign: 'center',
                            outline: 'none',
                        }}
                        autoFocus
                    />
                )}
            </div>
        </div>
    );
});
