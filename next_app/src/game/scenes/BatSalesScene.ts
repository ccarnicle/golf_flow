import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';

export class BatSalesScene extends Scene {
    background: GameObjects.Image;
    isMobile: boolean = false;
    dialogueText: GameObjects.Text;
    typewriterAnimation: Phaser.Time.TimerEvent;
    batImages: string[];
    currentBatIndex: number;
    batImage: GameObjects.Image;
    batData: { key: string; text: string; tier: string; amount: string; }[];
    buyButton: GameObjects.Container;

    constructor() {
        super('BatSalesScene');
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.isMobile = this.scale.width < 768 || this.sys.game.device.os.android || this.sys.game.device.os.iOS;

        this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, 'bat_sales');
        this.background.setDisplaySize(this.scale.width, this.scale.height);

        let scale = Math.max(this.scale.width / this.background.width, this.scale.height / this.background.height);
        this.background.setScale(scale).setScrollFactor(0);

        const textStyle = {
            fontFamily: 'Comic Sans MS',
            fontSize: '24px',
            color: '#000000',
            wordWrap: { width: 330, useAdvancedWrap: true }
        };

        const batTextStyle = {
            ...textStyle, // Inherit base style
            fontSize: '20px', // 4px smaller
            color: '#ff0000'    // Red color
        };

        this.dialogueText = this.add.text(218, 80, '', textStyle);

        EventBus.on('user-bat-updated', (bat: string) => {
            console.log("BatSalesScene received user-bat-updated event with:", bat);
        
            let dialogueContent = '';
            switch (bat) {
                case 'Default':
                    dialogueContent = "That old wooden stick? You're brave, I'll give you that! But if you want to hit like the pros, you're gonna need some real equipment.";
                    break;
                case 'Bronze':
                    dialogueContent = "Not bad for a starter bat! But if you're serious about those home runs, maybe it's time to step up your game.";
                    break;
                case 'Silver':
                    dialogueContent = "Nice choice! That's solid equipment right there. Though if you really want to dominate the diamond, I've got something even better...";
                    break;
                case 'Gold':
                    dialogueContent = "Now THAT'S what I'm talking about! You've got excellent taste - that's top-tier equipment right there!";
                    break;
                default:
                    dialogueContent = "That old wooden stick? You're brave, I'll give you that! But if you want to hit like the pros, you're gonna need some real equipment.";
                    break;
            }
            this.animateText(this.dialogueText, dialogueContent);
        });

        this.batData = [
            { key: 'firebat_1', text: 'Buy Fire Bat for 5 $FLOW', tier: 'Bronze', amount: '5.0'},
            { key: 'firebat_2', text: 'Buy Double Fire Bat for 10 $FLOW', tier: 'Silver', amount: '10.0' },
            { key: 'firebat_3', text: 'Buy Skull Fire Bat for 25 $FLOW', tier: 'Gold', amount: '25.0' }
        ];
        this.batImages = this.batData.map(b => b.key);
        this.currentBatIndex = 0;

        this.batImage = this.add.image(403, 490, this.batImages[this.currentBatIndex]);
        this.batImage.setScale(0.33); // Adjust scale as needed

        const backButton = this.createButton(0, 0, 'Back', () => this.goBackToTicketCounter());
        backButton.setPosition(backButton.width / 2 + 20, backButton.height / 2 + 20);

        const prevButtonZone = this.add.zone(273.6, 503, 40, 45).setInteractive({ useHandCursor: true });
        prevButtonZone.on('pointerdown', () => this.showPreviousBat());

        const nextButtonZone = this.add.zone(510, 503, 40, 45).setInteractive({ useHandCursor: true });
        nextButtonZone.on('pointerdown', () => this.showNextBat());

        this.updateBuyButton();

        EventBus.on('transaction-sealed', () => {
            const buttonText = this.buyButton.getAt(1) as GameObjects.Text;
            buttonText.setText('Success!');
            
            this.time.delayedCall(1500, () => {
                this.goBackToTicketCounter();
            });
        });

        this.scale.on('resize', this.resize, this);
        EventBus.emit('bat-sales-scene-ready');
    }

    createButton(x: number, y: number, text: string, onClick: () => void): GameObjects.Container {
        const buttonPadding = { x: 20, y: 10 };
        const cornerRadius = 10;
        const fontSize = this.isMobile ? '20px' : '24px';

        const sampleText = this.add.text(0, 0, text, {
            fontFamily: 'Comic Sans MS',
            fontSize: fontSize,
            align: 'center'
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
            align: 'center'
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

    goBackToTicketCounter() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('TicketCounterScene');
        });
    }

    resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.isMobile = width < 768;

        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);
    }

    showPreviousBat() {
        this.currentBatIndex = (this.currentBatIndex - 1 + this.batImages.length) % this.batImages.length;
        this.changeBatWithFade();
    }

    showNextBat() {
        this.currentBatIndex = (this.currentBatIndex + 1) % this.batImages.length;
        this.changeBatWithFade();
    }

    changeBatWithFade() {
        this.tweens.add({
            targets: this.batImage,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                this.batImage.setTexture(this.batImages[this.currentBatIndex]);
                this.updateBuyButton();
                this.tweens.add({
                    targets: this.batImage,
                    alpha: 1,
                    duration: 150,
                    ease: 'Power2'
                });
            }
        });
    }

    updateBuyButton() {
        if (this.buyButton) {
            this.buyButton.destroy();
        }
    
        const currentBatData = this.batData[this.currentBatIndex];
        const buttonText = currentBatData.text.replace(' for ', '\nfor ');
        
        this.buyButton = this.createButton(0, 0, buttonText, () => {
            console.log(`Buy button for ${currentBatData.text} clicked`);
            EventBus.emit('buy-bat-clicked', { tier: currentBatData.tier, amount: currentBatData.amount });
            const buttonText = this.buyButton.getAt(1) as GameObjects.Text;
            buttonText.setText('Buying...');
            this.buyButton.disableInteractive();
        });
    
        const gridCellSize = 28.8;
        const buttonX = (2 - 1) * gridCellSize;
        const buttonY = (23 - 1) * gridCellSize;
        this.buyButton.setPosition(buttonX + this.buyButton.width / 2, buttonY + this.buyButton.height / 2);
    }
} 