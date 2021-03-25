import {BigNumber} from '@ethersproject/bignumber';

function changeAt(str: string, pos: number, char: string): string {
  return str.substr(0, pos) + char + str.substr(pos + 1);
}

const base64Alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8(char: string): number {
  const s = char.charCodeAt(0);
  if (s == 0x2b) {
    return 62;
  }
  if (s == 0x2f) {
    return 63;
  }
  if (s >= 0x30 && s <= 0x39) {
    return s - 0x30 + 52;
  }
  if (s >= 0x41 && s <= 0x5a) {
    return s - 0x41;
  }
  if (s >= 0x5a && s <= 0x7a) {
    return s - 0x5a + 26;
  }
  return 0;
}

function uint8ToBase64(v: number): string {
  return base64Alphabet[v];
}

const hexAlphabet = '0123456789abcdef';
function writeUintAsHex(data: string, endPos: number, num: BigNumber) {
  while (!num.eq(0)) {
    data = changeAt(data, endPos--, hexAlphabet[num.mod(16).toNumber()]);
    num = num.div(16);
  }
  return data;
}

function setCharacter(
  metadata: string,
  base: number,
  pos: number,
  value: number
): string {
  const base64Slot = base + Math.floor((pos * 8) / 6);
  const bit = (pos * 8) % 6;
  const existingValue = base64ToUint8(metadata[base64Slot]);
  if (bit == 0) {
    metadata = changeAt(metadata, base64Slot, uint8ToBase64(value >> 2));
    const extraValue = base64ToUint8(metadata[base64Slot + 1]);
    metadata = changeAt(
      metadata,
      base64Slot + 1,
      uint8ToBase64((value % 4 << 4) | (0x0f & extraValue))
    );
  } else if (bit == 2) {
    metadata = changeAt(
      metadata,
      base64Slot,
      uint8ToBase64((value >> 4) | (0x30 & existingValue))
    );
    const extraValue = base64ToUint8(metadata[base64Slot + 1]);
    metadata = changeAt(
      metadata,
      base64Slot + 1,
      uint8ToBase64((value % 16 << 2) | (0x03 & extraValue))
    );
  } else {
    // bit == 4)
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
  xs: number[];
  ys: number[];
};

export const template19: Template = {
  data:
    "data:text/plain,{\"name\":\"Mandala 0x0000000000000000000000000000000000000000\",\"description\":\"A Unique Mandala\",\"image\":\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' shape-rendering='crispEdges' width='512' height='512'><g transform='scale(64)'><image width='8' height='8' style='image-rendering: pixelated;' href='data:image/gif;base64,R0lGODdhEwATAMQAAAAAAPb+Y/7EJfN3NNARQUUKLG0bMsR1SujKqW7wQwe/dQBcmQeEqjDR0UgXo4A0vrlq2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkKAAAALAAAAAATABMAAAdNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGBADs='/></g></svg>\"}",
  bitmap_data_pos: 521,
  address_data_pos: 74,
  width: 19,
  height: 19,
  row_per_block: 4,
  xs: [
    9,
    3,
    4,
    8,
    9,
    2,
    3,
    4,
    6,
    7,
    8,
    9,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    4,
    5,
    6,
    7,
    8,
    9,
    5,
    6,
    7,
    8,
    9,
    6,
    7,
    8,
    9,
    7,
    8,
    9,
    8,
    9,
    9,
  ],
  ys: [
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    6,
    6,
    6,
    6,
    7,
    7,
    7,
    8,
    8,
    9,
  ],
};

export const template19_bis: Template = {
  data:
    "data:text/plain,{\"name\":\"Mandala 0x0000000000000000000000000000000000000000\",\"description\":\"A Unique Mandala\",\"image\":\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' shape-rendering='crispEdges' width='512' height='512'><g transform='scale(64)'><image width='8' height='8' style='image-rendering: pixelated;' href='data:image/gif;base64,R0lGODdhEwATAMQAAAAAAPb+Y/7EJfN3NNARQUUKLG0bMsR1SujKqW7wQwe/dQBcmQeEqjDR0UgXo4A0vrlq2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkKAAAALAAAAAATABMAAAdNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGBADs='/></g></svg>\"}",
  bitmap_data_pos: 521,
  address_data_pos: 74,
  width: 19,
  height: 19,
  row_per_block: 4,
  xs: [
    8,
    9,
    3,
    4,
    8,
    9,
    3,
    4,
    6,
    7,
    8,
    9,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    4,
    5,
    6,
    7,
    8,
    9,
    5,
    6,
    7,
    8,
    9,
    6,
    7,
    8,
    9,
    7,
    8,
    9,
    8,
    9,
    9,
  ],
  ys: [
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    6,
    6,
    6,
    6,
    7,
    7,
    7,
    8,
    8,
    9,
  ],
};

export const template17: Template = {
  data:
    "data:text/plain,{\"name\":\"Mandala 0x0000000000000000000000000000000000000000\",\"description\":\"A Unique Mandala\",\"image\":\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' shape-rendering='crispEdges' width='512' height='512'><g transform='scale(64)'><image width='8' height='8' style='image-rendering: pixelated;' href='data:image/gif;base64,R0lGODdhEQARAMQAAAAAAPb+Y/7EJfN3NNARQUUKLG0bMsR1SujKqW7wQwe/dQBcmQeEqjDR0UgXo4A0vrlq2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkKAAAALAAAAAARABEAAAdFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEoAAAAAAAAAAAAAAAAAAAAAAAAGBADs='/></g></svg>\"}",
  bitmap_data_pos: 521,
  address_data_pos: 74,
  width: 17,
  height: 17,
  row_per_block: 4,
  xs: [
    2,
    3,
    5,
    7,
    8,
    1,
    2,
    3,
    5,
    6,
    7,
    8,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    3,
    4,
    5,
    6,
    7,
    8,
    4,
    5,
    6,
    7,
    8,
    5,
    6,
    7,
    8,
    6,
    7,
    8,
    7,
    8,
    8,
  ],
  ys: [
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    6,
    6,
    6,
    7,
    7,
    8,
  ],
};

export function generateTokenURI(id: string, template: Template): string {
  let metadata = template.data;
  const bn = BigNumber.from(id);

  metadata = writeUintAsHex(metadata, template.address_data_pos, bn);

  for (let i = 0; i < 40; i++) {
    let value = bn
      .shr((40 - (i + 1)) * 4)
      .mod(16)
      .toNumber();
    if (value == 0) {
      value = 16; // use black as oposed to transparent
    }
    const x = template.xs[i];
    const y = template.ys[i];
    metadata = setCharacter(
      metadata,
      template.bitmap_data_pos,
      y * template.width + x + Math.floor(y / template.row_per_block) * 2 + 1,
      value
    );

    if (x != y) {
      metadata = setCharacter(
        metadata,
        template.bitmap_data_pos,
        x * template.width + y + Math.floor(x / template.row_per_block) * 2 + 1,
        value
      );
      if (y != Math.floor(template.height / 2)) {
        metadata = setCharacter(
          metadata,
          template.bitmap_data_pos,
          x * template.width +
            (template.width - y - 1) +
            Math.floor(x / template.row_per_block) * 2 +
            1,
          value
        ); // x mirror
      }

      if (x != Math.floor(template.width / 2)) {
        metadata = setCharacter(
          metadata,
          template.bitmap_data_pos,
          (template.height - x - 1) * template.width +
            y +
            Math.floor((template.height - x - 1) / template.row_per_block) * 2 +
            1,
          value
        ); // y mirror
      }

      if (
        x != Math.floor(template.width / 2) &&
        y != Math.floor(template.height / 2)
      ) {
        metadata = setCharacter(
          metadata,
          template.bitmap_data_pos,
          (template.height - x - 1) * template.width +
            (template.width - y - 1) +
            Math.floor((template.height - x - 1) / template.row_per_block) * 2 +
            1,
          value
        ); // x,y mirror
      }
    }

    if (x != Math.floor(template.width / 2)) {
      metadata = setCharacter(
        metadata,
        template.bitmap_data_pos,
        y * template.width +
          (template.width - x - 1) +
          Math.floor(y / template.row_per_block) * 2 +
          1,
        value
      ); // x mirror
    }
    if (y != Math.floor(template.height / 2)) {
      metadata = setCharacter(
        metadata,
        template.bitmap_data_pos,
        (template.height - y - 1) * template.width +
          x +
          Math.floor((template.height - y - 1) / template.row_per_block) * 2 +
          1,
        value
      ); // y mirror
    }

    if (
      x != Math.floor(template.width / 2) &&
      y != Math.floor(template.height / 2)
    ) {
      metadata = setCharacter(
        metadata,
        template.bitmap_data_pos,
        (template.height - y - 1) * template.width +
          (template.width - x - 1) +
          Math.floor((template.height - y - 1) / template.row_per_block) * 2 +
          1,
        value
      ); // x,y mirror
    }
  }
  // fix for firefox :(
  return metadata.replace(
    'image-rendering: pixelated;',
    'image-rendering: pixelated; image-rendering: crisp-edges;'
  );
}

export const pure_svg_template_19_bis: Template = {
  data:
    "data:text/plain,{\"name\":\"Mandala 0x0000000000000000000000000000000000000000\",\"description\":\"A Unique Mandala\",\"image\":\"data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' shape-rendering='crispEdges' width='1216' height='1216'><defs><path id='Z' d='M0,0h1v1h-1z'/><use id='0' href='%23Z' fill='%23f6fe63'/><use id='1' href='%23Z' fill='%23fec425'/><use id='2' href='%23Z' fill='%23f37734'/><use id='3' href='%23Z' fill='%23d01141'/><use id='4' href='%23Z' fill='%23450a2c'/><use id='5' href='%23Z' fill='%236d1b32'/><use id='6' href='%23Z' fill='%23c4754a'/><use id='7' href='%23Z' fill='%23e8caa9'/><use id='8' href='%23Z' fill='%236ef043'/><use id='9' href='%23Z' fill='%2307bf75'/><use id='a' href='%23Z' fill='%23005c99'/><use id='b' href='%23Z' fill='%230784aa'/><use id='c' href='%23Z' fill='%2330d1d1'/><use id='d' href='%23Z' fill='%234817a3'/><use id='e' href='%23Z' fill='%238034be'/><use id='f' href='%23Z' fill='%23b96ad8'/></defs><g transform='scale(64)'><use x='00' y='00' href='%23 '/><use x='01' y='00' href='%23 '/><use x='02' y='00' href='%23 '/><use x='03' y='00' href='%23 '/><use x='04' y='00' href='%23 '/><use x='05' y='00' href='%23 '/><use x='06' y='00' href='%23 '/><use x='07' y='00' href='%23 '/><use x='08' y='00' href='%23 '/><use x='09' y='00' href='%23 '/><use x='10' y='00' href='%23 '/><use x='11' y='00' href='%23 '/><use x='12' y='00' href='%23 '/><use x='13' y='00' href='%23 '/><use x='14' y='00' href='%23 '/><use x='15' y='00' href='%23 '/><use x='16' y='00' href='%23 '/><use x='17' y='00' href='%23 '/><use x='18' y='00' href='%23 '/><use x='00' y='01' href='%23 '/><use x='01' y='01' href='%23 '/><use x='02' y='01' href='%23 '/><use x='03' y='01' href='%23 '/><use x='04' y='01' href='%23 '/><use x='05' y='01' href='%23 '/><use x='06' y='01' href='%23 '/><use x='07' y='01' href='%23 '/><use x='08' y='01' href='%23 '/><use x='09' y='01' href='%23 '/><use x='10' y='01' href='%23 '/><use x='11' y='01' href='%23 '/><use x='12' y='01' href='%23 '/><use x='13' y='01' href='%23 '/><use x='14' y='01' href='%23 '/><use x='15' y='01' href='%23 '/><use x='16' y='01' href='%23 '/><use x='17' y='01' href='%23 '/><use x='18' y='01' href='%23 '/><use x='00' y='02' href='%23 '/><use x='01' y='02' href='%23 '/><use x='02' y='02' href='%23 '/><use x='03' y='02' href='%23 '/><use x='04' y='02' href='%23 '/><use x='05' y='02' href='%23 '/><use x='06' y='02' href='%23 '/><use x='07' y='02' href='%23 '/><use x='08' y='02' href='%23 '/><use x='09' y='02' href='%23 '/><use x='10' y='02' href='%23 '/><use x='11' y='02' href='%23 '/><use x='12' y='02' href='%23 '/><use x='13' y='02' href='%23 '/><use x='14' y='02' href='%23 '/><use x='15' y='02' href='%23 '/><use x='16' y='02' href='%23 '/><use x='17' y='02' href='%23 '/><use x='18' y='02' href='%23 '/><use x='00' y='03' href='%23 '/><use x='01' y='03' href='%23 '/><use x='02' y='03' href='%23 '/><use x='03' y='03' href='%23 '/><use x='04' y='03' href='%23 '/><use x='05' y='03' href='%23 '/><use x='06' y='03' href='%23 '/><use x='07' y='03' href='%23 '/><use x='08' y='03' href='%23 '/><use x='09' y='03' href='%23 '/><use x='10' y='03' href='%23 '/><use x='11' y='03' href='%23 '/><use x='12' y='03' href='%23 '/><use x='13' y='03' href='%23 '/><use x='14' y='03' href='%23 '/><use x='15' y='03' href='%23 '/><use x='16' y='03' href='%23 '/><use x='17' y='03' href='%23 '/><use x='18' y='03' href='%23 '/><use x='00' y='04' href='%23 '/><use x='01' y='04' href='%23 '/><use x='02' y='04' href='%23 '/><use x='03' y='04' href='%23 '/><use x='04' y='04' href='%23 '/><use x='05' y='04' href='%23 '/><use x='06' y='04' href='%23 '/><use x='07' y='04' href='%23 '/><use x='08' y='04' href='%23 '/><use x='09' y='04' href='%23 '/><use x='10' y='04' href='%23 '/><use x='11' y='04' href='%23 '/><use x='12' y='04' href='%23 '/><use x='13' y='04' href='%23 '/><use x='14' y='04' href='%23 '/><use x='15' y='04' href='%23 '/><use x='16' y='04' href='%23 '/><use x='17' y='04' href='%23 '/><use x='18' y='04' href='%23 '/><use x='00' y='05' href='%23 '/><use x='01' y='05' href='%23 '/><use x='02' y='05' href='%23 '/><use x='03' y='05' href='%23 '/><use x='04' y='05' href='%23 '/><use x='05' y='05' href='%23 '/><use x='06' y='05' href='%23 '/><use x='07' y='05' href='%23 '/><use x='08' y='05' href='%23 '/><use x='09' y='05' href='%23 '/><use x='10' y='05' href='%23 '/><use x='11' y='05' href='%23 '/><use x='12' y='05' href='%23 '/><use x='13' y='05' href='%23 '/><use x='14' y='05' href='%23 '/><use x='15' y='05' href='%23 '/><use x='16' y='05' href='%23 '/><use x='17' y='05' href='%23 '/><use x='18' y='05' href='%23 '/><use x='00' y='06' href='%23 '/><use x='01' y='06' href='%23 '/><use x='02' y='06' href='%23 '/><use x='03' y='06' href='%23 '/><use x='04' y='06' href='%23 '/><use x='05' y='06' href='%23 '/><use x='06' y='06' href='%23 '/><use x='07' y='06' href='%23 '/><use x='08' y='06' href='%23 '/><use x='09' y='06' href='%23 '/><use x='10' y='06' href='%23 '/><use x='11' y='06' href='%23 '/><use x='12' y='06' href='%23 '/><use x='13' y='06' href='%23 '/><use x='14' y='06' href='%23 '/><use x='15' y='06' href='%23 '/><use x='16' y='06' href='%23 '/><use x='17' y='06' href='%23 '/><use x='18' y='06' href='%23 '/><use x='00' y='07' href='%23 '/><use x='01' y='07' href='%23 '/><use x='02' y='07' href='%23 '/><use x='03' y='07' href='%23 '/><use x='04' y='07' href='%23 '/><use x='05' y='07' href='%23 '/><use x='06' y='07' href='%23 '/><use x='07' y='07' href='%23 '/><use x='08' y='07' href='%23 '/><use x='09' y='07' href='%23 '/><use x='10' y='07' href='%23 '/><use x='11' y='07' href='%23 '/><use x='12' y='07' href='%23 '/><use x='13' y='07' href='%23 '/><use x='14' y='07' href='%23 '/><use x='15' y='07' href='%23 '/><use x='16' y='07' href='%23 '/><use x='17' y='07' href='%23 '/><use x='18' y='07' href='%23 '/><use x='00' y='08' href='%23 '/><use x='01' y='08' href='%23 '/><use x='02' y='08' href='%23 '/><use x='03' y='08' href='%23 '/><use x='04' y='08' href='%23 '/><use x='05' y='08' href='%23 '/><use x='06' y='08' href='%23 '/><use x='07' y='08' href='%23 '/><use x='08' y='08' href='%23 '/><use x='09' y='08' href='%23 '/><use x='10' y='08' href='%23 '/><use x='11' y='08' href='%23 '/><use x='12' y='08' href='%23 '/><use x='13' y='08' href='%23 '/><use x='14' y='08' href='%23 '/><use x='15' y='08' href='%23 '/><use x='16' y='08' href='%23 '/><use x='17' y='08' href='%23 '/><use x='18' y='08' href='%23 '/><use x='00' y='09' href='%23 '/><use x='01' y='09' href='%23 '/><use x='02' y='09' href='%23 '/><use x='03' y='09' href='%23 '/><use x='04' y='09' href='%23 '/><use x='05' y='09' href='%23 '/><use x='06' y='09' href='%23 '/><use x='07' y='09' href='%23 '/><use x='08' y='09' href='%23 '/><use x='09' y='09' href='%23 '/><use x='10' y='09' href='%23 '/><use x='11' y='09' href='%23 '/><use x='12' y='09' href='%23 '/><use x='13' y='09' href='%23 '/><use x='14' y='09' href='%23 '/><use x='15' y='09' href='%23 '/><use x='16' y='09' href='%23 '/><use x='17' y='09' href='%23 '/><use x='18' y='09' href='%23 '/><use x='00' y='10' href='%23 '/><use x='01' y='10' href='%23 '/><use x='02' y='10' href='%23 '/><use x='03' y='10' href='%23 '/><use x='04' y='10' href='%23 '/><use x='05' y='10' href='%23 '/><use x='06' y='10' href='%23 '/><use x='07' y='10' href='%23 '/><use x='08' y='10' href='%23 '/><use x='09' y='10' href='%23 '/><use x='10' y='10' href='%23 '/><use x='11' y='10' href='%23 '/><use x='12' y='10' href='%23 '/><use x='13' y='10' href='%23 '/><use x='14' y='10' href='%23 '/><use x='15' y='10' href='%23 '/><use x='16' y='10' href='%23 '/><use x='17' y='10' href='%23 '/><use x='18' y='10' href='%23 '/><use x='00' y='11' href='%23 '/><use x='01' y='11' href='%23 '/><use x='02' y='11' href='%23 '/><use x='03' y='11' href='%23 '/><use x='04' y='11' href='%23 '/><use x='05' y='11' href='%23 '/><use x='06' y='11' href='%23 '/><use x='07' y='11' href='%23 '/><use x='08' y='11' href='%23 '/><use x='09' y='11' href='%23 '/><use x='10' y='11' href='%23 '/><use x='11' y='11' href='%23 '/><use x='12' y='11' href='%23 '/><use x='13' y='11' href='%23 '/><use x='14' y='11' href='%23 '/><use x='15' y='11' href='%23 '/><use x='16' y='11' href='%23 '/><use x='17' y='11' href='%23 '/><use x='18' y='11' href='%23 '/><use x='00' y='12' href='%23 '/><use x='01' y='12' href='%23 '/><use x='02' y='12' href='%23 '/><use x='03' y='12' href='%23 '/><use x='04' y='12' href='%23 '/><use x='05' y='12' href='%23 '/><use x='06' y='12' href='%23 '/><use x='07' y='12' href='%23 '/><use x='08' y='12' href='%23 '/><use x='09' y='12' href='%23 '/><use x='10' y='12' href='%23 '/><use x='11' y='12' href='%23 '/><use x='12' y='12' href='%23 '/><use x='13' y='12' href='%23 '/><use x='14' y='12' href='%23 '/><use x='15' y='12' href='%23 '/><use x='16' y='12' href='%23 '/><use x='17' y='12' href='%23 '/><use x='18' y='12' href='%23 '/><use x='00' y='13' href='%23 '/><use x='01' y='13' href='%23 '/><use x='02' y='13' href='%23 '/><use x='03' y='13' href='%23 '/><use x='04' y='13' href='%23 '/><use x='05' y='13' href='%23 '/><use x='06' y='13' href='%23 '/><use x='07' y='13' href='%23 '/><use x='08' y='13' href='%23 '/><use x='09' y='13' href='%23 '/><use x='10' y='13' href='%23 '/><use x='11' y='13' href='%23 '/><use x='12' y='13' href='%23 '/><use x='13' y='13' href='%23 '/><use x='14' y='13' href='%23 '/><use x='15' y='13' href='%23 '/><use x='16' y='13' href='%23 '/><use x='17' y='13' href='%23 '/><use x='18' y='13' href='%23 '/><use x='00' y='14' href='%23 '/><use x='01' y='14' href='%23 '/><use x='02' y='14' href='%23 '/><use x='03' y='14' href='%23 '/><use x='04' y='14' href='%23 '/><use x='05' y='14' href='%23 '/><use x='06' y='14' href='%23 '/><use x='07' y='14' href='%23 '/><use x='08' y='14' href='%23 '/><use x='09' y='14' href='%23 '/><use x='10' y='14' href='%23 '/><use x='11' y='14' href='%23 '/><use x='12' y='14' href='%23 '/><use x='13' y='14' href='%23 '/><use x='14' y='14' href='%23 '/><use x='15' y='14' href='%23 '/><use x='16' y='14' href='%23 '/><use x='17' y='14' href='%23 '/><use x='18' y='14' href='%23 '/><use x='00' y='15' href='%23 '/><use x='01' y='15' href='%23 '/><use x='02' y='15' href='%23 '/><use x='03' y='15' href='%23 '/><use x='04' y='15' href='%23 '/><use x='05' y='15' href='%23 '/><use x='06' y='15' href='%23 '/><use x='07' y='15' href='%23 '/><use x='08' y='15' href='%23 '/><use x='09' y='15' href='%23 '/><use x='10' y='15' href='%23 '/><use x='11' y='15' href='%23 '/><use x='12' y='15' href='%23 '/><use x='13' y='15' href='%23 '/><use x='14' y='15' href='%23 '/><use x='15' y='15' href='%23 '/><use x='16' y='15' href='%23 '/><use x='17' y='15' href='%23 '/><use x='18' y='15' href='%23 '/><use x='00' y='16' href='%23 '/><use x='01' y='16' href='%23 '/><use x='02' y='16' href='%23 '/><use x='03' y='16' href='%23 '/><use x='04' y='16' href='%23 '/><use x='05' y='16' href='%23 '/><use x='06' y='16' href='%23 '/><use x='07' y='16' href='%23 '/><use x='08' y='16' href='%23 '/><use x='09' y='16' href='%23 '/><use x='10' y='16' href='%23 '/><use x='11' y='16' href='%23 '/><use x='12' y='16' href='%23 '/><use x='13' y='16' href='%23 '/><use x='14' y='16' href='%23 '/><use x='15' y='16' href='%23 '/><use x='16' y='16' href='%23 '/><use x='17' y='16' href='%23 '/><use x='18' y='16' href='%23 '/><use x='00' y='17' href='%23 '/><use x='01' y='17' href='%23 '/><use x='02' y='17' href='%23 '/><use x='03' y='17' href='%23 '/><use x='04' y='17' href='%23 '/><use x='05' y='17' href='%23 '/><use x='06' y='17' href='%23 '/><use x='07' y='17' href='%23 '/><use x='08' y='17' href='%23 '/><use x='09' y='17' href='%23 '/><use x='10' y='17' href='%23 '/><use x='11' y='17' href='%23 '/><use x='12' y='17' href='%23 '/><use x='13' y='17' href='%23 '/><use x='14' y='17' href='%23 '/><use x='15' y='17' href='%23 '/><use x='16' y='17' href='%23 '/><use x='17' y='17' href='%23 '/><use x='18' y='17' href='%23 '/><use x='00' y='18' href='%23 '/><use x='01' y='18' href='%23 '/><use x='02' y='18' href='%23 '/><use x='03' y='18' href='%23 '/><use x='04' y='18' href='%23 '/><use x='05' y='18' href='%23 '/><use x='06' y='18' href='%23 '/><use x='07' y='18' href='%23 '/><use x='08' y='18' href='%23 '/><use x='09' y='18' href='%23 '/><use x='10' y='18' href='%23 '/><use x='11' y='18' href='%23 '/><use x='12' y='18' href='%23 '/><use x='13' y='18' href='%23 '/><use x='14' y='18' href='%23 '/><use x='15' y='18' href='%23 '/><use x='16' y='18' href='%23 '/><use x='17' y='18' href='%23 '/><use x='18' y='18' href='%23 '/></g></svg>\"}",
  bitmap_data_pos: 865 + 151,
  address_data_pos: 74,
  width: 19,
  height: 19,
  row_per_block: 1,
  xs: [
    8,
    9,
    3,
    4,
    8,
    9,
    3,
    4,
    6,
    7,
    8,
    9,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    4,
    5,
    6,
    7,
    8,
    9,
    5,
    6,
    7,
    8,
    9,
    6,
    7,
    8,
    9,
    7,
    8,
    9,
    8,
    9,
    9,
  ],
  ys: [
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    6,
    6,
    6,
    6,
    7,
    7,
    7,
    8,
    8,
    9,
  ],
};

function setSVGQuad(
  metadata: string,
  base: number,
  pos: number,
  value: number
): string {
  value--;
  metadata = changeAt(metadata, base + pos, value.toString(16));
  return metadata;
}

export function generatePureSVGTokenURI(
  id: string,
  template: Template
): string {
  let metadata = template.data;
  const bn = BigNumber.from(id);

  metadata = writeUintAsHex(metadata, template.address_data_pos, bn);

  for (let i = 0; i < 40; i++) {
    let value = bn
      .shr((40 - (i + 1)) * 4)
      .mod(16)
      .toNumber();
    if (value == 0) {
      value = 16; // use black as oposed to transparent
    }
    const x = template.xs[i];
    const y = template.ys[i];
    metadata = setSVGQuad(
      metadata,
      template.bitmap_data_pos,
      (y * template.width + x) * 32,
      value
    );

    if (x != y) {
      metadata = setSVGQuad(
        metadata,
        template.bitmap_data_pos,
        (x * template.width + y) * 32,
        value
      );
      if (y != Math.floor(template.height / 2)) {
        metadata = setSVGQuad(
          metadata,
          template.bitmap_data_pos,
          (x * template.width + (template.width - y - 1)) * 32,
          value
        ); // x mirror
      }

      if (x != Math.floor(template.width / 2)) {
        metadata = setSVGQuad(
          metadata,
          template.bitmap_data_pos,
          ((template.height - x - 1) * template.width + y) * 32,
          value
        ); // y mirror
      }

      if (
        x != Math.floor(template.width / 2) &&
        y != Math.floor(template.height / 2)
      ) {
        metadata = setSVGQuad(
          metadata,
          template.bitmap_data_pos,
          ((template.height - x - 1) * template.width +
            (template.width - y - 1)) *
            32,
          value
        ); // x,y mirror
      }
    }

    if (x != Math.floor(template.width / 2)) {
      metadata = setSVGQuad(
        metadata,
        template.bitmap_data_pos,
        (y * template.width + (template.width - x - 1)) * 32,
        value
      ); // x mirror
    }
    if (y != Math.floor(template.height / 2)) {
      metadata = setSVGQuad(
        metadata,
        template.bitmap_data_pos,
        ((template.height - y - 1) * template.width + x) * 32,
        value
      ); // y mirror
    }

    if (
      x != Math.floor(template.width / 2) &&
      y != Math.floor(template.height / 2)
    ) {
      metadata = setSVGQuad(
        metadata,
        template.bitmap_data_pos,
        ((template.height - y - 1) * template.width +
          (template.width - x - 1)) *
          32,
        value
      ); // x,y mirror
    }
  }

  return metadata;
}

// does not work with above generated svg
export function generateBitmapFromURL(url: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1216;
  canvas.height = 1216;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Cannot create canvas context');
  }
  const image = new Image();
  image.src = url;
  context.drawImage(image, 1216, 1216);
  return canvas.toDataURL();
}

const colors = [
  '#000',
  '#f6fe63',
  '#fec425',
  '#f37734',
  '#d01141',
  '#450a2c',
  '#6d1b32',
  '#c4754a',
  '#e8caa9',
  '#6ef043',
  '#07bf75',
  '#005c99',
  '#0784aa',
  '#30d1d1',
  '#4817a3',
  '#8034be',
  '#b96ad8',
];

function setCanvasPixels(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number
): void {
  context.fillStyle = colors[value];
  context.fillRect(x * 64, y * 64, 64, 64);
}

export function generateBitmapDataURI(id: string, template: Template): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1216;
  canvas.height = 1216;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Cannot create canvas context');
  }
  const bn = BigNumber.from(id);
  for (let i = 0; i < 40; i++) {
    let value = bn
      .shr((40 - (i + 1)) * 4)
      .mod(16)
      .toNumber();
    if (value == 0) {
      value = 16; // use black as oposed to transparent
    }
    const x = template.xs[i];
    const y = template.ys[i];
    setCanvasPixels(context, x, y, value);

    if (x != y) {
      setCanvasPixels(context, y, x, value);
      if (y != Math.floor(template.height / 2)) {
        setCanvasPixels(context, template.width - y - 1, x, value);
      }

      if (x != Math.floor(template.width / 2)) {
        setCanvasPixels(context, y, template.height - x - 1, value);
      }

      if (
        x != Math.floor(template.width / 2) &&
        y != Math.floor(template.height / 2)
      ) {
        setCanvasPixels(
          context,
          template.width - y - 1,
          template.height - x - 1,
          value
        );
      }
    }

    if (x != Math.floor(template.width / 2)) {
      setCanvasPixels(context, template.width - x - 1, y, value);
    }
    if (y != Math.floor(template.height / 2)) {
      setCanvasPixels(context, x, template.height - y - 1, value);
    }

    if (
      x != Math.floor(template.width / 2) &&
      y != Math.floor(template.height / 2)
    ) {
      setCanvasPixels(
        context,
        template.width - x - 1,
        template.height - y - 1,
        value
      );
    }
  }
  return canvas.toDataURL();
}
