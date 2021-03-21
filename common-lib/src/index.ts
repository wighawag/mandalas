import {BigNumber} from '@ethersproject/bignumber';

function changeAt(str: string, pos: number, char: string) : string {
  return str.substr(0, pos) + char + str.substr(pos+1);
}


const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToUint8(char: string): number {
    const s = char.charCodeAt(0);
    if (s == 0x2B) {
        return 62;
    }
    if (s == 0x2F) {
        return 63;
    }
    if (s >= 0x30 && s <= 0x39) {
        return s - 0x30 + 52;
    }
    if (s >= 0x41 && s <= 0x5A) {
        return s - 0x41;
    }
    if (s >= 0x5A && s <= 0x7A) {
        return s - 0x5A + 26;
    }
    return 0;
}

function uint8ToBase64(v: number): string {
  return base64Alphabet[v];
}

const hexAlphabet = "0123456789abcdef";
function writeUintAsHex(data: string, endPos: number, num: BigNumber) {
  while (!num.eq(0)) {
      data = changeAt(data, endPos--, hexAlphabet[num.mod(16).toNumber()]);
      num = num.div(16);
  }
  return data;
}

function setCharacter(metadata: string, base: number, pos: number, value: number): string {
  const base64Slot = base + Math.floor((pos * 8) / 6);
  const bit = (pos * 8) % 6;
  const existingValue = base64ToUint8(metadata[base64Slot]);
  if (bit == 0) {
      metadata = changeAt(metadata, base64Slot, uint8ToBase64(value >> 2));
      const extraValue = base64ToUint8(metadata[base64Slot + 1]);
      metadata = changeAt(metadata, base64Slot + 1, uint8ToBase64(((value % 4) << 4) | (0x0F & extraValue)));
  } else if (bit == 2) {
    metadata = changeAt(metadata, base64Slot, uint8ToBase64((value >> 4) | (0x30 & existingValue)));
      const extraValue = base64ToUint8(metadata[base64Slot + 1]);
      metadata = changeAt(metadata, base64Slot + 1, uint8ToBase64(((value % 16) << 2) | (0x03 & extraValue)));
  } else { // bit == 4)
      // metadata = changeAt(metadata, base64Slot, uint8ToBase64((value >> 6) | (0x3C & existingValue)));
      metadata = changeAt(metadata, base64Slot + 1, uint8ToBase64(value % 64));
  }
  return metadata;
}

type Template = {
  data: string;
  bitmap_data_pos: number;
  address_data_pos: number;
  width: number;
  height: number;
  row_per_block: number;
  xs: number[],
  ys: number[]
}

export const template19: Template = {
  data: 'data:text/plain,{"name":"Mandala 0x0000000000000000000000000000000000000000","description":"A Unique Mandala","image":"data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' shape-rendering=\'crispEdges\' width=\'512\' height=\'512\'><g transform=\'scale(64)\'><image width=\'8\' height=\'8\' style=\'image-rendering: pixelated;\' href=\'data:image/gif;base64,R0lGODdhEwATAMQAAAAAAPb+Y/7EJfN3NNARQUUKLG0bMsR1SujKqW7wQwe/dQBcmQeEqjDR0UgXo4A0vrlq2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkKAAAALAAAAAATABMAAAdNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGBADs=\'/></g></svg>"}',
  bitmap_data_pos: 521,
  address_data_pos: 74,
  width: 19,
  height: 19,
  row_per_block: 4,
  xs: [9,3,4,8,9,2,3,4,6,7,8,9,3,4,5,6,7,8,9,4,5,6,7,8,9,5,6,7,8,9,6,7,8,9,7,8,9,8,9,9],
  ys: [0,1,1,1,1,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6,7,7,7,8,8,9]
}

export const template19_bis: Template = {
  data: 'data:text/plain,{"name":"Mandala 0x0000000000000000000000000000000000000000","description":"A Unique Mandala","image":"data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' shape-rendering=\'crispEdges\' width=\'512\' height=\'512\'><g transform=\'scale(64)\'><image width=\'8\' height=\'8\' style=\'image-rendering: pixelated;\' href=\'data:image/gif;base64,R0lGODdhEwATAMQAAAAAAPb+Y/7EJfN3NNARQUUKLG0bMsR1SujKqW7wQwe/dQBcmQeEqjDR0UgXo4A0vrlq2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkKAAAALAAAAAATABMAAAdNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGBADs=\'/></g></svg>"}',
  bitmap_data_pos: 521,
  address_data_pos: 74,
  width: 19,
  height: 19,
  row_per_block: 4,
  xs: [8,9,3,4,8,9,3,4,6,7,8,9,3,4,5,6,7,8,9,4,5,6,7,8,9,5,6,7,8,9,6,7,8,9,7,8,9,8,9,9],
  ys: [0,0,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6,7,7,7,8,8,9]
}


export const template17: Template = {
  data: 'data:text/plain,{"name":"Mandala 0x0000000000000000000000000000000000000000","description":"A Unique Mandala","image":"data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' shape-rendering=\'crispEdges\' width=\'512\' height=\'512\'><g transform=\'scale(64)\'><image width=\'8\' height=\'8\' style=\'image-rendering: pixelated;\' href=\'data:image/gif;base64,R0lGODdhEQARAMQAAAAAAPb+Y/7EJfN3NNARQUUKLG0bMsR1SujKqW7wQwe/dQBcmQeEqjDR0UgXo4A0vrlq2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkKAAAALAAAAAARABEAAAdFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEoAAAAAAAAAAAAAAAAAAAAAAAAGBADs=\'/></g></svg>"}',
  bitmap_data_pos: 521,
  address_data_pos: 74,
  width: 17,
  height: 17,
  row_per_block: 4,
  xs: [2,3,5,7,8,1,2,3,5,6,7,8,2,3,4,5,6,7,8,3,4,5,6,7,8,4,5,6,7,8,5,6,7,8,6,7,8,7,8,8],
  ys: [0,0,0,0,0,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,4,5,5,5,5,6,6,6,7,7,8]
}

export function generateTokenURI(id: string, template: Template): string {
  let metadata = template.data;
  const bn = BigNumber.from(id);

  metadata = writeUintAsHex(metadata, template.address_data_pos, bn);

  for (let i = 0; i < 40; i++) {
      let value = bn.shr((40-(i+1))*4).mod(16).toNumber();
      if (value == 0) {
          value = 16; // use black as oposed to transparent
      }
      const x = template.xs[i];
      const y = template.ys[i];
      metadata = setCharacter(metadata, template.bitmap_data_pos, y*template.width + x + Math.floor(y /template.row_per_block) * 2 + 1, value);

      if (x != y) {
        metadata = setCharacter(metadata, template.bitmap_data_pos, x*template.width + y + Math.floor(x /template.row_per_block) * 2 + 1, value);
          if (y != Math.floor(template.height / 2)) {
            metadata = setCharacter(metadata, template.bitmap_data_pos, x*template.width + (template.width -y -1) + Math.floor(x /template.row_per_block) * 2 + 1, value); // x mirror
          }

          if (x != Math.floor(template.width / 2)) {
            metadata = setCharacter(metadata, template.bitmap_data_pos, (template.height-x-1)*template.width + y + Math.floor((template.height-x-1) /template.row_per_block) * 2 + 1, value); // y mirror
          }

          if (x != Math.floor(template.width / 2) && y != Math.floor(template.height / 2)) {
            metadata = setCharacter(metadata, template.bitmap_data_pos, (template.height-x-1)*template.width + (template.width-y-1) + Math.floor((template.height-x-1) /template.row_per_block) * 2 + 1, value); // x,y mirror
          }
      }

      if (x != Math.floor(template.width / 2)) {
        metadata = setCharacter(metadata, template.bitmap_data_pos, y*template.width + (template.width -x -1) + Math.floor(y /template.row_per_block) * 2 + 1, value); // x mirror
      }
      if (y != Math.floor(template.height / 2)) {
        metadata = setCharacter(metadata, template.bitmap_data_pos, (template.height-y-1)*template.width + x + Math.floor((template.height-y-1) /template.row_per_block) * 2 + 1, value); // y mirror
      }

      if (x != Math.floor(template.width / 2) && y != Math.floor(template.height / 2)) {
        metadata = setCharacter(metadata, template.bitmap_data_pos, (template.height-y-1)*template.width + (template.width-x-1) + Math.floor((template.height-y-1) /template.row_per_block) * 2 + 1, value); // x,y mirror
      }
  }
  // fix for firefox :(
  return metadata.replace('image-rendering: pixelated;', 'image-rendering: pixelated; image-rendering: crisp-edges;');
}

