export default class GameMap {
    width;
    height;

    constructor(width, height) {
        if (width <= 0) {
            throw new Error('Map width cannot be negative or zero');
        }
          
        if (height <= 0) {
            throw new Error('Map height cannot be negative or zero');
        }

        this.width = width;
        this.height = height;
    }
}