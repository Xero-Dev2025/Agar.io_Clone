// Convertir les coordonnées du monde en coordonnées de l'écran
export function worldToScreenCoordinates(worldX, worldY, player, canvas) {
    if (!player) return { x: worldX, y: worldY };
    
    // Calculer le décalage pour centrer la vue sur le joueur
    const offsetX = player.x - canvas.width / 2;
    const offsetY = player.y - canvas.height / 2;
    
    return {
      x: worldX - offsetX,
      y: worldY - offsetY
    };
  }