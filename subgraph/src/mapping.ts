/* eslint-disable */
import {Bytes, ByteArray, BigInt, Address} from '@graphprotocol/graph-ts';
import {Burned, Minted, Transfer} from '../generated/MandalaToken/MandalaTokenContract';
import {All, Mandala, Owner} from '../generated/schema';
// import {log} from '@graphprotocol/graph-ts';


let ZERO_ADDRESS: Bytes = Bytes.fromHexString('0x0000000000000000000000000000000000000000') as Bytes;
let ZERO = BigInt.fromI32(0);
let ONE = BigInt.fromI32(1);

function handleOwnerViaId(id: string): Owner {
  let entity = Owner.load(id);
  if (entity) {
    return entity as Owner;
  }
  entity = new Owner(id);
  entity.numMandalas = ZERO;
  entity.numMandalasMinted = ZERO;
  entity.save();
  return entity as Owner;
}

function handleAll(): All {
  let all = All.load('all');
  if (!all) {
    all = new All('all');
    all.numMandalas = ZERO;
    all.numMandalasMinted = ZERO;
    all.numMinters = ZERO;
    all.numOwners = ZERO;
  }
  return all as All;
}

function handleMandala(id : BigInt, minter: Address): Mandala {
  let mandalaId = id.toString();
  let entity = Mandala.load(mandalaId)
  if (!entity) {
    entity = new Mandala(mandalaId);
    entity.minter = minter.toHexString();
  }
  return entity as Mandala;
}


export function handleMinted(event: Minted): void {
  let all = handleAll();
  all.numMandalas = all.numMandalas.plus(ONE);
  all.numMandalasMinted = all.numMandalasMinted.plus(ONE);

  let mandala = handleMandala(event.params.id, event.transaction.from);
  mandala.save();

  let owner = handleOwnerViaId(mandala.minter)
  if (owner.numMandalasMinted.equals(ZERO)) {
    all.numMinters = all.numMinters.plus(ONE);
  }
  owner.numMandalasMinted = owner.numMandalasMinted.plus(ONE);
  owner.save();

  all.save();
}


export function handleBurned(event: Burned): void {
  let all = handleAll();
  all.numMandalas = all.numMandalas.minus(ONE);
  let mandala = Mandala.load(event.params.id.toString())
  mandala.owner = null;
  mandala.save();

  all.save();
}


export function handleTransfer(event: Transfer): void {
  let all = handleAll();
  let mandala = handleMandala(event.params.tokenId, event.transaction.from)

  let to = event.params.to.toHexString();
  let from = event.params.from.toHexString();
  if (event.params.from == ZERO_ADDRESS) {
    mandala.owner = event.params.to.toHexString();

    let owner = handleOwnerViaId(to);
    if (owner.numMandalas.equals(ZERO)) {
      all.numOwners = all.numOwners.plus(ONE);
    }
    owner.numMandalas = owner.numMandalas.plus(ONE);
    owner.save();

  } else if (event.params.to == ZERO_ADDRESS) {
    mandala.owner = null;

    let owner = handleOwnerViaId(from);
    owner.numMandalas = owner.numMandalas.minus(ONE);
    if (owner.numMandalas.equals(ZERO)) {
      all.numOwners = all.numOwners.minus(ONE);
    }
    owner.save();
  } else {
    let ownerTo = handleOwnerViaId(to);
    ownerTo.numMandalas = ownerTo.numMandalas.plus(ONE);
    ownerTo.save();

    let ownerFrom =handleOwnerViaId(from);
    ownerFrom.numMandalas = ownerFrom.numMandalas.minus(ONE);
    ownerFrom.save();
  }
  mandala.save();
  all.save();
}
