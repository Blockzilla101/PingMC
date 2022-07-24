import { IResult } from './Result.ts';

export interface IPacket {
    id: number;
    bytes: Uint8Array;
}

export interface IDecodedPacket extends IPacket {
    result: IResult | any;
}
