import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';

export class TicketCounterScene extends Scene {
    background: GameObjects.Image;
    isMobile: boolean = false;
    playButton: GameObjects.Container;
    buyBatButton: GameObjects.Container;
    inputText: GameObjects.Text;
    welcomeText: GameObjects.Text;
    typewriterAnimation: Phaser.Time.TimerEvent;

    constructor() {
        super('TicketCounterScene');
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.isMobile = this.scale.width < 768 || this.sys.game.device.os.android || this.sys.game.device.os.iOS;

        this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, 'ticket_counter');
        this.background.setDisplaySize(this.scale.width, this.scale.height);

        const gridCellSize = 28.8;

        // --- Typewriter Text ---
        const textX = (5 - 1) * gridCellSize;
        const textY = ((7 - 1) * gridCellSize) + 10;
        const textWrapWidth = (17 - 5 + 1) * gridCellSize;
        const fullText = 'Welcome young buck, ready to swing for the fences?! How many tickets would you like to purchase?';
        this.welcomeText = this.add.text(textX, textY, '', {
            fontFamily: 'Comic Sans MS',
            fontSize: '22px',
            color: '#111111',
            wordWrap: { width: textWrapWidth }
        });
        this.animateText(this.welcomeText, fullText);

        // --- Number Input Area ---
        const inputX = (2 - 1) * gridCellSize;
        const inputY = (17 - 1) * gridCellSize;
        const inputWidth = (5 - 2 + 1) * gridCellSize;
        const inputHeight = (19 - 17 + 1) * gridCellSize;

        const inputRect = this.add.rectangle(inputX, inputY, inputWidth, inputHeight, 0x000000, 0.5)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        this.inputText = this.add.text(inputX + inputWidth / 2, inputY + inputHeight / 2, '0', {
            fontFamily: 'Comic Sans MS',
            fontSize: '40px',
            color: '#FFFFFF',
        }).setOrigin(0.5);

        inputRect.on('pointerdown', () => {
            const scaleX = this.scale.displaySize.width / this.scale.gameSize.width;
            const scaleY = this.scale.displaySize.height / this.scale.gameSize.height;

            EventBus.emit('show-number-input', {
                x: inputX * scaleX,
                y: inputY * scaleY,
                width: inputWidth * scaleX,
                height: inputHeight * scaleY,
                initialValue: this.inputText.text
            });
        });

        EventBus.on('number-input-changed', (value: string) => {
            this.inputText.setText(value);
        });

        EventBus.on('input-active', () => {
            this.inputText.setVisible(false);
        });

        EventBus.on('input-inactive', () => {
            this.inputText.setVisible(true);
        });

        EventBus.on('transaction-submitted', () => {
            if (this.typewriterAnimation) {
                this.typewriterAnimation.destroy();
            }
            this.animateText(this.welcomeText, "Good luck young buck, you're gonna need it. You have one swing to knock it out of the park!");
            const text = this.playButton.getAt(1) as GameObjects.Text;
            text.setText('Verifying...');
            this.playButton.disableInteractive();
        });

        EventBus.on('transaction-sealed', () => {
            const text = this.playButton.getAt(1) as GameObjects.Text;
            text.setText('Play Ball');
            this.playButton.off('pointerdown');
            this.playButton.setInteractive()
            .on('pointerdown', () => this.goToGameScene());
        });

        // --- Buttons ---
        const buttonY = this.isMobile ? this.scale.height * 0.8 : 600;
        this.playButton = this.createButton(this.scale.width / 2, buttonY, 'Buy Tickets', () => this.buyTickets());

        this.buyBatButton = this.createButton(0, 0, 'Buy A Bat', () => this.goToBatSalesScene());
        const buyBatButtonY = this.playButton.y + this.playButton.height / 2 + 30 + this.buyBatButton.height / 2;
        this.buyBatButton.setPosition(this.scale.width / 2, buyBatButtonY);

        const backButton = this.add.text(50, 50, '← Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.goBackToMenu());

        this.scale.on('resize', this.resize, this);
        EventBus.emit('current-scene-ready', this);
    }

    createButton(x: number, y: number, text: string, onClick: () => void): GameObjects.Container {
        const buttonPadding = { x: 20, y: 10 };
        const cornerRadius = 10;
        const fontSize = this.isMobile ? '20px' : '24px';
    
        // Determine button size based on the longest text 'Buy Tickets'
        const sampleText = this.add.text(0, 0, 'Buy Tickets', {
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

    animateText(textObject: Phaser.GameObjects.Text, text: string) {
        if (this.typewriterAnimation) {
            this.typewriterAnimation.destroy();
        }
        textObject.text = '';
        let i = 0;
        this.typewriterAnimation = this.time.addEvent({
            delay: 50,
            callback: () => {
                textObject.text += text[i];
                i++;
            },
            repeat: text.length - 1
        });
    }

    buyTickets() {
        EventBus.emit('play-game-clicked', { amount: this.inputText.text });
    }

    goToGameScene() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('DiceGameScene');
        });
    }

    goToBatSalesScene() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('BatSalesScene');
        });
    }

    goBackToMenu() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('MainMenu');
        });
    }

    resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.isMobile = width < 768;

        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);
        
        // const buttonY = this.isMobile ? height * 0.8 : 600;
        // this.playButton.setPosition(width / 2, buttonY);
        
        // if (this.buyBatButton) {
        //     const buyBatButtonY = this.playButton.y + this.playButton.height / 2 + 30 + this.buyBatButton.height / 2;
        //     this.buyBatButton.setPosition(this.playButton.x, buyBatButtonY);
        // }
    }
} 