export async function loadMTL(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch MTL file: ${response.statusText}`);
      }
  
      const mtlText = await response.text();
      const materials = {};
      let currentMaterial = null;
  
      const lines = mtlText.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (!parts[0]) continue;
  
        switch (parts[0]) {
          case 'newmtl':
            currentMaterial = parts[1];
            materials[currentMaterial] = {
              ambient: [1, 1, 1],
              diffuse: [0.8, 0.8, 0.8],
              specular: [0.5, 0.5, 0.5],
              shininess: 32,
              opacity: 1
            };
            break;
          case 'Ka':
            materials[currentMaterial].ambient = parts.slice(1, 4).map(parseFloat);
            break;
          case 'Kd':
            materials[currentMaterial].diffuse = parts.slice(1, 4).map(parseFloat);
            break;
          case 'Ks':
            materials[currentMaterial].specular = parts.slice(1, 4).map(parseFloat);
            break;
          case 'Ns':
            materials[currentMaterial].shininess = parseFloat(parts[1]);
            break;
          case 'd':
          case 'Tr':
            materials[currentMaterial].opacity = parseFloat(parts[1]);
            break;
        }
      }
  
      return materials;
    } catch (error) {
      console.error('Error loading MTL file:', error);
      return {};
    }
  }
  
export async function loadOBJ(objUrl, mtlUrl = null) {
    try {
      const [objResponse, materials] = await Promise.all([
        fetch(objUrl),
        mtlUrl ? loadMTL(mtlUrl) : Promise.resolve(null)
      ]);
  
      if (!objResponse.ok) {
        throw new Error(`Failed to fetch OBJ file: ${objResponse.statusText}`);
      }
  
      const objText = await objResponse.text();
      
      const positions = [];
      const normals = [];
      const indices = [];
      const materialIndices = [];
      const materialGroups = {};
      
      const tempNormals = new Map();
      
      let currentMaterial = null;
      
      const lines = objText.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (!parts[0]) continue;
  
        switch (parts[0]) {
          case 'v':
            positions.push(
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            );
            break;
  
          case 'usemtl':
            currentMaterial = parts[1];
            if (!materialGroups[currentMaterial]) {
              materialGroups[currentMaterial] = {
                startIndex: indices.length,
                indexCount: 0
              };
            }
            break;
  
          case 'f':
            const faceVertices = parts.slice(1).map(v => parseInt(v.split('/')[0]) - 1);
            
            let nx = 0, ny = 0, nz = 0;
            for (let i = 0; i < faceVertices.length; i++) {
              const v1 = faceVertices[i];
              const v2 = faceVertices[(i + 1) % faceVertices.length];
  
              const x1 = positions[v1 * 3];
              const y1 = positions[v1 * 3 + 1];
              const z1 = positions[v1 * 3 + 2];
              const x2 = positions[v2 * 3];
              const y2 = positions[v2 * 3 + 1];
              const z2 = positions[v2 * 3 + 2];
  
              nx += (y1 - y2) * (z1 + z2);
              ny += (z1 - z2) * (x1 + x2);
              nz += (x1 - x2) * (y1 + y2);
            }
  
            const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (length > 0) {
              nx /= length;
              ny /= length;
              nz /= length;
            }
  
            for (const vertex of faceVertices) {
              if (!tempNormals.has(vertex)) {
                tempNormals.set(vertex, [0, 0, 0]);
              }
              const n = tempNormals.get(vertex);
              n[0] += nx;
              n[1] += ny;
              n[2] += nz;
            }
  
            for (let i = 1; i < faceVertices.length - 1; i++) {
              indices.push(
                faceVertices[0],
                faceVertices[i],
                faceVertices[i + 1]
              );
              materialIndices.push(
                currentMaterial,
                currentMaterial,
                currentMaterial
              );
  
              if (materialGroups[currentMaterial]) {
                materialGroups[currentMaterial].indexCount += 3;
              }
            }
            break;
        }
      }
  
      const normalArray = [];
      for (let i = 0; i < positions.length / 3; i++) {
        const normal = tempNormals.get(i) || [0, 0, 1];
        const length = Math.sqrt(
          normal[0] * normal[0] +
          normal[1] * normal[1] +
          normal[2] * normal[2]
        );
        
        if (length > 0) {
          normal[0] /= length;
          normal[1] /= length;
          normal[2] /= length;
        }
        
        normalArray.push(...normal);
      }
  
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
      for (let i = 0; i < positions.length; i += 3) {
        minX = Math.min(minX, positions[i]);
        minY = Math.min(minY, positions[i + 1]);
        minZ = Math.min(minZ, positions[i + 2]);
        maxX = Math.max(maxX, positions[i]);
        maxY = Math.max(maxY, positions[i + 1]);
        maxZ = Math.max(maxZ, positions[i + 2]);
      }
  
      const center = [
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2
      ];
  
      const scale = 2 / Math.max(
        maxX - minX,
        maxY - minY,
        maxZ - minZ
      );
  
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = (positions[i] - center[0]) * scale;
        positions[i + 1] = (positions[i + 1] - center[1]) * scale;
        positions[i + 2] = (positions[i + 2] - center[2]) * scale;
      }
  
      return {
        positions,
        normals: normalArray,
        indices,
        materialIndices,
        materialGroups,
        materials: materials || {}
      };
    } catch (error) {
      console.error('Error loading OBJ file:', error);
      throw error;
    }
  }