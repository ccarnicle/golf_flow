import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class DiceGameScene extends Phaser.Scene {
    private rollButton: Phaser.GameObjects.Text;
    private scoreText: Phaser.GameObjects.Text;
    private isRolling: boolean = false;
    private background: Phaser.GameObjects.Image;
    private isMobile: boolean = false;
    private zoomLevel: number = 1;
    private scrollY: number = 0;
    private uiCamera: Phaser.Cameras.Scene2D.Camera;
    private player: Phaser.GameObjects.Sprite;
    
    constructor() {
        super({ key: 'DiceGameScene' });
    }
    
    init (data: { zoom?: number, scrollY?: number })
    {
        this.zoomLevel = data.zoom || 1;
        this.scrollY = data.scrollY || 0;
    }
    
    preload() {
        // Load the spritesheet with correct frame dimensions
    }
    
    create() {
        this.cameras.main.setZoom(this.zoomLevel);
        this.cameras.main.setScroll(this.cameras.main.scrollX, this.scrollY);

        // Check if running on mobile
        this.isMobile = this.scale.width < 768 || this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        
        // Set background to fit screen
        this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
        this.background.setDisplaySize(this.scale.width, this.scale.height);

        // Set game title with responsive positioning
        const titleY = this.isMobile ? 150 : 200;
        const title = this.add.text(this.scale.width / 2, titleY, 'FLOW Onchain Craps', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setName('title');

        // Add back button
        const backButton = this.add.text(50, 50, '← Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('MainMenu'));

        // Create roll button with responsive positioning
        const buttonY = this.isMobile ? this.scale.height / 2 + 100 : 450;
        this.rollButton = this.add.text(this.scale.width / 2, buttonY, 'Roll Dice', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.rollDice())
        .on('pointerover', () => this.rollButton.setStyle({ backgroundColor: '#333333' }))
        .on('pointerout', () => this.rollButton.setStyle({ backgroundColor: '#000000' }));

        // Create score text with responsive positioning
        const scoreY = this.isMobile ? this.scale.height / 2 + 170 : 550;
        this.scoreText = this.add.text(this.scale.width / 2, scoreY, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // --- Player Animation Setup ---
        this.anims.create({
            key: 'swing',
            frames: this.anims.generateFrameNames('player_swing', { prefix: 'swing_', start: 0, end: 5 }),
            frameRate: 10,
            repeat: 0
        });

        const playerScale = 0.3; // Adjust scale as needed
        this.player = this.add.sprite(this.scale.width / 2 - 40, this.scale.height - 60, 'player_swing', 'swing_0').setScale(playerScale);

        const uiElements = [title, backButton, this.rollButton, this.scoreText, this.player];

        this.cameras.main.ignore(uiElements);
        
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.ignore(this.background);

        // Add resize handler to adjust layout when the screen size changes
        this.scale.on('resize', this.resize, this);

        // Emit scene ready event
        EventBus.emit('current-scene-ready', this);
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
        const title = this.children.getByName('title') as Phaser.GameObjects.Text;
        if (title) {
            title.setPosition(width / 2, this.isMobile ? 150 : 200);
            title.setFontSize(this.isMobile ? 24 : 32);
        }
        
        // Update button position
        const buttonY = this.isMobile ? height / 2 + 100 : 450;
        this.rollButton.setPosition(width / 2, buttonY);
        this.rollButton.setFontSize(32);
        
        // Update score text position
        const scoreY = this.isMobile ? height / 2 + 170 : 550;
        this.scoreText.setPosition(width / 2, scoreY);
        this.scoreText.setFontSize(32);
    }
    
    update() {
        // Game loop - will be used for animations later
    }
    
    // Helper method to update score text (used by React component)
    updateScoreText(text: string) {
        if (this.scoreText) {
            this.scoreText.setText(text);
        }
    }

    private rollDice() {
        if (this.isRolling) return;
        
        this.events.emit('diceRollStarted');
        
        console.log('Starting dice roll');
        this.isRolling = true;
        this.rollButton.setStyle({ backgroundColor: '#666666' });
        
        this.player.play('swing');

        // Create a timer for 3 seconds of rolling
        const rollDuration = 3000; // 3 seconds

        this.time.delayedCall(rollDuration, () => {
            this.isRolling = false;
            this.rollButton.setStyle({ backgroundColor: '#000000' });
            
            // Emit a custom event that the roll is complete
            console.log('Emitting diceRollComplete event');
            this.events.emit('diceRollComplete');
        });
    }
} 