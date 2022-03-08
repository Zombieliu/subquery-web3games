import {SubstrateEvent, SubstrateExtrinsic} from "@subql/types";
import {
    AccountTransfer, NewAccountCreate,
    AccountBalance, TokenFungibleCreate, TokenNonFungibleCreate, BlockInfo, ExtrinsicInfo, EventInfo, Account
} from "../types";
import {Balance,AccountId,Moment} from "@polkadot/types/interfaces";
import {Compact} from '@polkadot/types';
import {SubstrateBlock} from "@subql/types/dist/interfaces";


export async function handleBlockInfo(block: SubstrateBlock): Promise<void> {
    const record = new BlockInfo(block.block.header.hash.toString());

    record.BlockHeight = block.block.header.number.toString();
    record.ParentBlockHash = block.block.header.parentHash.toString();
    record.ExtrinsicNumber = block.block.extrinsics.length;
    record.State = block.block.header.stateRoot.toString();
    record.ContentHash = block.block.contentHash.toString();
    record.ExtrinsicsHash = block.block.header.extrinsicsRoot.toString();
    record.EventNumber = block.events.length;
    // time
    const moment = block.block.extrinsics[0].args[0] as Compact<Moment>
    record.timestamp = new Date(moment.toNumber());
    await record.save();
}


export async function handleExtrinsic(extrinsic: SubstrateExtrinsic): Promise<void> {

    const record = new ExtrinsicInfo(extrinsic.extrinsic.hash.toString());

    await makeSureBlock(extrinsic.block)

    record.BlockHashId = extrinsic.block.block.header.hash.toString();

    record.ExtrinsicHeight = `${extrinsic.block.block.header.number}-${extrinsic.idx}`;

    // record.Signer = extrinsic.extrinsic.signer.toString();
    await makeSureAccount((extrinsic.extrinsic.signer as unknown as AccountId).toString());
    record.SignerId = (extrinsic.extrinsic.signer as unknown as AccountId).toString();

    record.method = extrinsic.extrinsic.method.toString();
    record.nonce = extrinsic.extrinsic.nonce.toBigInt();
    record.tip = extrinsic.extrinsic.tip.toBigInt();
    record.meta = extrinsic.extrinsic.meta.toString();
    record.success = extrinsic.success;
    const moment = extrinsic.block.block.extrinsics[0].args[0] as Compact<Moment>
    record.timestamp = new Date(moment.toNumber());
    await record.save();
}

async function makeSureAccount(accountId:string) :Promise<void>{
    const checkAccount = await Account.get(accountId);
    if (!checkAccount){
        await new Account(accountId).save();
    }
}


async function makeSureBlock(block) :Promise<void>{
    const checkBlock = await BlockInfo.get(block.block.header.hash.toString());
    if (!checkBlock){
        await new BlockInfo(block.block.header.hash.toString()).save();
    }
}



export async function handleEvent(event: SubstrateEvent): Promise<void> {
    const record = new EventInfo(`${event.extrinsic.block.block.header.number}-${event.extrinsic.idx}-${event.idx}`);
    await makeSureExtrinsic(event.extrinsic);
    record.ExtrinsicHashId = event.extrinsic.extrinsic.hash.toString();
    record.EventID = event.idx;
    record.method = event.event.method;
    record.section = event.event.section;
    record.meta = event.event.meta.toString();
    record.data = event.event.data.toString();
    await record.save();
}

async function makeSureExtrinsic(extrinsic) :Promise<void>{
    const checkExtrinsic = await ExtrinsicInfo.get(extrinsic.extrinsic.hash.toString())
    if (!checkExtrinsic){
        await new ExtrinsicInfo(extrinsic.extrinsic.hash.toString()).save();
    }
}

// export async function handleTimestampSet(extrinsic: SubstrateExtrinsic): Promise<void> {
//     const record = new BlockTs(extrinsic.block.block.header.hash.toString());
//     record.blockHeight = extrinsic.block.block.header.number.toBigInt();
//     const moment = extrinsic.extrinsic.args[0] as Compact<Moment>;
//     record.timestamp = new Date(moment.toNumber());
//     await record.save();
// }

export async function handleAccountTransfer(event: SubstrateEvent): Promise<void> {

    const record = new AccountTransfer(`${event.extrinsic.extrinsic.hash.toString()}`)
    const {event: {data: [from,to,amount]}} = event;
    record.ExtrinsicHeight = `${event.block.block.header.number.toString()}-${event.extrinsic.idx}`
    record.FromAccount = (from as AccountId).toString();
    record.ToAccount = (to as AccountId).toString();
    record.Balance = (amount as Balance).toBigInt();
    const moment = event.extrinsic.block.block.extrinsics[0].args[0] as Compact<Moment>
    record.timestamp = new Date(moment.toNumber());
    await record.save();
}

export async function handleNewAccountCreate(event: SubstrateEvent): Promise<void> {

    const record = new NewAccountCreate(`${event.block.block.header.number.toString()}--${event.idx}`)
    const {event: {data: [from,amount]}} = event;

    record.Account = (from as AccountId).toString();
    record.Balance = (amount as Balance).toBigInt();
    await record.save();
}

export async function handleAccountBalance(event: SubstrateEvent): Promise<void> {
    const {event: {data: [account, balance]}} = event;
    let record = new AccountBalance(event.extrinsic.block.block.header.hash.toString());
    record.account = account.toString();
    record.balance = (balance as Balance).toBigInt();
    await record.save();
}

export async function handleTokenFungibleCreate(event: SubstrateEvent): Promise<void> {
    const {event: {data: [id, account,name,symbol,decimals]}} = event;
    let record = new TokenFungibleCreate(event.extrinsic.block.block.header.hash.toString());
    record.tokenId = (id as Compact<Moment>).toBigInt();
    record.account = account.toString();
    record.name = name.toString();
    record.symbol = symbol.toString();
    record.decimals = (decimals as Compact<Moment>).toNumber()
    await record.save();
}

export async function handleTokenNonFungibleCreate(event: SubstrateEvent): Promise<void> {
    const {event: {data: [id, account,name,symbol,base_uri]}} = event;
    let record = new TokenNonFungibleCreate(event.extrinsic.block.block.header.hash.toString());
    record.tokenId = (id as Compact<Moment>).toBigInt();
    record.account = account.toString();
    record.name = name.toString();
    record.symbol = symbol.toString();
    record.base_uri = base_uri.toString()
    await record.save();
}

// export async function handleAccountTransfer(event: SubstrateEvent): Promise<void> {
//
//     const record = new Transfer(`${event.block.block.header.number.toString()}--${event.idx}`)
//     const {event: {data: [fromAccount, toAccount,amount]}} = event;
//
//     record.from = (fromAccount as AccountId).toString();
//     record.to = (toAccount as AccountId).toString();
//     record.amount = (amount as Balance).toBigInt();
//     await record.save();
// }
//

