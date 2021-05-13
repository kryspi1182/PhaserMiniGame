const appDiv = document.getElementById('app');
var config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 300,
  parent: appDiv,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};


var game = new Phaser.Game(config);

var health = 100;
var healthText = document.getElementById('playerHealth');
healthText.innerHTML = 'HP: ' + health;

function preload() {
    this.load.baseURL = 'https://examples.phaser.io/assets/';
    this.load.crossOrigin = 'anonymous';
    this.load.image('background', 'games/starstruck/background.png');
    this.load.image('platform', 'sprites/block.png');
    this.load.image('breakPlatform', 'sprites/square1.png');
    this.load.image('dmgOrb', 'sprites/orb-red.png');
    this.load.image('healOrb', 'sprites/green_ball.png');
    this.load.image('redParticles', 'particles/red.png');
    this.load.image('greenParticles', 'particles/green.png');
    this.load.image('projectile', 'bullets/bullet06.png');
    this.load.image('explosion', 'particlestorm/particles/explosion.png');

    this.load.spritesheet('player',
        'games/starstruck/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
}

var player, platforms;
var cursors;

var gameWidth = 9000;
var gameHeight = 300;

function damagePlayer(dmg){
    health -= parseInt(dmg);
    healthText.innerHTML = 'HP: ' + health;
}

function healPlayer(heal){
    health += parseInt(heal);
    healthText.innerHTML = 'HP: ' + health;
}


function create() {
    
    //healthText = this.add.text(16, 16, 'HP: 100', {fontSize: '16px', fill:'#FF0000'});
    
    let back = this.add.tileSprite(0, 28, 1000, 300, 'background');
    back.setOrigin(0)
    back.setScrollFactor(0);//fixedToCamera = true;
    this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
    this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

    player = this.physics.add.sprite(50, 100, 'player');
    player.setCollideWorldBounds(true);
    player.setBounce(0);
    this.cameras.main.startFollow(player)
    
    var particlesRed = this.add.particles('redParticles');    
    var particlesGreen = this.add.particles('greenParticles');
    particlesExplosion = this.add.particles('explosion');
    
    generateImages(this, this.physics, 'dmgOrb', false, gameWidth, gameHeight, 300, particlesRed, 1, player);
    
    generateImages(this, this.physics, 'healOrb', false, gameWidth, gameHeight, 300, particlesGreen, 2, player);


    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'front',
        frames: [{ key: 'player', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard;
    keys.on('keydown', event => {
        switch(event.key){
            case ' ':
               createProjectile(
                this,
                this.physics,
                'projectile',
                player.x,
                player.y); 
            break;
        }
    })
    par = this;
    parPhy = this.physics;

    generatePlatforms(this.physics, gameWidth, gameHeight, 200, player);
    
}

var doubleJump = 0;
var jumpClicked = 0;
function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-150);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(150);
        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('front');
    }
    
    //timeouts due to one key press launching multiple updates
    if (cursors.up.isDown && !jumpClicked){
        jumpClicked = 1;
        if(player.body.touching.down || player.body.onFloor()){
            player.setVelocityY(-350);
        }
        else if (doubleJump < 1){
            setTimeout(function(){++doubleJump}, 100);
            setTimeout(function(){player.setVelocityY(-350);}, 0);
            console.log('doubleJump: '+doubleJump);
        }
        setTimeout(function(){jumpClicked = 0}, 200);
    }
    
    if(player.body.touching.down || player.body.onFloor()){
        doubleJump = 0;
    }
    
    /*if(keys.spacebar.isDown){
        
    }*/
    
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function generateImages(parent, parentPhysics, imageString, gravity, mapWidth, mapHeight, intervalWidth, emitterParticles, changeHealth, player){
    /*
        changeHealth:
        1 - dmg
        2 - heal
        default - none
    */
    
    for(var i = 50; i < mapWidth - intervalWidth; i += intervalWidth){
        var tmpImage = parentPhysics.add.image(
            getRandomInt(i, i + intervalWidth),
            getRandomInt(0, mapHeight),
            imageString);
        console.log('anything?');
        
        tmpImage.body.allowGravity = gravity;
        
        if(emitterParticles){
            var tmpEmitter = emitterParticles.createEmitter({
                speed: 100,
                scale: {start: 0.5, end: 0},
                blendMode: 'ADD'
                });
            tmpEmitter.startFollow(tmpImage);
        }
        
        switch(changeHealth){
            case 1:
              parentPhysics.add.overlap(player, tmpImage, function() {damagePlayer(2)}, null, parent);
            break;
                
            case 2:
               parentPhysics.add.overlap(player, tmpImage, function() {healPlayer(1)}, null, parent); 
            break;
        }
    }
}

function generatePlatforms(parentPhysics, mapWidth, mapHeight, intervalWidth, player){
    
    platforms = parentPhysics.add.staticGroup();
    breakPlatforms = parentPhysics.add.staticGroup();
    for(var j = 50; j < mapWidth - intervalWidth; j += intervalWidth){
        var draw = getRandomInt(0, 10);
        var imageString = '';
        if(draw % 2 == 0){
            platforms.create(
            getRandomInt(j, j + intervalWidth),
            getRandomInt(0, mapHeight - 50),
            'platform');
        }
        else{
            breakPlatforms.create(
            getRandomInt(j, j + intervalWidth),
            getRandomInt(0, mapHeight - 50),
            'breakPlatform');
        }
        
        
    }
    platforms.getChildren().forEach(c => c.setScale(0.5).setOrigin(0).refreshBody())
    breakPlatforms.getChildren().forEach(c => c.setScale(0.5).setOrigin(0).refreshBody())

    parentPhysics.add.collider(player, platforms);
    parentPhysics.add.collider(player, breakPlatforms);
}



function createProjectile(parent, parentPhysics, imageString, positionX, positionY){
    var projectile = parentPhysics.add.image(
        positionX,
        positionY,
        imageString);
    projectile.body.allowGravity = false;
    projectile.setVelocityX(400);
    parentPhysics.add.collider(projectile, breakPlatforms, destroyPlatform);
    setTimeout(function(){projectile.disableBody(true, true);}, 2500);
    
}

function destroyPlatform(projectile, platform){
    console.log(projectile.x + ' ' + projectile.y);
    var tmpExplosion = particlesExplosion.createEmitter({
        speed: 100,
        scale: {start: 0.3, end: 0},
        blendMode: 'ADD'
    });
    tmpExplosion.startFollow(platform);
    projectile.disableBody(true, true);
    setTimeout(function(){platform.disableBody(true, true);
                         tmpExplosion.on = false;}, 1000);
    
}
