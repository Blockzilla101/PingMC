import { IResult } from './Result.ts';

export interface IPacket {
    id: number;
    bytes: Uint8Array;
}

export interface IDecodedPacket<Id extends (0 | 1)> extends IPacket {
    result: Id extends 0 ? IResult : number;
}
