export default class InputController {
    constructor() {
        this.moveState = {
            left: false,
            right: false,
            shift: false,
            lastDirectionKey: null,
        };

        this.listeners = {
            keydown: [],
            keyup: [],
        };

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.moveState.left = true;
                this.moveState.lastDirectionKey = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.moveState.right = true;
                this.moveState.lastDirectionKey = 'right';
                break;
            case 'Shift':
                this.moveState.shift = true;
                break;
            case 'e':
            case 'E':
                this.emit('pickup');
                break;
        }
    };

    handleKeyUp = (event) => {
        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.moveState.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.moveState.right = false;
                break;
            case 'Shift':
                this.moveState.shift = false;
                break;
        }
    };

    emit(action) {
        if (this.callbacks[action]) this.callbacks[action]();
    }

    moveState = {
        left: false,
        right: false,
        shift: false,
        lastDirectionKey: null,
    };

    callbacks = {};

    on(action, callback) {
        this.callbacks[action] = callback;
    }

    dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}
