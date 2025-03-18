export function createFood(id, x, y) {
    return {
      id,
      x,
      y,
      radius: 10,
      color: getRandomColor()
    };
  }
  
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  export function generateFoodItems(count, maxWidth, maxHeight) {
    const foodItems = [];
    
    console.log(`Génération de ${count} boules dans une zone de ${maxWidth}x${maxHeight}`);
    
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * maxWidth);
      const y = Math.floor(Math.random() * maxHeight);
      const id = Date.now() + i; 
      foodItems.push(createFood(id, x, y));
    }
    
    return foodItems;
  }