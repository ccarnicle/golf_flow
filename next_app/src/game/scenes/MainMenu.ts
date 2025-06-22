import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    logoTween: Phaser.Tweens.Tween | null;
    diceGameButton: GameObjects.Text;
    isMobile: boolean = false;
    uiCamera: Phaser.Cameras.Scene2D.Camera;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Check if running on mobile
        this.isMobile = this.scale.width < 768 || this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        
        // Add background image that fills the screen
        this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
        this.background.setDisplaySize(this.scale.width, this.scale.height);

        // Responsive logo positioning
        const logoY = this.isMobile ? this.scale.height / 3 : 300;
        this.logo = this.add.image(this.scale.width / 2, logoY, 'logo').setDepth(100);
        
        // Scale the logo based on screen size
        const logoScale = this.isMobile ? 0.7 : 1;
        this.logo.setScale(logoScale);

        // Responsive button positioning
        const buttonY = this.isMobile ? this.scale.height * 0.65 : 520;
        this.diceGameButton = this.add.text(this.scale.width / 2, buttonY, 'Play Dice Game', {
            fontFamily: 'Arial', 
            fontSize: this.isMobile ? 20 : 24, 
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.startDiceGame())
        .on('pointerover', () => this.diceGameButton.setStyle({ backgroundColor: '#333333' }))
        .on('pointerout', () => this.diceGameButton.setStyle({ backgroundColor: '#000000' }));

        // The main camera should not render the UI elements.
        this.cameras.main.ignore([this.logo, this.diceGameButton]);

        // Add a new camera for the UI
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.ignore(this.background);

        // Add resize handler
        this.scale.on('resize', this.resize, this);

        EventBus.emit('current-scene-ready', this);
    }
    
    resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;
        
        this.isMobile = width < 768;
        
        // Update background
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);

        // Update UI camera
        this.uiCamera.setSize(width, height);
        
        // Update logo
        const logoY = this.isMobile ? height / 3 : 300;
        const logoScale = this.isMobile ? 0.7 : 1;
        this.logo.setPosition(width / 2, logoY);
        this.logo.setScale(logoScale);
        
        // Update button
        const buttonY = this.isMobile ? height * 0.65 : 520;
        this.diceGameButton.setPosition(width / 2, buttonY);
        this.diceGameButton.setFontSize(this.isMobile ? 20 : 24);
    }
    
    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    startDiceGame() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.diceGameButton.disableInteractive();

        const zoomLevel = 1.4;
        const duration = 1000;

        this.tweens.add({
            targets: this.cameras.main,
            zoom: zoomLevel,
            scrollY: 100,
            duration: duration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.scene.start('DiceGameScene', { 
                    zoom: zoomLevel, 
                    scrollY: this.cameras.main.scrollY 
                });
            }
        });
    }

    moveLogo (reactCallback: ({ x, y }: { x: number, y: number }) => void)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        } 
        else
        {
            const endX = this.isMobile ? this.scale.width * 0.7 : 750;
            const endY = this.isMobile ? this.scale.height * 0.1 : 80;
            
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: endX, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: endY, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
