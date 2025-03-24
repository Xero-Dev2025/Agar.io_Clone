export function worldToScreenCoordinates(worldX, worldY, player, canvas) {
    if (!player) return { x: worldX, y: worldY };
    
    const offsetX = player.x - canvas.width / 2;
    const offsetY = player.y - canvas.height / 2;
    
    return {
      x: worldX - offsetX,
      y: worldY - offsetY
    };
  }