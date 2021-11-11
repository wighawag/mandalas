/* eslint-disable */
import {Bytes, ByteArray, BigInt, Address} from '@graphprotocol/graph-ts';
import {Burned, Minted, Transfer} from '../generated/MandalaToken/MandalaTokenContract';
import {All, Mandala, Owner} from '../generated/schema';
// import {log} from '@graphprotocol/graph-ts';


let ZERO_ADDRESS: Bytes = Bytes.fromHexString('0x0000000000000000000000000000000000000000') as Bytes;
let ZERO = BigInt.fromI32(0);
let ONE = BigInt.fromI32(1);


export function handleMinted(event: Minted): void {
  let all = All.load('all');
  if (!all) {
    all = new All('all');
    all.numMandalas = ZERO;
    all.numMandalasMinted = ZERO;
    all.numMinters = ZERO;
    all.numOwners = ZERO;
  }
  all.numMandalas = all.numMandalas.plus(ONE);
  all.numMandalasMinted = all.numMandalasMinted.plus(ONE);

  let mandalaId = event.params.id.toString();
  let entity = Mandala.load(mandalaId)
  if (!entity) {
    entity = new Mandala(mandalaId);
  }
  entity.minter = event.transaction.from.toHexString();
  entity.save();


  let owner = Owner.load(entity.minter)
  if (!owner) {
    owner = new Owner(entity.minter)
    owner.numMandalas = ZERO;
    owner.numMandalasMinted = ZERO;
  }

  if (owner.numMandalasMinted.equals(ZERO)) {
    all.numMinters = all.numMinters.plus(ONE);
  }

  owner.numMandalasMinted = owner.numMandalasMinted.plus(ONE);
  owner.save();


  all.save();
}


export function handleBurned(event: Burned): void {
  let all = All.load('all');
  if (!all) {
    all = new All('all');
    all.numMandalas = ZERO;
    all.numMandalasMinted = ZERO;
    all.numMinters = ZERO;
    all.numOwners = ZERO;
  }
  all.numMandalas = all.numMandalas.minus(ONE);
  let mandalaId = event.params.id.toString();
  let entity = Mandala.load(mandalaId)
  if (!entity) {
    entity = new Mandala(mandalaId);
    // not possible
  }
  entity.owner = null;
  entity.save();


  all.save();
}


export function handleTransfer(event: Transfer): void {
  let all = All.load('all');
  if (!all) {
    all = new All('all');
    all.numMandalas = ZERO;
    all.numMandalasMinted = ZERO;
    all.numMinters = ZERO;
    all.numOwners = ZERO;
  }
  let mandalaId = event.params.tokenId.toString();
  let entity = Mandala.load(mandalaId)
  if (!entity) {
    entity = new Mandala(mandalaId);
    entity.minter = event.transaction.from.toHexString();
  }
  let newOnwer = event.params.to.toHexString();
  entity.owner = newOnwer == ZERO_ADDRESS.toHexString() ? null : newOnwer;
  entity.save();

  let to = event.params.to.toHexString();
  let from = event.params.from.toHexString();
  if (event.params.from == ZERO_ADDRESS) {
    let owner = Owner.load(to)
    if (!owner) {
      owner = new Owner(to)
      owner.numMandalas = ZERO;
      owner.numMandalasMinted = ZERO;
    }
    if (owner.numMandalas.equals(ZERO)) {
      all.numOwners = all.numOwners.plus(ONE);
    }
    owner.numMandalas = owner.numMandalas.plus(ONE);
    owner.save();
  } else if (event.params.to == ZERO_ADDRESS) {
    let owner = Owner.load(from)
    if (!owner) {
      owner = new Owner(from)
      owner.numMandalas = ZERO;
      owner.numMandalasMinted = ZERO;
    }
    owner.numMandalas = owner.numMandalas.plus(ONE);
    if (owner.numMandalas.equals(ZERO)) {
      all.numOwners = all.numOwners.minus(ONE);
    }
    owner.save();
  } else {
    let ownerTo = Owner.load(to)
    if (!ownerTo) {
      ownerTo = new Owner(to)
      ownerTo.numMandalas = ZERO;
      ownerTo.numMandalasMinted = ZERO;
    }
    ownerTo.numMandalas = ownerTo.numMandalas.plus(ONE);
    ownerTo.save();

    let ownerFrom = Owner.load(from)
    if (!ownerFrom) {
      ownerFrom = new Owner(from)
      ownerFrom.numMandalas = ZERO;
      ownerFrom.numMandalasMinted = ZERO;
    }
    ownerFrom.numMandalas = ownerFrom.numMandalas.minus(ONE);
    ownerFrom.save();
  }
  all.save();
}
