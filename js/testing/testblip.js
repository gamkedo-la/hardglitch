import { Board } from "./blip.js";

const tileImg = new Image();
tileImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABWFJREFUeJztmk1sFGUYx387O7MfbadbWrYtCNYiEpAUDUpBD2LEEEpiaIyBoJGInsQY49XEgx64ePAANl7QGDEaPxK4ehOQhGDgABgOFQLdQmndbku3+9Gd3fGwnbbb+d7dlu6s/9PuPO+8+8xvZ97n4x3fxp631JfeeJd6lQBw7tdvHrUfj0yC9qFeIQgLv9QjBGHxgXqDoAMA9QXBEADUDwRTAFAfECwBgPch2AIAb0NwBAC8C8ExAPAmBFcAwHsQXAMAb0EoCwB4B4KQ2dpa9slegODj1ml13SeXCN0YL2sCOfJElV1aXgmR/gFix3dSyZ1QyxKiajf1DEEAqGcIc1GgXiGUhMF6hKDLA6oJYfhwO3ffW8Pw4faK5llKiUYHo2o39A8QO3OMckPkyOurSbwYIRcRERNplFSQcGyGgL9JN7YgCQi5gnvvLaTNGYgrSOM5pIRiOM4QAFQOIdsukYsUp1diI6T8ScY/2uZqjmpIvjhC8MQF1kvPGdpNAUBlEMTJfPHDtdsIV28RnJJpOPKDc88rVD4sEOzfy2hfJ9LXPtNxlgCgfAiP/TjKxvhtYolGfIkOWgf9wHbHF1Cx0jDxT9p2mKNiqHRhXOXch98babvM7MWvTDmuBuch7CK7qWUpfVpWuSqHNQhDX7zgGQi2AOJHNxM/unnu+0II6R7rPKFm8wBN428+xdTLa1ELCko6ScdPMWB+YRw+c4zAyZjuPNXvI7smoMsDus5mXTk3E5WYWS2hyOZrSCCuID5UCIzlXM2tyRKA0hpEaQnCtXtkg6XOaxDGju0nuVffEwjdTenyAJBcOac0izx4VebhDvM7remPGKGB86wPPu9qbk2WAPzTxezJd3WQXFenzh5Vu5k4dZ7A6T9LjqsCSIf2kXm8oSQPcAtgpk3k4Y5Wmj7+mUC89B/OhwXyDX6SXx4kcKrszp41gLZvb7IlGefycJLckR6mzk0j/5UoGWNIvgAY5gHlyZ/K07U4h0jDRI9MsuxZi7JFN/rLGGtvNtJ0cIAHn+4i9YzzAqlaeYA/Xd06YaEc3TvSRJ7ObDfN/QPc+3wnqWfblsyh5Zarh6d9NgTe+6y3JiCoYrEGUC2u0vXqEV0AYbq3svherTxBu9DF8ikqAI179pieK2a2troudaNqNxz4ivtnPyBkkAfYqVp5gibtQs00s1piolc2tImx4zvLqvejbKDQf5KxD18juafL1blQnTzBToG4gnxxhNE+fQjXJEYqaHp0qE9y/7dztH7n7klymicUpPLjO4A0niN44oJ1P6DSzs+mZBkZmMM8odI2mZRQTDtBc78Bj64bvBL6Bf/vCyz8UmsQnMR5Oy3pvkC1ZBbnU10hwrEM0qF9hnYneYYhu5UGwSjOa/sO6XUhxnc1cOdA0NAe391iaNdkevOsNAiLldjeaJBHOLdrEpJDV0x/ZCVDaL4x2/LW8ojhjCu7JhEgOXSFpvXGPftqbJMthYz3HZzbNc09ArV4J9jlEXfiTUxuk5kRzWuMkjWgFiHYaXL3Oku7bhH0EgRtJzrU3GE6xjAKVAuCXRy2s2ureKWymsfU4nRh5PsRwkP6Zyz5dINlvW/0/kBkcHZHuTEMFOv4asiyH2B1ohMIk+/3EXu7W2e3q/eN4nRmh0zqldK5wmev488UIGTlqbGc9AN8nS1brNspYAoBYCL0r+Fx4Z39jPa1zcVheUpmw6X5f2H4cLvOLlz4u+iUNA9KyBbwpwusbem1c1On3CqRkdFLFCTzfoAjAGAOwepN0fDe6dk4nDcMVXb25ZBjAGAMoeZflXUz2Co61KpcV9Jeg1BWK8FLEMrupXgFwn/359I24GoygQAAAABJRU5ErkJggg==";
const tile2Img = new Image();
tile2Img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAy9JREFUeJztWktrE1EU/pKZyWPyQlvbhhYL2oWIiHbRhQgFBVE3SruQbkRc9xfoyt/gptSlSFcu3HQRsaDWgqsuRBAqBm1r8zDJhLzbpLpoU9rm3mRezRkz8y1z7rnny8dkvnPPjevxs3d/YWO4qQlQwxGAmgA1HAGoCVDDEYCaADUcAagJUMMRgJoANRwBqAlQwxGAmgA1xNW3S9QcSGH7J8ARgJoANRwBqAlQQzSSvDkzgIYsQCg3MLyQMotTV6FbgMRUP3LXItiJiBBzFdTLXkS2PGZyMwW+zSokpQGhtMuM6xYgNx7ATmQvvb6RQFkoIjt7We92J4bIchrR13/gL7HjugUIf62gelYGvsThXv0BbyEE+eErvdudCCITk4jPjkCYj2EU48w1ugUYXkhhLBPHRi4AV24Qp78LAKcIFRQVawy9BCuxAPoAAIKRbUhhexu0vQBtfwLUPt+N+lwBzPJ5UanDm9yGlG9oyjOjfmnM35kfL3Dc57PT55DVVH4P4ZU0zsRqkPLa8moDkil9hrz4rW2cK8Bxnw99SEP4vKapuHT/BpJTUYhzMYQ1WqTYfGJM6DOGfJeAKqcOL8kMn1d+a3vsza5/AM6XBzq8BKl9vhv1bW+DthfgRPuA0nk/+t4rEGZuA4x86j4DAMTiBZkZKF6UW3x49E1N9cYsHz+cb5V5grj2ZJQZ8P0qt/gwIKnemDUvOJxvls8bhdj/4CUz4H50t+W8r0UA1rzgcL6ZPm8ErqvXn3L/Keq/Vdr34ca+D2tDp3yj+5uBtgLYAba3QdsL0NP3Amr4/ff3Ap71EqTiLqRCZ36sPka3AFbx8dDHLYQW4xgsnDryeac+pAndAljBx8Xpm0jdi0J6sQTgqACd+pCDPfQWt8K9gLJe58bY/FrR0/cCPzNBFK8EIX9KAmCfeXreBvOTI23jPS2ARwgCAHzhQe4aQ/MAq/cBTTTdgAXd8wAr9AFq5v4AsN0vQZkIMWO65wFW6QPazf09mTpCKwmk7gxx1+ieB1ihD2iCN/eXsjvwPl+GNOfi5hqaB1jhPG8Uhu4FrN4HqEFP26AaOAJQE6CG7QX4B0fd1+tZBWifAAAAAElFTkSuQmCC";

class Game {
    constructor() {
        this.objs = [];
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(tileImg, 128, 128);
        for (let i=0; i<8; i++) {
            this.ctx.drawImage(tile2Img, 192+64*i, 128);
        }
        for (const obj of this.objs) {
            obj.draw(this.ctx, { x: 128, y: 128 });
        }
    }


    play() {

        // left angled board
        let board = new Board({x:128, y:128}, [
            [{x:3, y:3}, {x:7, y:3}, {x:7, y:5}, {x:9,y:5}],
            [{x:1, y:4}, {x:2, y:5}, {x:4, y:5}],
            [{x:4, y:7}, {x:5, y:7}, {x:5, y:4}, {x:6, y:4}, {x:6,y:6}],
            [{x:3, y:4}, {x:2, y:4}, {x:-1, y:1}, {x:-1, y:4}, {x:2,y:7}, {x:3,y:7}],
            [{x:7, y:6}, {x:7, y:7}, {x:9, y:7}],
        ]);
        board.maskRight=false;
        this.objs.push(board);
        // repeated middle board
        for (let i=0; i<8; i++) {
            let pos = {x:192+64*i, y:128};
            let board = new Board(pos, [
                [{x:1, y:4}, {x:3, y:4}, {x:3, y:5}],
                [{x:2, y:3}, {x:7, y:3}, {x:7, y:4}, {x:5, y:4}],
                [{x:4, y:5}, {x:9, y:5}],
                [{x:2, y:6}, {x:6, y:6}, {x:6, y:7}, {x:2, y:7}],
                [{x:7, y:6}, {x:7, y:7}, {x:9, y:7}],
                //[{x:4, y:7}, {x:5, y:7}, {x:5, y:4}, {x:6, y:4}, {x:6,y:6}],
                //[{x:3, y:4}, {x:2, y:4}, {x:-1, y:1}, {x:-1, y:4}, {x:2,y:7}, {x:3,y:7}],
                //[{x:7, y:6}, {x:7, y:7}, {x:9, y:7}],
            ]);
            board.maskLeft=false;
            board.maskRight=(i==7);
            this.objs.push(board);
        }

        let runningId = -1;
        if (runningId == -1) {
            runningId = setInterval(() => {
                this.loop();
            }, this.INTERVAL);
            console.log("play");
        }
    }


}

window.onload = function() {
    // create game
    let game = new Game();

    // play
    game.play();
}