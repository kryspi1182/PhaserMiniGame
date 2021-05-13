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

var highscores = document.getElementById('highscores');

var playerScore = 0;
var bossFight = 0;
var bossHealthPoints = 100;

var bossHealthbar = document.getElementById('bossHealthLeft');

function loadHighscores(){
    if(localStorage.getItem("highscores") != null){
        var scores = JSON.parse(localStorage.getItem("highscores"));
        for (var y = 0; y < scores.length; y++){
            var div = document.createElement('div');
            div.innerHTML = 'Pozycja ' + (y+1) + ' - ' + scores[y].nick + ': ' + scores[y].score;
            highscores.appendChild(div);
        }
    }
}

function submitHighscore(score, nick){
    if(localStorage.getItem("highscores") != null){
        var scores = JSON.parse(localStorage.getItem("highscores"));
        scores.push({nick: nick,
                    score: score});
        console.log('after push: ' + scores);
        scores.sort(sortHighscores);
        console.log('after sort: ' + scores);
        console.log('scores length' + scores.length);
        if(scores.length > 5)
            scores.splice(scores.length-1, 1);
        
        console.log('after cut: ' + scores);
        localStorage.setItem("highscores", JSON.stringify(scores));
        
    }
    else{
        var newScores = [];
        newScores.push({nick: nick,
                      score: score});
        localStorage.setItem("highscores", JSON.stringify(newScores));
    }
}

function sortHighscores(score1, score2){
    if(score1.score < score2.score)
        return 1;
    if (score1.score > score2.score)
        return -1;
    return 0;
}


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
    this.load.image('whiteParticles', 'particles/white.png');
    this.load.image('projectile', 'bullets/bullet06.png');
    this.load.image('droidProjectile', 'bullets/bullet02.png');
    this.load.image('bossProjectile', 'bullets/bullet285.png');
    this.load.image('explosion', 'particlestorm/particles/explosion.png');

    this.load.spritesheet('player',
        'games/starstruck/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
    
    this.load.spritesheet('droid', 'games/starstruck/droid.png', {frameWidth: 32, frameHeight: 32});
    
    this.load.spritesheet('boss', 'sprites/stormlord-dragon96x64.png', {frameWidth: 96, frameHeight: 64});
}

var player, platforms;
var cursors;

var gameWin = 0;
var gameWidth = 9000;
var gameHeight = 300;

function damagePlayer(dmg){
    if(health > 0){
        health -= parseInt(dmg);
        healthText.innerHTML = 'HP: ' + health;
    }
    else{
        endGame(0);
    }
    
}

function healPlayer(heal){
    if(health < 100){
       health += parseInt(heal);
        healthText.innerHTML = 'HP: ' + health; 
    } 
}

function endGame(score){
    if(score === 0){
        alert('Game over!!');
        game.destroy();
        location.reload(true);
        
    }
    else{
        setTimeout(function(){
            var nick = prompt("Gratulacje! Podaj swój nick:", "abc");
            submitHighscore(score, nick);
            var restart = confirm("Restart?");
            if(restart)
                location.reload(true);
        }, 12000);
        
    }
}

function create() {
    
    //healthText = this.add.text(16, 16, 'HP: 100', {fontSize: '16px', fill:'#FF0000'});
    loadHighscores();
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
    particlesWhite = this.add.particles('whiteParticles');
    
    generateImages(this, this.physics, 'dmgOrb', false, gameWidth-1000, gameHeight, 300, particlesRed, 1, player);
    
    generateImages(this, this.physics, 'healOrb', false, gameWidth-1000, gameHeight, 300, particlesGreen, 2, player);


    this.anims.create({
        key: 'leftPlayer',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'frontPlayer',
        frames: [{ key: 'player', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'rightPlayer',
        frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.anims.create({
        key: 'leftDroid',
        frames: this.anims.generateFrameNumbers('droid', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'frontDroid',
        frames: [{ key: 'droid', frame: 3 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'rightDroid',
        frames: this.anims.generateFrameNumbers('droid', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.anims.create({
        key: 'bossMovement',
        frames: this.anims.generateFrameNumbers('boss', { start: 6, end: 11 }),
        frameRate: 10,
        repeat: -1
    });
    
    

    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard;
    keys.on('keydown', event => {
        switch(event.key){
            case ' ':
                if(cursors.left.isDown){
                    createProjectile(
                        this,
                        this.physics,
                        'projectile',
                        player.x,
                        player.y,
                        0); 
                }
                else if(cursors.up.isDown){
                   createProjectile(
                        this,
                        this.physics,
                        'projectile',
                        player.x,
                        player.y,
                        1);  
                }
                else if(cursors.down.isDown){
                   createProjectile(
                        this,
                        this.physics,
                        'projectile',
                        player.x,
                        player.y,
                        2);  
                }
                else{
                   createProjectile(
                        this,
                        this.physics,
                        'projectile',
                        player.x,
                        player.y,
                        3);  
                }
                
            break;
        }
    })
    par = this;
    parPhy = this.physics;

    generatePlatforms(this.physics, gameWidth-1000, gameHeight, 200, player);
    //createEnemy(this, this.physics, 'droid', 300, 100, 100);
    generateEnemies(this, this.physics, 'droid', gameWidth-1000, gameHeight, 500, 100, 10);
    
    boss = this.physics.add.sprite(gameWidth-200, 150, 'boss');
    boss.setDataEnabled();
    boss.setBounce(0);
    boss.setCollideWorldBounds(true);
    boss.body.allowGravity = false; 
    boss.setScale(2);
    
}

var doubleJump = 0;
var jumpClicked = 0;
function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-150);
        player.anims.play('leftPlayer', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(150);
        player.anims.play('rightPlayer', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('frontPlayer');
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
    
    if(player.x > gameWidth - 600 && bossFight === 0){
        createBoss(this, this.physics, 'boss', gameWidth-100, 150, bossHealthPoints);
        bossFight = 1;
        this.physics.world.setBounds(gameWidth - 650, 0, 700, gameHeight);
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



function createProjectile(parent, parentPhysics, imageString, positionX, positionY, direction){
    //direction 0 - left, 1 - up, 2 - down, everything else - right
    var projectile = parentPhysics.add.image(
        positionX,
        positionY,
        imageString);
    projectile.body.allowGravity = false;
    
    if(direction === 0)
        projectile.setVelocityX(-400);
    else if(direction === 1)
        projectile.setVelocityY(-400);
    else if(direction === 2)
        projectile.setVelocityY(400);
    else
        projectile.setVelocityX(400);
    
    //destroy platforms
    parentPhysics.add.collider(projectile, breakPlatforms, destroyPlatform);
    parentPhysics.add.collider(projectile, enemies, projectileDamageEnemy);
    parentPhysics.add.collider(projectile, boss, projectileDamageEnemy);
    
    //after 2.5 seconds if the projectile did not hit anything it should vanish, not fly to the end of the map
    setTimeout(function(){projectile.disableBody(true, true);}, 2500);
    
}

function createEnemyProjectile(parent, parentPhysics, imageString, positionX, positionY, direction){
    //direction 0 - left, 1 - up, 2 - down, everything else - right
    var projectile = parentPhysics.add.image(
        positionX,
        positionY,
        imageString);
    projectile.body.allowGravity = false;
    
    if(direction === 0)
        projectile.setVelocityX(-450);
    else if(direction === 1)
        projectile.setVelocityY(-450);
    else if(direction === 2)
        projectile.setVelocityY(450);
    else
        projectile.setVelocityX(450);
    
    //destroy platforms
    parentPhysics.add.collider(projectile, breakPlatforms, destroyPlatform);
    parentPhysics.add.collider(projectile, player, projectileDamagePlayer);
    
    //after 2.5 seconds if the projectile did not hit anything it should vanish, not fly to the end of the map
    setTimeout(function(){projectile.disableBody(true, true);}, 2500);
    
}

function createBossProjectile(parent, parentPhysics, imageString, positionX, positionY, direction){
    //direction 0 - left, 1 - up, 2 - down, 3 - leftUp, 4 - leftDown everything else - right
    var projectile = parentPhysics.add.image(
        positionX,
        positionY,
        imageString);
    projectile.body.allowGravity = false;
    
    if(direction === 0)
        projectile.setVelocityX(-450);
    else if(direction === 1)
        projectile.setVelocityY(-450);
    else if(direction === 2)
        projectile.setVelocityY(450);
    else if(direction === 3){
        projectile.setVelocityX(-450);
        projectile.setVelocityY(-150);
    }
    else if(direction === 4){
        projectile.setVelocityX(-450);
        projectile.setVelocityY(150);
    }
    else
        projectile.setVelocityX(450);
        
    
    //destroy platforms
    parentPhysics.add.collider(projectile, breakPlatforms, destroyPlatform);
    parentPhysics.add.collider(projectile, player, projectileDamagePlayer);
    
    //after 2.5 seconds if the projectile did not hit anything it should vanish, not fly to the end of the map
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

function projectileDamagePlayer(projectile, target){
    projectile.disableBody(true, true);
    var tmpExplosion = particlesExplosion.createEmitter({
        speed: 100,
        scale: {start: 0.1, end: 0},
        blendMode: 'ADD'
    });
    tmpExplosion.startFollow(target);
    target.setVelocityX(0);
    setTimeout(function(){damagePlayer(1);
                          tmpExplosion.on = false;}, 100);
}

function projectileDamageEnemy(projectile, target){
    projectile.disableBody(true, true);
    var tmpExplosion = particlesExplosion.createEmitter({
        speed: 100,
        scale: {start: 0.1, end: 0},
        blendMode: 'ADD'
    });
    tmpExplosion.startFollow(target);
    var hp = target.data.get('health');
    if(target === boss){
        if(--hp < 0 && gameWin === 0){
            bossDeathAnimation();
            gameWin = 1;
        }
        else{
            target.data.set('health', hp);
            bossHealthbar.style.backgroundColor = 'white';
            setTimeout(function(){bossHealthbar.style.width = (hp/bossHealthPoints)*100 + '%';}, 300);
            setTimeout(function(){
                bossHealthbar.style.backgroundColor = 'green';
            }, 500);
            target.setVelocityX(0);
            //target.setVelocityY(0);
        }
    }
    else{
        var intervalId = target.data.get('interval');
        if(--hp <= 0){
            enemies.remove(target);
            target.destroy();
            //console.log('pre interval ' + intervalId);
            clearInterval(intervalId);
            playerScore += 100;
            //console.log('post interval ' + intervalId);
        }
        else{
            target.data.set('health', hp);
            target.setVelocityX(0);
        }
    }
    setTimeout(function(){tmpExplosion.on = false;}, 100);
}

function createEnemy(parent, parentPhysics, imageString, positionX, positionY, speed, health){
    
    var enemy = parentPhysics.add.sprite(positionX, positionY, 'droid');
    var fireCountdown = 10;
    var fireDirection = 0;
    enemy.setBounce(0);
    enemy.setDataEnabled();
    
    enemy.data.set('health', health);
    //keep checking where player is
    var interval = setInterval(function() {
        //player close enough
       if(Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y) < 400){
           //player on the left of enemy
            if(player.x < enemy.x && enemy.body.velocity.x >= 0){
                enemy.body.velocity.x = (-1)*speed;
                enemy.anims.play('leftDroid', true);
                fireDirection = 0;
            }
           //player on the right of enemy
            else if(player.x > enemy.x && enemy.body.velocity.x <= 0){
                enemy.body.velocity.x = speed;
                enemy.anims.play('rightDroid', true);
                fireDirection = 3;
            }
  
               if(fireCountdown <= 0){
                   createEnemyProjectile(parent, parentPhysics, 'droidProjectile', enemy.x, enemy.y, fireDirection);
                   fireCountdown = 10;
               }
               else {
                   fireCountdown--;
               }
        }
        
    }, 100);
    enemy.data.set('interval', interval);
    
    return enemy;
}

function generateEnemies(parent, parentPhysics, imageString, mapWidth, mapHeight, intervalWidth, speed, health){
    enemies = parentPhysics.add.group();
    for(var i = 150; i < mapWidth - intervalWidth; i += intervalWidth){
        var enemy = createEnemy
                    (parent, 
                     parentPhysics, 
                     imageString,
                     getRandomInt(i, i+intervalWidth),
                     0,
                     speed,
                     health);
        enemies.add(enemy, true);            
    }
    parentPhysics.add.collider(player, enemies, function(){damagePlayer(1)});
    parentPhysics.add.collider(enemies, platforms);
    parentPhysics.add.collider(enemies, breakPlatforms);
    enemies.getChildren().forEach(e => e.setCollideWorldBounds(true))
}

function createBoss(parent, parentPhysics, imageString, positionX, positionY, health){
    var upOrDown = 1;    
    boss.data.set('health', health);
    boss.anims.play('bossMovement', true);
    var interval0 = setInterval(function(){
        createBossProjectile(parent, parentPhysics, 'bossProjectile', boss.x-65, boss.y+35, 0);
        console.log('test');
    }, 200);
    
    var interval1 = setInterval(function(){
        createBossProjectile(parent, parentPhysics, 'bossProjectile', boss.x-65, boss.y+35, 3);
    }, 700);
    
    var interval2 = setInterval(function(){
        createBossProjectile(parent, parentPhysics, 'bossProjectile', boss.x-65, boss.y+35, 4);
    }, 700);
    
    var interval3 = setInterval(function(){
        boss.body.velocity.y = upOrDown * 50;
        upOrDown *= -1;
    }, 4000);
    
    var intervals = [];
    intervals.push(interval0);
    intervals.push(interval1);
    intervals.push(interval2);
    intervals.push(interval3);
    
    boss.data.set('interval', JSON.stringify(intervals));
    
}

function bossDeathAnimation(){
    var intervalsBoss = JSON.parse(boss.data.get('interval'));
    for (var x = 0; x < intervalsBoss.length; x++){
        clearInterval(intervalsBoss[x]);
        console.log(intervalsBoss[x]);
    }
    boss.setVelocityY(-50);
    var explosions = [];
    setTimeout(function(){
        explosions[0] = particlesWhite.createEmitter({
                        speed: 100,
                        scale: {start: 0.3, end: 0},
                        blendMode: 'ADD',    
                    }); 
        explosions[0].setPosition(
                        getRandomInt(boss.x-50, boss.x+50), 
                        getRandomInt(boss.y-30, boss.y+30));
    }, 500);
    setTimeout(function(){explosions[0].on = false;}, 7500);
    
    setTimeout(function(){
        explosions[1] = particlesWhite.createEmitter({
                        speed: 100,
                        scale: {start: 0.3, end: 0},
                        blendMode: 'ADD',    
                    }); 
        explosions[1].setPosition(
                        getRandomInt(boss.x-50, boss.x+50), 
                        getRandomInt(boss.y-30, boss.y+30));
    }, 1500);
    setTimeout(function(){explosions[1].on = false;}, 8000);
    
    setTimeout(function(){
        explosions[2] = particlesWhite.createEmitter({
                        speed: 100,
                        scale: {start: 0.3, end: 0},
                        blendMode: 'ADD',    
                    }); 
        explosions[2].setPosition(
                        getRandomInt(boss.x-50, boss.x+50), 
                        getRandomInt(boss.y-30, boss.y+30));
    }, 2500);
    setTimeout(function(){explosions[2].on = false;}, 8500);
    
    setTimeout(function(){
        explosions[3] = particlesWhite.createEmitter({
                        speed: 100,
                        scale: {start: 0.3, end: 0},
                        blendMode: 'ADD',    
                    }); 
        explosions[3].setPosition(
                        getRandomInt(boss.x-50, boss.x+50), 
                        getRandomInt(boss.y-30, boss.y+30));
    }, 3500);
    setTimeout(function(){explosions[3].on = false;}, 9000);
    
    setTimeout(function(){
        explosions[4] = particlesWhite.createEmitter({
                        speed: 100,
                        scale: {start: 0.3, end: 0},
                        blendMode: 'ADD',    
                    }); 
        explosions[4].setPosition(
                        getRandomInt(boss.x-50, boss.x+50), 
                        getRandomInt(boss.y-30, boss.y+30));
    }, 4500);
    setTimeout(function(){explosions[4].on = false;}, 9500);
            
    setTimeout(function(){boss.destroy();}, 10000);
            
    playerScore += 5000 + (health * 100);
    endGame(playerScore);
    
}
