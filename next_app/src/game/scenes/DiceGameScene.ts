import Phaser, { GameObjects } from 'phaser';
import { EventBus } from '../EventBus';

export class DiceGameScene extends Phaser.Scene {
    private swingBatButton: Phaser.GameObjects.Container;
    private isRolling: boolean = false;
    private background: Phaser.GameObjects.Image;
    private isMobile: boolean = false;
    private uiCamera: Phaser.Cameras.Scene2D.Camera;
    private player: Phaser.GameObjects.Sprite;
    private title: GameObjects.Text;
    
    constructor() {
        super({ key: 'DiceGameScene' });
    }
    
    preload() {
        // Load the spritesheet with correct frame dimensions
    }
    
    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        // Check if running on mobile
        this.isMobile = this.scale.width < 768 || this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        
        // Set background to fit screen
        this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, 'field_bg');
        this.background.setDisplaySize(this.scale.width, this.scale.height);

        // Set game title with responsive positioning
        const titleY = 250;
        const textWrapWidth = this.scale.width * 0.9;
        const fullText = "It's time to play some ball! Hit that Swing Bat button below to take your swing!";

        this.title = this.add.text(this.scale.width / 2, titleY, fullText, {
            fontFamily: 'Comic Sans MS',
            fontSize: '36px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: textWrapWidth }
        }).setOrigin(0.5);

        // Add back button
        const backButton = this.add.text(50, 50, '← Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.goBackToMenu());

        // Create roll button with responsive positioning
        const buttonY = this.isMobile ? this.scale.height / 2 + 100 : 450;
        this.swingBatButton = this.createButton(this.scale.width / 2, buttonY, 'Swing Bat', () => this.swingBat());

        // --- Player Animation Setup ---
        this.anims.create({
            key: 'swing',
            frames: this.anims.generateFrameNames('player_swing', { prefix: 'swing_', start: 0, end: 5 }),
            frameRate: 10,
            repeat: 0
        });

        const playerScale = 0.3; // Adjust scale as needed
        this.player = this.add.sprite(this.scale.width / 2 - 40, this.scale.height - 60, 'player_swing', 'swing_0').setScale(playerScale);

        const uiElements = [this.title, backButton, this.swingBatButton, this.player];

        this.cameras.main.ignore(uiElements);
        
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.ignore(this.background);

        // Add resize handler to adjust layout when the screen size changes
        this.scale.on('resize', this.resize, this);

        EventBus.on('wager-reveal-submitted', this.handleWagerSubmitted, this);
        EventBus.on('wager-reveal-sealed', this.handleWagerSealed, this);

        this.events.on('shutdown', () => {
            EventBus.off('wager-reveal-submitted', this.handleWagerSubmitted, this);
            EventBus.off('wager-reveal-sealed', this.handleWagerSealed, this);
        });

        // Emit scene ready event
        EventBus.emit('current-scene-ready', this);
    }
    
    goBackToMenu() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('MainMenu');
        });
    }

    // Handle resize events for responsiveness
    resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;
        
        this.isMobile = width < 768;
        
        // Update background
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);
        
        this.uiCamera.setSize(width, height);

        // Update title
        if (this.title) {
            const titleY = 150;
            const textWrapWidth = width * 0.9;
            this.title.setPosition(width / 2, titleY);
            this.title.setWordWrapWidth(textWrapWidth);
            this.title.setFontSize(this.isMobile ? '28px' : '40px');
        }
        
        // Update button position
        const buttonY = this.isMobile ? height / 2 + 100 : 450;
        this.swingBatButton.setPosition(width / 2, buttonY);
    }
    
    update() {
        // Game loop - will be used for animations later
    }

    handleWagerSubmitted() {
        this.title.setText("Swinging for the fences! Wait a few moments while we get an official distance measurement...");
        this.player.play('swing');
    }

    handleWagerSealed(payoutAmount: number) {
        this.isRolling = false;

        this.swingBatButton.setVisible(false);
        
        const payout = payoutAmount.toFixed(2);
        const resultsText = `Results are in! You won ${payout} $FLOW\n\nThanks for playing, hit Back to play again`;
        this.title.setText(resultsText);
    }

    private swingBat() {
        if (this.isRolling) return;
        
        EventBus.emit('swing-bat-clicked');
        
        console.log('Starting swing');
        this.isRolling = true;
        
        this.swingBatButton.disableInteractive();
        const buttonBackground = this.swingBatButton.getAt(0) as Phaser.GameObjects.Graphics;
        const buttonWidth = this.swingBatButton.width;
        const buttonHeight = this.swingBatButton.height;
        const cornerRadius = 10;
        buttonBackground.fillStyle(0x555555, 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    }

    createButton(x: number, y: number, text: string, onClick: () => void): GameObjects.Container {
        const buttonPadding = { x: 20, y: 10 };
        const cornerRadius = 10;
        const fontSize = this.isMobile ? '20px' : '24px';
    
        const sampleText = this.add.text(0, 0, text, {
            fontFamily: 'Comic Sans MS',
            fontSize: fontSize,
        }).setVisible(false);
    
        const buttonWidth = sampleText.width + buttonPadding.x * 2;
        const buttonHeight = sampleText.height + buttonPadding.y * 2;
        sampleText.destroy();
    
        const buttonContainer = this.add.container(x, y);
    
        const buttonBackground = this.add.graphics();
        buttonBackground.fillStyle(0x000000, 1);
        buttonBackground.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'Comic Sans MS',
            fontSize: fontSize,
            color: '#ffffff',
        }).setOrigin(0.5);
    
        buttonContainer.add([buttonBackground, buttonText]);
    
        buttonContainer.setSize(buttonWidth, buttonHeight);
        buttonContainer.setInteractive({ useHandCursor: true })
            .on('pointerdown', onClick)
            .on('pointerover', () => buttonBackground.fillStyle(0x333333, 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius))
            .on('pointerout', () => buttonBackground.fillStyle(0x000000, 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius));
    
        return buttonContainer;
    }
} 