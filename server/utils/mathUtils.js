export function calculateOverlapPercentage(radius1, radius2, distance, smallerArea) {
    if (distance >= radius1 + radius2) {
      return 0;
    }
    
    if (distance <= Math.abs(radius1 - radius2)) {
      return radius1 >= radius2 ? 1 : 0;
    }
    
    const r = radius1;
    const s = radius2;
    const d = distance;
    
    const a = (r * r - s * s + d * d) / (2 * d);
    const h = Math.sqrt(r * r - a * a);
    
    const largerSegment = r * r * Math.acos(a / r) - a * h;
    const smallerSegment = s * s * Math.acos((d - a) / s) - (d - a) * h;
    
    const intersectionArea = largerSegment + smallerSegment;
    
    const referenceArea = typeof smallerArea === 'number' ? 
      smallerArea : 
      Math.PI * Math.min(radius1, radius2) * Math.min(radius1, radius2);
    
    return intersectionArea / referenceArea;
  }
  
  export function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  export function generateRandomCoordinates(width, height, padding = 0) {
    return {
      x: padding + Math.random() * (width - 2 * padding),
      y: padding + Math.random() * (height - 2 * padding)
    };
  }